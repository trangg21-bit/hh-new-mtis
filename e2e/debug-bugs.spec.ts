import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

const BASE = 'http://localhost:3000';

test.describe('DEBUG — Bug hunting: login layout, crash, multi-viewport', () => {

  test.beforeAll(async () => {
    // Full reset: DB + container restart to clear in-memory rate limiter
    execSync('node e2e/_reset-db.js', { stdio: 'pipe', timeout: 60000, cwd: process.cwd() });
  });

  // ═══════════════════════════════════════════════
  // BUG 1A: Login page layout at 1440×900 (desktop)
  // ═══════════════════════════════════════════════
  test('BUG-1A: Login SPA layout at 1440×900 — card must be centered', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE}/index.html`);
    await page.waitForSelector('#login-username', { timeout: 5000 });

    // Check login-page + login-card center alignment
    const cardBox = await page.evaluate(() => {
      const card = document.querySelector('.login-card');
      const page = document.querySelector('.login-page');
      if (!card || !page) return null;
      const cardRect = card.getBoundingClientRect();
      const pageRect = page.getBoundingClientRect();
      return {
        card: { x: cardRect.x, y: cardRect.y, w: cardRect.width, h: cardRect.height },
        page: { w: pageRect.width, h: pageRect.height },
        viewport: { w: window.innerWidth, h: window.innerHeight },
        centered: Math.abs(cardRect.x - (window.innerWidth - cardRect.width) / 2) < 2,
        inViewport: cardRect.top >= 0 && cardRect.bottom <= window.innerHeight,
      };
    });
    console.log('Card layout:', JSON.stringify(cardBox, null, 2));

    expect(cardBox).not.toBeNull();
    expect(cardBox.centered).toBeTruthy();
    expect(cardBox.inViewport).toBeTruthy();
    expect(cardBox.card.w).toBeGreaterThanOrEqual(350);
    expect(cardBox.card.h).toBeGreaterThanOrEqual(400);
  });

  // ═══════════════════════════════════════════════
  // BUG 1B: Login page layout at 1920×1080 (common)
  // ═══════════════════════════════════════════════
  test('BUG-1B: Login SPA layout at 1920×1080 — card must be centered', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`${BASE}/index.html`);
    await page.waitForSelector('#login-username', { timeout: 5000 });

    const cardBox = await page.evaluate(() => {
      const card = document.querySelector('.login-card');
      if (!card) return null;
      const r = card.getBoundingClientRect();
      return {
        centered: Math.abs(r.x - (window.innerWidth - r.width) / 2) < 2,
        top: r.top,
        bottom: r.bottom,
        inViewport: r.top >= 0 && r.bottom <= window.innerHeight,
      };
    });
    console.log('1920×1080 card:', JSON.stringify(cardBox));
    expect(cardBox).not.toBeNull();
    expect(cardBox.centered).toBeTruthy();
    expect(cardBox.inViewport).toBeTruthy();
  });

  // ═══════════════════════════════════════════════
  // BUG 1C: Login standalone login.html layout
  // ═══════════════════════════════════════════════
  test('BUG-1C: SPA login page layout via index.html — card centered', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE}/index.html`);
    await page.waitForSelector('#login-username', { timeout: 5000 });

    const cardBox = await page.evaluate(() => {
      const card = document.querySelector('.login-card');
      if (!card) return null;
      const r = card.getBoundingClientRect();
      return {
        centered: Math.abs(r.x - (window.innerWidth - r.width) / 2) < 2,
        inViewport: r.top >= 0 && r.bottom <= window.innerHeight,
      };
    });
    console.log('SPA login layout:', JSON.stringify(cardBox));
    expect(cardBox).not.toBeNull();
    expect(cardBox.centered).toBeTruthy();
  });

  // ═══════════════════════════════════════════════
  // BUG 2: Login with correct creds — check console errors
  // ═══════════════════════════════════════════════
  test('BUG-2: Login with correct credentials — no console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE}/index.html`);
    await page.waitForSelector('#login-username', { timeout: 5000 });

    await page.fill('#login-username', 'admin');
    await page.fill('#login-password', 'admin123');
    await page.click('#login-btn');

    await page.waitForTimeout(2000);

    const hash = await page.evaluate(() => window.location.hash);
    console.log('After login hash:', hash);
    console.log('Console errors:', consoleErrors);

    expect(consoleErrors).toHaveLength(0);
    expect(hash).toBe('#dashboard');
  });

  // ═══════════════════════════════════════════════
  // BUG 3: Login error with wrong password — must show immediately
  // ═══════════════════════════════════════════════
  test('BUG-3: Login with wrong password — error shown, no page reload', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE}/index.html`);
    await page.waitForSelector('#login-username', { timeout: 5000 });

    await page.fill('#login-username', 'admin');
    await page.fill('#login-password', 'WRONG_PASSWORD');
    await page.click('#login-btn');
    await page.waitForTimeout(1500);

    // Check error is visible
    const err = page.locator('#login-error');
    await expect(err).toBeVisible();
    const errText = await err.textContent();
    console.log('Error text:', errText);

    const hash = await page.evaluate(() => window.location.hash);
    console.log('Hash after wrong password:', hash);

    // Accept either "wrong credentials" or "account locked"
    const isLockedMsg = errText.includes('đã bị khóa');
    const isWrongPwdMsg = errText.includes('Sai tên đăng nhập');
    expect(isLockedMsg || isWrongPwdMsg).toBeTruthy();
    expect(hash).toBe('#login');
    // 401 console errors are expected (auth guard calls /me before redirect)
    const realErrors = consoleErrors.filter(e => !e.includes('401') && !e.includes('Unauthorized'));
    expect(realErrors).toHaveLength(0);
  });

  // ═══════════════════════════════════════════════
  // BUG 4: Sequential login → logout → re-login works
  // ═══════════════════════════════════════════════
  test('BUG-4: Login → logout → login again works cleanly', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE}/index.html`);
    await page.waitForSelector('#login-username', { timeout: 5000 });

    // Login
    await page.fill('#login-username', 'admin');
    await page.fill('#login-password', 'admin123');
    await page.click('#login-btn');
    await page.waitForTimeout(1500);
    expect(await page.evaluate(() => window.location.hash)).toBe('#dashboard');

    // Logout via ROUTER.logout
    await page.evaluate(() => ROUTER.logout());
    await page.waitForTimeout(1500);
    expect(await page.evaluate(() => window.location.hash)).toBe('#login');

    // Login again
    await page.fill('#login-username', 'admin');
    await page.fill('#login-password', 'admin123');
    await page.click('#login-btn');
    await page.waitForTimeout(1500);
    expect(await page.evaluate(() => window.location.hash)).toBe('#dashboard');

    console.log('Console errors:', consoleErrors);
    expect(consoleErrors).toHaveLength(0);
  });

  // ═══════════════════════════════════════════════
  // BUG 5: Direct URL /login.html vs /index.html vs /
  // ═══════════════════════════════════════════════
  test('BUG-5: Multiple entry URLs all show working login form', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto(`${BASE}/index.html`);
    await page.waitForSelector('#login-username', { timeout: 5000 });
    await expect(page.locator('#login-username')).toBeVisible();
    await expect(page.locator('#login-btn')).toBeVisible();

    await page.goto(BASE);
    await page.waitForSelector('#login-username', { timeout: 5000 });
    await expect(page.locator('#login-username')).toBeVisible();
    await expect(page.locator('#login-btn')).toBeVisible();

    await page.goto(`${BASE}/index.html#login`);
    await page.waitForSelector('#login-username', { timeout: 5000 });
    await expect(page.locator('#login-username')).toBeVisible();
    await expect(page.locator('#login-btn')).toBeVisible();

    console.log('All entry URLs verified');
  });
});
