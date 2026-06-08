import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

/**
 * M01 — Business Rule Tests (Playwright page-based)
 * 
 * Mỗi describe dùng user riêng biệt, không share state.
 * Bắt buộc: 1 worker, serial mode.
 */
test.describe.configure({ mode: 'serial' });

// ─── Helper ──────────────────────────────────────────────────
async function resetDB() {
  const { execSync } = require('child_process');
  execSync('node e2e/_reset-db.js', { stdio: 'pipe', timeout: 20000, cwd: process.cwd() });
}

async function restartAPI() {
  const { execSync } = require('child_process');
  execSync('docker compose restart api', { stdio: 'pipe', timeout: 15000 });
}

async function ensureAPI(timeout = 20000) {
  const http = require('http');
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`${BASE}/api/health`, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.setTimeout(2000, () => { req.destroy(); reject(new Error('timeout')); });
      });
      return;
    } catch {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  throw new Error('API not ready');
}

async function uiLogin(page, username, password) {
  await page.goto(`${BASE}/index.html`);
  await page.waitForSelector('#login-username', { timeout: 8000 });
  await page.fill('#login-username', username);
  await page.fill('#login-password', password);
  await page.click('#login-btn');
  await page.waitForTimeout(1500);
  const hash = await page.evaluate(() => window.location.hash);
  const errEl = page.locator('#login-error');
  let errorText = '';
  if (await errEl.isVisible().catch(() => false)) {
    errorText = (await errEl.textContent()) || '';
  }
  return { hash, errorText };
}

async function apiFromPage(page, method, path, body?) {
  return page.evaluate(async ({ method, path, body }) => {
    const token = localStorage.getItem('mtis_token');
    const opts: any = { method, headers: {} };
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    if (body) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(path, opts);
    const data = await res.json();
    return { status: res.status, data };
  }, { method, path, body });
}

// ════════════════════════════════════════════════════════════════
// GLOBAL SETUP — reset DB trước toàn bộ suite
// ════════════════════════════════════════════════════════════════
test.beforeAll(async () => {
  await restartAPI();
  await ensureAPI();
  await resetDB();
  console.log('=== DB reset + API ready ===');
});

// ════════════════════════════════════════════════════════════════
// F-M01-002: Auto-lock (dùng chuyenviem1)
// ════════════════════════════════════════════════════════════════
test.describe('F01-002 Auto-lock', () => {

  test('TC-LOGIN-006: 4 wrong → still active, 5th → locked', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    for (let i = 1; i <= 4; i++) {
      const r = await uiLogin(page, 'chuyenviem1', `wrong${i}`);
      expect(r.errorText).toContain('Sai tên đăng nhập');
      console.log(`L${i}: ${r.errorText}`);
    }

    const r5 = await uiLogin(page, 'chuyenviem1', 'wrong5');
    console.log(`L5: ${r5.errorText}`);
    expect(r5.errorText).toContain('khóa');
  });
});

// ════════════════════════════════════════════════════════════════
// F-M01-008: Lock/Unlock (dùng admin — không bị lock)
// Sau auto-lock, chuyenviem1 đã bị lock, nên unlock test dùng admin
// ════════════════════════════════════════════════════════════════
test.describe('F01-008 Lock/Unlock', () => {

  test('TC-LOCK-001: Admin unlock → chuyenviem1 login được', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Admin login
    const login = await uiLogin(page, 'admin', 'admin123');
    expect(login.hash).toBe('#dashboard');

    // Unlock chuyenviem1 (đã bị lock từ test trước)
    const un = await apiFromPage(page, 'PUT', '/api/users/2/unlock');
    console.log('Unlock result:', un.status);
    expect(un.status).toBe(200);

    await page.evaluate(() => ROUTER.logout());
    await page.waitForTimeout(1000);

    // Now chuyenviem1 login OK
    const r = await uiLogin(page, 'chuyenviem1', 'admin123');
    console.log(`chuyenviem1 after unlock: hash=${r.hash}`);
    expect(r.hash).toBe('#dashboard');
  });

  test('TC-LOCK-002: Admin lock → chuyenviem1 không login được', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Admin login
    const login = await uiLogin(page, 'admin', 'admin123');
    expect(login.hash).toBe('#dashboard');

    // Lock chuyenviem1
    const lk = await apiFromPage(page, 'PUT', '/api/users/2/lock');
    console.log('Lock result:', lk.status);
    expect(lk.status).toBe(200);

    await page.evaluate(() => ROUTER.logout());
    await page.waitForTimeout(1000);

    // chuyenviem1 bị chặn
    const r = await uiLogin(page, 'chuyenviem1', 'admin123');
    console.log(`chuyenviem1 after lock: error=${r.errorText}`);
    expect(r.errorText).toContain('khóa');
  });
});

