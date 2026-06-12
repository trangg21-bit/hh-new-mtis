import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

// ─── Shared Helpers ──────────────────────────────────────────────

/**
 * Login via UI SPA, store token in localStorage, return status.
 * @param page - Playwright page
 * @param username - Username to login with
 * @param password - Password to login with
 * @returns { hash: string, errorText: string }
 */
export async function uiLogin(page, username, password) {
  await page.goto(BASE);
  await page.waitForSelector('#login-username', { timeout: 5000 });
  await page.fill('#login-username', username);
  await page.fill('#login-password', password);
  await page.click('#login-btn');
  await page.waitForTimeout(2000);

  const hash = await page.evaluate(() => window.location.hash);
  const errEl = page.locator('#login-error');
  let errorText = '';
  if (await errEl.isVisible().catch(() => false)) {
    errorText = (await errEl.textContent()) || '';
  }
  return { hash, errorText };
}

/**
 * Login via API directly, store token in localStorage.
 * @param page - Playwright page
 * @param username - Username to login with
 * @param password - Password to login with
 * @returns { string } JWT token
 */
export async function apiLogin(page, username, password) {
  const response = await page.request.post(`${BASE}/api/auth/login`, {
    data: { username, password },
  });
  const data = await response.json();
  // Navigate first so localStorage is accessible on the correct origin
  await page.goto(BASE);
  // Wait for SPA to load before setting token
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate((token) => localStorage.setItem('mtis_token', token), data.token);
  return data.token;
}

/**
 * Make an authenticated API call using stored token.
 * @param page - Playwright page
 * @param method - HTTP method (GET, POST, PUT, DELETE)
 * @param path - API path (e.g., '/api/users')
 * @param body - Request body (optional)
 * @returns { status: number, data: object|null }
 */
export async function apiCall(page, method, path, body = null) {
  const token = await page.evaluate(() => localStorage.getItem('mtis_token'));
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  let response;
  const url = `${BASE}${path}`;
  switch (method.toUpperCase()) {
    case 'GET':
      response = await page.request.get(url, { headers });
      break;
    case 'POST':
      response = await page.request.post(url, { headers, data: body });
      break;
    case 'PUT':
      response = await page.request.put(url, { headers, data: body });
      break;
    case 'DELETE':
      response = await page.request.delete(url, { headers });
      break;
    default:
      throw new Error(`Unsupported method: ${method}`);
  }
  let data;
  try { data = await response.json(); } catch { data = null; }
  return { status: response.status(), data };
}

/**
 * Create a random username for unique test records.
 * Format: tcYYMMDD_HHMMSS_XXXX
 */
export function randomUsername() {
  const now = new Date();
  const short = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}`;
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `tc${short}_${rand}`;
}

/**
 * Navigate to SPA screen by hash — changes hash ONLY (no page reload, preserves localStorage).
 */
export async function navigateToScreen(page, hash) {
  if (!hash.startsWith('#')) hash = '#' + hash;
  // Just change the hash — preserves localStorage token
  await page.evaluate((h) => { window.location.hash = h; }, hash);
  // Wait for SPA router to process the hashchange
  await page.waitForTimeout(500);
}

/**
 * Assert error element is visible.
 */
export async function assertErrorVisible(page, selector) {
  const el = page.locator(selector);
  await expect(el).toBeVisible();
}

/**
 * Assert success element is visible.
 */
export async function assertSuccessVisible(page, selector) {
  const el = page.locator(selector);
  await expect(el).toBeVisible();
}

/**
 * Get all users via API.
 */
export async function getAllUsers(page) {
  const res = await apiCall(page, 'GET', '/api/users?page=1&limit=100');
  return res.data;
}

/**
 * Get user by ID via API.
 */
export async function getUserById(page, userId) {
  const res = await apiCall(page, 'GET', `/api/users/${userId}`);
  return res.data;
}

/**
 * Check if user exists by username via API.
 */
export async function userExists(page, username) {
  const res = await apiCall(page, 'GET', `/api/users?search=${username}`);
  return res.data.users && res.data.users.some(u => u.username === username);
}

export { BASE };
