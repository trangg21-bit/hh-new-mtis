import { test, expect } from '@playwright/test';
import { apiLogin, BASE } from './m01-setup';

// Helper: API call with auth header
async function apiCall(page, method, path, body = null) {
  const token = await page.evaluate(() => localStorage.getItem('mtis_token'));
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
    await apiLogin(page, 'admin', 'admin123');
    const res = await apiCall(page, 'GET', '/api/users');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data.users)).toBeTruthy();
    expect(res.data.users.length).toBeGreaterThanOrEqual(2);
    console.log(`Users list: ${res.data.users.length} users`);
  });

  test('TC-REG-002: Tạo user qua form UI trả về 201', async ({ page }) => {
    await apiLogin(page, 'admin', 'admin123');
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
    await apiLogin(page, 'admin', 'admin123');
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