// ════════════════════════════════════════════════════════════════
// F-M01-003: Tạo user (dùng admin)
// ════════════════════════════════════════════════════════════════
test.describe('F01-003 Create user', () => {

  test('TC-USER-001: Tạo user → login được', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    const login = await uiLogin(page, 'admin', 'admin123');
    expect(login.hash).toBe('#dashboard');

    await page.goto(`${BASE}/index.html#register`);
    await page.waitForTimeout(1000);

    const u = `e2e${Date.now()}`;
    await page.fill('#reg-username', u);
    await page.fill('#reg-fullname', 'E2E Test');
    await page.fill('#reg-email', `${u}@x.v`);
    await page.fill('#reg-password', 'Test@123');
    await page.fill('#reg-confirm', 'Test@123');
    await page.selectOption('#reg-role', 'infrastructure-officer');
    await page.click('#reg-btn');
    await page.waitForTimeout(2000);

    await page.evaluate(() => ROUTER.logout());
    await page.waitForTimeout(1000);

    const r = await uiLogin(page, u, 'Test@123');
    console.log(`New user: hash=${r.hash}`);
    expect(r.hash).toBe('#dashboard');
  });
});

// ════════════════════════════════════════════════════════════════
// F-M01-007: Reset password
// ════════════════════════════════════════════════════════════════
test.describe('F01-007 Forgot/Reset password', () => {

  test('TC-PWD-001: Forgot → reset → login', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto(`${BASE}/index.html#forgot-password`);
    await page.waitForTimeout(800);

    const apiPromise = page.waitForResponse(resp =>
      resp.url().includes('/api/auth/forgot-password') && resp.status() === 200
    );

    await page.fill('#forgot-email', 'admin@mtis.vn');
    await page.click('#forgot-btn');
    await page.waitForTimeout(1000);

    const apiResp = await apiPromise;
    const apiData = await apiResp.json();
    const rawToken = apiData._debug_raw_token;
    console.log('Token:', rawToken);
    expect(rawToken).toBeTruthy();

    await page.goto(`${BASE}/index.html#reset-password/${rawToken}`);
    await page.waitForTimeout(1000);

    await page.fill('#reset-password', 'NewPass@123');
    await page.fill('#reset-confirm', 'NewPass@123');
    await page.click('#reset-btn');
    await page.waitForTimeout(1500);

    // Password đã đổi, dùng admin/NewPass@123
    const r = await uiLogin(page, 'admin', 'NewPass@123');
    console.log(`After reset: hash=${r.hash}`);
    expect(r.hash).toBe('#dashboard');
  });
});

// ════════════════════════════════════════════════════════════════
// F-M01-006: Audit log
// ════════════════════════════════════════════════════════════════
test.describe('F01-006 Audit log', () => {

  test('TC-AUDIT-001: Login log có entries', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Dùng admin với password MỚI
    await uiLogin(page, 'admin', 'wrong1');
    await uiLogin(page, 'admin', 'wrong2');

    const login = await uiLogin(page, 'admin', 'NewPass@123');
    expect(login.hash).toBe('#dashboard');

    await page.goto(`${BASE}/index.html#login-log`);
    await page.waitForTimeout(2000);

    const rows = page.locator('.ant-table tbody tr, table tbody tr');
    const count = await rows.count();
    console.log(`Login log: ${count} rows`);
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
