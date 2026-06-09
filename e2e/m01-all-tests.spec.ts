import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

// Helper: UI login that also stores token in localStorage
async function uiLogin(page, username, password) {
  await page.goto(BASE);
  await page.waitForSelector('#login-username', { timeout: 5000 });
  await page.fill('#login-username', username);
  await page.fill('#login-password', password);
  await page.click('#login-btn');
  await page.waitForTimeout(2000);

  // Login success means hash became #dashboard
  const hash = await page.evaluate(() => window.location.hash);
  if (hash === '#dashboard') {
    // Token should already be stored by SPA's AUTH module
    const token = await page.evaluate(() => localStorage.getItem('mtis_token'));
    if (token) {
      console.log(`Login OK: ${username}, token stored`);
    }
  }

  const errEl = page.locator('#login-error');
  let errorText = '';
  if (await errEl.isVisible().catch(() => false)) {
    errorText = (await errEl.textContent()) || '';
  }
  return { hash, errorText };
}

// Helper: API call using Playwright's request API + token from browser localStorage
async function apiCall(page, method, path, body) {
  // Get token from browser localStorage
  const token = await page.evaluate(() => localStorage.getItem('mtis_token') || '');
  if (!token) {
    // No token — try to get from login API directly
    console.warn('apiCall called without token — checking if page has token...');
  }
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  let response;
  switch (method.toUpperCase()) {
    case 'GET':
      response = await page.request.get('http://localhost:3000' + path, { headers });
      break;
    case 'POST':
      response = await page.request.post('http://localhost:3000' + path, { headers, data: body });
      break;
    case 'PUT':
      response = await page.request.put('http://localhost:3000' + path, { headers, data: body });
      break;
    case 'DELETE':
      response = await page.request.delete('http://localhost:3000' + path, { headers });
      break;
    default:
      throw new Error(`Unsupported method: ${method}`);
  }
  let data;
  try { data = await response.json(); } catch { data = null; }
  return { status: response.status(), data };
}

test.describe.configure({ mode: 'serial' });

test.describe('F-M01-001 Registration', () => {
  test('TC-REG-001: GET /api/users returns user list (admin)', async ({ page }) => {
    const r = await uiLogin(page, 'admin', 'admin123');
    expect(r.hash).toBe('#dashboard');
    const res = await apiCall(page, 'GET', '/api/users');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data.users)).toBeTruthy();
    expect(res.data.users.length).toBeGreaterThanOrEqual(2);
    console.log(`Users list: ${res.data.users.length} users`);
  });

  test('TC-REG-002: Tạo user qua form UI trả về 201', async ({ page }) => {
    const r = await uiLogin(page, 'admin', 'admin123');
    expect(r.hash).toBe('#dashboard');
    await page.goto(BASE + '#register');
    await page.waitForSelector('#reg-username', { timeout: 5000 });
    const u = `reg${Date.now()}`;
    await page.fill('#reg-username', u);
    await page.fill('#reg-fullname', 'Test Registration');
    await page.fill('#reg-email', `${u}@x.v`);
    await page.fill('#reg-password', 'Test@123');
    await page.fill('#reg-confirm', 'Test@123');
    await page.selectOption('#reg-role', 'infrastructure-officer');
    await page.click('#reg-btn');
    await page.waitForTimeout(2000);
    const success = page.locator('#reg-success');
    await expect(success).toBeVisible();
  });

  test('TC-REG-003: Tạo user trùng username trả về 409', async ({ page }) => {
    const r = await uiLogin(page, 'admin', 'admin123');
    expect(r.hash).toBe('#dashboard');
    await page.goto(BASE + '#register');
    await page.waitForSelector('#reg-username', { timeout: 5000 });
    await page.fill('#reg-username', 'admin');
    await page.fill('#reg-fullname', 'Duplicate');
    await page.fill('#reg-password', 'Test@123');
    await page.fill('#reg-confirm', 'Test@123');
    await page.click('#reg-btn');
    await page.waitForTimeout(1500);
    const err = page.locator('#reg-error');
    await expect(err).toBeVisible();
  });

  test('TC-REG-005: Non-admin POST /api/users trả về 403', async ({ page }) => {
    const cv = await page.request.post('http://localhost:3000/api/auth/login', {
      data: { username: 'chuyenviem1', password: 'admin123' },
    });
    const cvData = await cv.json();
    // Store token in browser for UI auth
    await page.goto(BASE);
    await page.evaluate(({ token }) => localStorage.setItem('mtis_token', token), { token: cvData.token });
    // Now try to create user
    const res = await apiCall(page, 'POST', '/api/users', {
      username: 'test123', password: 'Test@123', full_name: 'Test User'
    });
    expect(res.status).toBe(403);
  });
});
