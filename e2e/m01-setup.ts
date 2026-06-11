// Shared helpers for M01 E2E tests
// Covers CommonTC.xlsx Sheet 1 (UI), Sheet 2 (Validate), Sheet 3 (Function)
import { test, expect, Page } from '@playwright/test';

export const BASE = 'http://localhost:3000';
const CRED = {
  admin: { username: 'admin', password: 'admin123' },
  chuyenviem: { username: 'chuyenviem1', password: 'admin123' },
  lanhdao: { username: 'lanhdao', password: 'admin123' },
};

// ─── Auth helpers ──────────────────────────────────────────

/** Login via API and return token, store in page localStorage + navigate to SPA with sidebar */
export async function apiLogin(page: Page, username: string, password: string): Promise<string> {
  const resp = await page.request.post(`${BASE}/api/auth/login`, {
    data: { username, password },
  });
  const { token, user } = await resp.json() as { token: string; user?: { id: number; username: string; full_name: string; role: string } };
  // Step 1: Navigate to SPA page FIRST (sets correct origin for localStorage)
  await page.goto(BASE);
  // Step 2: Set token + user in localStorage (correct origin, after page loads)
  await page.evaluate(({ tok, usr }) => {
    localStorage.setItem('mtis_token', tok);
    if (usr) localStorage.setItem('mtis_user', JSON.stringify(usr));
  }, { tok: token, usr: user || { id: 1, username, full_name: username, role: 'system-admin' } });
  // Step 3: Set hash to #dashboard AND dispatch hashchange to trigger SPA router
  // SPA router listens on hashchange — sidebar only renders for auth routes
  await page.evaluate(() => {
    window.location.hash = 'dashboard';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
  // Step 4: SPA router needs time to process hashchange and render sidebar shell
  await page.waitForSelector('.sidebar', { timeout: 10000 });
  return token;
}

/** Login via API without storing in browser — returns raw token */
export async function apiLoginRaw(username: string, password: string, page: Page): Promise<string> {
  const resp = await page.request.post(`${BASE}/api/auth/login`, {
    data: { username, password },
  });
  const data = await resp.json() as { token: string };
  return data.token;
}

/** Login via UI and return hash result */
export async function uiLogin(page: Page, username: string, password: string): Promise<{ hash: string; errorText: string }> {
  await page.goto(BASE);
  await page.waitForSelector('#login-username', { timeout: 5000 });
  await page.fill('#login-username', username);
  await page.fill('#login-password', password);
  await page.click('#login-btn');
  // Wait for SPA to redirect to dashboard
  await page.waitForFunction(() => window.location.hash === '#dashboard', { timeout: 10000 });
  await page.waitForSelector('#screen-content', { timeout: 5000 });
  await page.waitForSelector('.sidebar', { timeout: 5000 });
  const hash = await page.evaluate(() => window.location.hash);
  const errEl = page.locator('#login-error');
  let errorText = '';
  if (await errEl.isVisible().catch(() => false)) {
    errorText = (await errEl.textContent()) || '';
  }
  return { hash, errorText };
}

/** Get auth headers from page's localStorage */
export async function getAuthHeaders(page: Page): Promise<Record<string, string>> {
  const token = await page.evaluate(() => localStorage.getItem('mtis_token'));
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ─── API helpers ───────────────────────────────────────────

export async function apiCall(page: Page, method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown) {
  const headers = await getAuthHeaders(page);
  let response: import('@playwright/test').APIResponse;
  switch (method.toUpperCase()) {
    case 'GET':  response = await page.request.get(`${BASE}${path}`, { headers }); break;
    case 'POST': response = await page.request.post(`${BASE}${path}`, { headers, data: body }); break;
    case 'PUT':  response = await page.request.put(`${BASE}${path}`, { headers, data: body }); break;
    case 'DELETE': response = await page.request.delete(`${BASE}${path}`, { headers }); break;
    default: throw new Error(`Unsupported method: ${method}`);
  }
  let data: unknown;
  try { data = await response.json(); } catch { data = null; }
  return { status: response.status(), data };
}

/** Create a random username to avoid conflicts */
export function randomUsername(prefix = 'tc') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

/** Create a random email */
export function randomEmail(prefix = 'tc') {
  return `${randomUsername(prefix)}@test.vn`;
}

/** Create a random fullname */
export function randomFullName() {
  const names = ['Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Phạm Thị D', 'Hoàng Văn E'];
  return names[Math.floor(Math.random() * names.length)] + ` ${Date.now()}`;
}

// ─── Assertion helpers ─────────────────────────────────────

/** Assert an error element is visible and contains expected text */
export async function expectError(page: Page, selector: string, textContains?: string) {
  const el = page.locator(selector);
  await expect(el).toBeVisible();
  if (textContains) {
    await expect(el).toContainText(textContains);
  }
}

/** Assert a success element is visible */
export async function expectSuccess(page: Page, selector: string) {
  await expect(page.locator(selector)).toBeVisible();
}

// ─── Navigation helpers ────────────────────────────────────

/** Map hash route to sidebar link text for clicking */
function hashToLabel(hash: string): string | null {
  const map: Record<string, string> = {
    '#dashboard': 'Tổng quan',
    '#users': 'Danh sách người dùng',
    '#groups': 'Nhóm người dùng',
    '#permissions': 'Phân quyền',
    '#organizations': 'Đơn vị',
    '#login-log': 'Nhật ký đăng nhập',
    '#password': 'Đổi mật khẩu',
  };
  return map[hash] || null;
}

/** Navigate to a hash route and wait for element */
export async function navigateTo(page: Page, hash: string, waitForSelector = 'body', timeout = 5000) {
  const hashValue = hash.startsWith('#') ? hash.slice(1) : hash;
  // Set hash AND dispatch hashchange event to trigger SPA router
  await page.evaluate((h) => {
    window.location.hash = h;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }, hashValue);
  // SPA router needs time to process hash change and render new screen
  await page.waitForTimeout(500);
  await page.waitForSelector(waitForSelector, { timeout });
}

/** Navigate to the registration screen */
export async function navigateToRegister(page: Page) {
  await navigateTo(page, '#register', '#reg-username');
}

/** Click a sidebar menu item by link text */
export async function clickSidebarMenu(page: Page, linkText: string) {
  await page.getByRole('link', { name: linkText }).click();
  await page.waitForTimeout(500);
}
