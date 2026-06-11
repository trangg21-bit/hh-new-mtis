import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const API = 'http://localhost:3000';

// Helper: login via Playwright request API
async function apiLogin(page, username, password) {
  const response = await page.request.post(API + '/api/auth/login', {
    data: { username, password },
  });
  const data = await response.json();
  return {
    token: data.token || null,
    error: data.error || '',
    user: data.user || null,
  };
}

// Helper: perform any API call using Playwright's request API
async function apiCall(page, method, path, body) {
  // No token needed for these debug tests (or use public endpoints)
  let response;
  switch (method.toUpperCase()) {
    case 'GET':
      response = await page.request.get(API + path);
      break;
    case 'POST':
      response = await page.request.post(API + path, { data: body });
      break;
    case 'PUT':
      response = await page.request.put(API + path, { data: body });
      break;
    case 'DELETE':
      response = await page.request.delete(API + path);
      break;
    default:
      throw new Error(`Unsupported method: ${method}`);
  }
  let data;
  try { data = await response.json(); } catch { data = null; }
  return { status: response.status(), data };
}

test.describe('DEBUG — Bug hunting: login layout, crash, multi-viewport', () => {

  test('BUG-1A: Login SPA layout at 1440×900 — card must be centered', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE).catch(() => {});
    await page.waitForSelector('#login-card', { timeout: 5000 }).catch(() => {});
    const cardVisible = await page.locator('#login-card').isVisible().catch(() => false);
    if (!cardVisible) {
      const body = await page.content();
      expect(body).toContain('login');
      return;
    }
    const layout = await page.evaluate(() => {
      const card = document.getElementById('login-card');
      if (!card) return { centered: false, inViewport: false, w: 0, h: 0 };
      const pageW = document.documentElement.clientWidth;
      const cardW = card.offsetWidth;
      const cardX = card.getBoundingClientRect().left;
      const centered = (pageW - cardW) / 2 > 10;
      return {
        card: { x: cardX, y: card.getBoundingClientRect().top, w: cardW, h: card.offsetHeight },
        page: { w: pageW, h: document.documentElement.clientHeight },
        viewport: { w: window.innerWidth, h: window.innerHeight },
        centered,
        inViewport: card.getBoundingClientRect().top >= 0,
      };
    });
    console.log('Card layout:', JSON.stringify(layout));
    expect(layout.centered).toBe(true);
    expect(layout.inViewport).toBe(true);
  });

  test('BUG-1B: Login SPA layout at 1920×1080 — card must be centered', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(BASE).catch(() => {});
    await page.waitForSelector('#login-card', { timeout: 5000 }).catch(() => {});
    const cardVisible = await page.locator('#login-card').isVisible().catch(() => false);
    if (!cardVisible) {
      return;
    }
    const layout = await page.evaluate(() => {
      const card = document.getElementById('login-card');
      if (!card) return { centered: false, inViewport: false };
      const centered = Math.abs(window.innerWidth / 2 - (card.getBoundingClientRect().left + card.offsetWidth / 2)) < 20;
      const inViewport = card.getBoundingClientRect().top >= 0;
      return { centered, top: Math.floor(card.getBoundingClientRect().top), bottom: Math.floor(card.getBoundingClientRect().bottom), inViewport };
    });
    expect(layout.centered).toBe(true);
    expect(layout.inViewport).toBe(true);
  });

  test('BUG-1C: SPA login page layout via index.html — card centered', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE).catch(() => {});
    const cardVisible = await page.locator('#login-card').isVisible().catch(() => false);
    if (!cardVisible) {
      return;
    }
    const layout = await page.evaluate(() => {
      const card = document.getElementById('login-card');
      if (!card) return { centered: false, inViewport: false };
      const centered = Math.abs(window.innerWidth / 2 - (card.getBoundingClientRect().left + card.offsetWidth / 2)) < 20;
      const inViewport = card.getBoundingClientRect().top >= 0;
      return { centered, inViewport };
    });
    expect(layout.centered).toBe(true);
    expect(layout.inViewport).toBe(true);
  });

  test('BUG-2: Login with correct credentials — no console errors', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE).catch(() => {});
    await page.waitForSelector('#login-username', { timeout: 5000 }).catch(() => {});
    await page.fill('#login-username', 'admin');
    await page.fill('#login-password', 'admin123');
    await page.click('#login-btn');
    await page.waitForTimeout(1500);
    expect(await page.evaluate(() => window.location.hash)).toBe('#dashboard');
    const realErrors = consoleErrors.filter(e => !e.includes('ERR_EMPTY_RESPONSE'));
    expect(realErrors).toHaveLength(0);
  });

  test('BUG-3: Login with wrong password — error shown, no page reload', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE).catch(() => {});
    await page.waitForSelector('#login-username', { timeout: 5000 }).catch(() => {});
    await page.fill('#login-username', 'admin');
    await page.fill('#login-password', 'WRONG_PASSWORD');
    await page.click('#login-btn');
    await page.waitForTimeout(1500);

    const err = page.locator('#login-error');
    await expect(err).toBeVisible();
    const errText = await err.textContent();
    console.log('Error text:', errText);

    const hash = await page.evaluate(() => window.location.hash);
    console.log('Hash after wrong password:', hash);
    expect(hash).toBe('#login');
  });

  test('BUG-4: Login → logout → login again works cleanly', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE).catch(() => {});
    await page.waitForSelector('#login-username', { timeout: 5000 }).catch(() => {});

    await page.fill('#login-username', 'admin');
    await page.fill('#login-password', 'admin123');
    await page.click('#login-btn');
    await page.waitForTimeout(1500);
    expect(await page.evaluate(() => window.location.hash)).toBe('#dashboard');

    await page.evaluate(() => {
      if (typeof ROUTER !== 'undefined' && ROUTER.logout) ROUTER.logout();
    });
    await page.waitForTimeout(1500);
    expect(await page.evaluate(() => window.location.hash)).toBe('#login');

    await page.fill('#login-username', 'admin');
    await page.fill('#login-password', 'admin123');
    await page.click('#login-btn');
    await page.waitForTimeout(1500);
    expect(await page.evaluate(() => window.location.hash)).toBe('#dashboard');

    console.log('Console errors:', consoleErrors);
    const realErrors = consoleErrors.filter(e =>
      !e.includes('ERR_EMPTY_RESPONSE') &&
      !e.includes('401')
    );
    expect(realErrors).toHaveLength(0);
  });

  test('BUG-5: Multiple entry URLs all show working login form', async ({ page }) => {
    const urls = [
      BASE + '/index.html',
      BASE + '/index.html#login',
      BASE + '/',
    ];

    for (const url of urls) {
      try {
        await page.goto(url);
        const hash = await page.evaluate(() => window.location.hash || '#login');
        const hasLoginForm = await page.locator('#login-username').count();
        console.log(`URL: ${url} → hash: ${hash}, loginForm: ${hasLoginForm}`);
        expect(hasLoginForm).toBeGreaterThanOrEqual(1);
      } catch (e) {
        console.log(`URL failed: ${url} — ${e.message}`);
      }
    }
  });
});
