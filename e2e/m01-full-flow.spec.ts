import { test, expect } from '@playwright/test';
import path from 'path';

const BASE = 'http://localhost:3000';
const SS = path.join(__dirname, '..', 'docs', 'modules', 'M01-user-management', 'screenshots');

test.describe('M01 — Full Flow E2E + Screenshots', () => {

  // ══════════════════════════════════════════
  // SCREEN 01: Login page (no auth needed)
  // ══════════════════════════════════════════
  test('01 — Login page renders correctly', async ({ page }) => {
    await page.goto(`${BASE}/index.html`);
    await page.waitForTimeout(800);
    await expect(page.locator('#login-username')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
    await expect(page.locator('#login-btn')).toBeVisible();
    await page.screenshot({ path: `${SS}/01-login.png`, fullPage: true });
  });

  // ══════════════════════════════════════════
  // SCREEN 02: Forgot password
  // ══════════════════════════════════════════
  test('02 — Forgot password page', async ({ page }) => {
    await page.goto(`${BASE}/index.html#forgot-password`);
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${SS}/02-forgot-password.png`, fullPage: true });
  });

  // ══════════════════════════════════════════
  // FULL FLOW: Login → Dashboard → Users → Groups → Back → Logout
  // ══════════════════════════════════════════
  test('FULL FLOW: Login → Dashboard → Users → Groups → Logout', async ({ page }) => {
    // ── Login ──
    await page.goto(`${BASE}/index.html`);
    await page.waitForSelector('#login-username', { timeout: 5000 });
    await page.fill('#login-username', 'admin');
    await page.fill('#login-password', 'admin123');
    await page.click('#login-btn');

    // Wait for dashboard to load (hash changes to #dashboard)
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SS}/03-after-login-dashboard.png`, fullPage: true });

    // ── Navigate to Users via sidebar ──
    const usersLink = page.locator('a[href="#users"], .menu-item:has-text("Người dùng")').first();
    if (await usersLink.isVisible({ timeout: 2000 })) {
      await usersLink.click();
    } else {
      await page.goto(`${BASE}/index.html#users`);
    }
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SS}/04-users-list.png`, fullPage: true });

    // ── Navigate to Groups ──
    const groupsLink = page.locator('a[href="#groups"], .menu-item:has-text("Nhóm")').first();
    if (await groupsLink.isVisible({ timeout: 2000 })) {
      await groupsLink.click();
    } else {
      await page.goto(`${BASE}/index.html#groups`);
    }
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SS}/05-groups.png`, fullPage: true });

    // ── Navigate to Permissions ──
    await page.goto(`${BASE}/index.html#permissions`);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SS}/06-permissions.png`, fullPage: true });

    // ── Navigate to Organizations ──
    await page.goto(`${BASE}/index.html#organizations`);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SS}/07-organizations.png`, fullPage: true });

    // ── Navigate to Login Log ──
    await page.goto(`${BASE}/index.html#login-log`);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SS}/08-login-log.png`, fullPage: true });

    // ── Navigate to Sessions ──
    await page.goto(`${BASE}/index.html#sessions`);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SS}/09-sessions.png`, fullPage: true });

    // ── Navigate to Register ──
    await page.goto(`${BASE}/index.html#register`);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SS}/10-register.png`, fullPage: true });

    // ── Navigate to Password ──
    await page.goto(`${BASE}/index.html#password`);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SS}/11-password.png`, fullPage: true });

    // ── Back to Dashboard ──
    await page.goto(`${BASE}/index.html#dashboard`);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SS}/12-back-to-dashboard.png`, fullPage: true });

    // ── Logout ──
    const logoutBtn = page.locator('#logout-btn, button:has-text("Đăng xuất"), a:has-text("Đăng xuất")').first();
    if (await logoutBtn.isVisible({ timeout: 2000 })) {
      await logoutBtn.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `${SS}/13-after-logout.png`, fullPage: true });
    }
  });

  // ══════════════════════════════════════════
  // BUG CHECK: Login error with wrong password
  // ══════════════════════════════════════════
  test('BUG-CHECK: Wrong password shows error', async ({ page }) => {
    await page.goto(`${BASE}/index.html`);
    await page.waitForSelector('#login-username', { timeout: 5000 });
    await page.fill('#login-username', 'admin');
    await page.fill('#login-password', 'WRONG_PASSWORD');
    await page.click('#login-btn');
    await page.waitForTimeout(1500);

    // Error should be visible
    const err = page.locator('#login-error');
    if (await err.isVisible()) {
      console.log('✅ PASS: Error shown for wrong password');
    } else {
      console.log('⚠️ BUG: No error message displayed for wrong password!');
    }
    await page.screenshot({ path: `${SS}/14-wrong-password.png`, fullPage: true });
  });

  // ══════════════════════════════════════════
  // BUG CHECK: Empty fields validation
  // ══════════════════════════════════════════
  test('BUG-CHECK: Empty fields validation', async ({ page }) => {
    await page.goto(`${BASE}/index.html`);
    await page.waitForSelector('#login-btn', { timeout: 5000 });
    
    // Clear and submit empty
    await page.fill('#login-username', '');
    await page.fill('#login-password', '');
    await page.click('#login-btn');
    await page.waitForTimeout(1000);

    const err = page.locator('#login-error');
    if (await err.isVisible()) {
      console.log('✅ PASS: Validation error for empty fields');
    } else {
      console.log('⚠️ BUG: No validation error for empty fields!');
    }
    await page.screenshot({ path: `${SS}/15-empty-validation.png`, fullPage: true });
  });

  // ══════════════════════════════════════════
  // BUG CHECK: Rate limiting
  // ══════════════════════════════════════════
  test('BUG-CHECK: Rate limit after 5 failed attempts', async ({ page }) => {
    await page.goto(`${BASE}/index.html`);
    await page.waitForSelector('#login-username', { timeout: 5000 });

    // 6 failed attempts
    for (let i = 0; i < 6; i++) {
      await page.fill('#login-username', 'admin');
      await page.fill('#login-password', 'wrong');
      await page.click('#login-btn');
      await page.waitForTimeout(600);
    }

    const err = page.locator('#login-error');
    const errText = await err.textContent();
    console.log(`Attempt 6 error: "${errText}"`);
    if (errText && errText.includes('quá nhiều')) {
      console.log('✅ PASS: Rate limit triggered');
    } else {
      console.log('⚠️ Note: Rate limit may be on backend (check HTTP 429)');
    }
    await page.screenshot({ path: `${SS}/16-rate-limit.png`, fullPage: true });
  });

  // ══════════════════════════════════════════
  // BUG CHECK: Auth guard — access dashboard without login
  // ══════════════════════════════════════════
  test('BUG-CHECK: Auth guard redirects to login', async ({ page }) => {
    await page.goto(`${BASE}/index.html#dashboard`);
    await page.waitForTimeout(1500);
    
    // Should be redirected to login or show login screen
    const loginForm = page.locator('#login-username');
    await expect(loginForm).toBeVisible({ timeout: 3000 });
    console.log('✅ PASS: Unauthenticated user sees login page');
    await page.screenshot({ path: `${SS}/17-auth-guard.png`, fullPage: true });
  });
});
