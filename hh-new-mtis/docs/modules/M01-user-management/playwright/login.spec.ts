import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

test.describe('M01 — Login Flow', () => {
  test('Login page renders correctly', async ({ page }) => {
    await page.goto(`${BASE}/#login`);
    await expect(page.locator('#login-username')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
    await expect(page.locator('#login-btn')).toBeVisible();
  });

  test('Valid admin login redirects to dashboard', async ({ page }) => {
    await page.goto(`${BASE}/#login`);
    await page.fill('#login-username', 'admin');
    await page.fill('#login-password', 'admin123');
    await page.click('#login-btn');
    await page.waitForURL(`**/#dashboard`);
    await expect(page.locator('.page-subtitle')).toContainText('Xin chào');
  });

  test('Wrong password shows error', async ({ page }) => {
    await page.goto(`${BASE}/#login`);
    await page.fill('#login-username', 'admin');
    await page.fill('#login-password', 'wrongpassword');
    await page.click('#login-btn');
    await expect(page.locator('.toast-error')).toBeVisible();
  });

  test('Non-existent user shows error', async ({ page }) => {
    await page.goto(`${BASE}/#login`);
    await page.fill('#login-username', 'ghost_user');
    await page.fill('#login-password', 'anything');
    await page.click('#login-btn');
    await expect(page.locator('.toast-error')).toBeVisible();
  });

  test('Unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto(`${BASE}/#dashboard`);
    await page.waitForURL(`**/#login`);
  });

  test('Logout clears session and redirects to login', async ({ page }) => {
    // Login first
    await page.goto(`${BASE}/#login`);
    await page.fill('#login-username', 'admin');
    await page.fill('#login-password', 'admin123');
    await page.click('#login-btn');
    await page.waitForURL(`**/#dashboard`);

    // Click logout
    await page.click('#logout-btn');
    await page.waitForURL(`**/#login`);

    // Verify cannot access dashboard after logout
    await page.goto(`${BASE}/#dashboard`);
    await page.waitForURL(`**/#login`);
  });
});
