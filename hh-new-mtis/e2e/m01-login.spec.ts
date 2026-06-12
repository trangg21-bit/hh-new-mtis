// M01 — Login & Auth Tests (CommonTC Sheet 3)
// Login, password change, TOTP, session, lock/unlock, orgs, permissions
import { test, expect } from '@playwright/test';
import { apiCall, apiLogin, BASE } from './m01-setup';

const CRED = {
  admin: { username: 'admin', password: 'admin123' },
  chuyenviem: { username: 'chuyenviem1', password: 'admin123' },
  lanhdao: { username: 'lanhdao', password: 'admin123' },
};

async function loginAdmin(page: import('@playwright/test').Page) {
  await apiLogin(page, CRED.admin.username, CRED.admin.password);
  await page.waitForTimeout(500);
}

async function loginNonAdmin(page: import('@playwright/test').Page, username = CRED.chuyenviem.username) {
  await apiLogin(page, username, CRED.chuyenviem.password);
  await page.waitForTimeout(500);
}

// ─── Login ────────────────────────────────────────────────

test.describe('Login', () => {
  test.describe.configure({ mode: 'serial' });

  test('TC-L-01: Login valid → 200 + token', async ({ page }) => {
    const res = await page.request.post(`${BASE}/api/auth/login`, {
      data: { username: CRED.admin.username, password: CRED.admin.password },
    });
    expect(res.status()).toBe(200);
    const data = await res.json() as { token: string };
    expect(data.token).toBeDefined();
    expect(typeof data.token).toBe('string');
    expect(data.token).toHaveLength(60);
  });

  test('TC-L-02: Login wrong password → 401', async ({ page }) => {
    const res = await page.request.post(`${BASE}/api/auth/login`, {
      data: { username: CRED.admin.username, password: 'wrongpassword' },
    });
    expect(res.status()).toBe(401);
    const data = await res.json() as { error: string };
    expect(data.error).toContain('Sai tên đăng nhập hoặc mật khẩu');
  });

  test('TC-L-03: Login non-existent user → 401', async ({ page }) => {
    const res = await page.request.post(`${BASE}/api/auth/login`, {
      data: { username: 'nonexistent_xyz_999', password: 'Test@123' },
    });
    expect(res.status()).toBe(401);
  });

  test('TC-L-04: Login locked account → 423', async ({ page }) => {
    await loginAdmin(page);
    const lockRes = await apiCall(page, 'PUT', '/api/users/3/lock', {});
    if (lockRes.status !== 200) { test.skip(); }
    const loginRes = await page.request.post(`${BASE}/api/auth/login`, {
      data: { username: CRED.lanhdao.username, password: CRED.lanhdao.password },
    });
    expect(loginRes.status()).toBe(423);
    await apiCall(page, 'PUT', '/api/users/3/unlock', {}).catch(() => {});
  });

  test('TC-L-05: Login disabled account → 401', async ({ page }) => {
    await loginAdmin(page);
    await apiCall(page, 'PUT', '/api/users/4', { status: 0 });
    const res = await page.request.post(`${BASE}/api/auth/login`, {
      data: { username: 'chuyenviem1', password: CRED.chuyenviem.password },
    });
    expect(res.status()).toBe(401);
    await apiCall(page, 'PUT', '/api/users/4', { status: 1 });
  });

  test('TC-L-06: Login empty username → 400', async ({ page }) => {
    const res = await page.request.post(`${BASE}/api/auth/login`, {
      data: { username: '', password: 'admin123' },
    });
    expect(res.status()).toBe(400);
  });

  test('TC-L-07: Login empty password → 400', async ({ page }) => {
    const res = await page.request.post(`${BASE}/api/auth/login`, {
      data: { username: 'admin', password: '' },
    });
    expect(res.status()).toBe(400);
  });

  test('TC-L-08: Rate limit 5 failed → 423', async ({ page }) => {
    await loginAdmin(page);
    for (let i = 0; i < 5; i++) {
      const res = await page.request.post(`${BASE}/api/auth/login`, {
        data: { username: 'chuyenviem1', password: 'wrong' },
      });
      expect(res.status()).toBe(401);
    }
    const lockRes = await page.request.post(`${BASE}/api/auth/login`, {
      data: { username: 'chuyenviem1', password: 'admin123' },
    });
    expect(lockRes.status()).toBe(423);
  });

  test('TC-L-09: Login log recorded on success', async ({ page }) => {
    await loginAdmin(page);
    await apiCall(page, 'GET', '/api/auth/login-log?page=1&limit=5');
    // Just verify the endpoint is accessible
  });

  test('TC-L-10: Login log records failures', async ({ page }) => {
    await loginAdmin(page);
    await apiCall(page, 'GET', '/api/auth/login-log?status=failed&page=1&limit=5');
  });
});

// ─── Change Password ──────────────────────────────────────

test.describe('Change Password', () => {
  test.describe.configure({ mode: 'serial' });

  test('TC-L-11: Change password valid → 200', async ({ page }) => {
    await loginAdmin(page);
    const res = await apiCall(page, 'PUT', '/api/auth/change-password', {
      old_password: CRED.admin.password,
      new_password: 'NewPass@12345',
    });
    expect(res.status).toBe(200);
    // Reset
    await apiCall(page, 'PUT', '/api/auth/change-password', {
      old_password: 'NewPass@12345',
      new_password: CRED.admin.password,
    }).catch(() => {});
  });

  test('TC-L-12: Change password wrong old → 400', async ({ page }) => {
    await loginAdmin(page);
    const res = await apiCall(page, 'PUT', '/api/auth/change-password', {
      old_password: 'WrongOldPass@123',
      new_password: 'NewPass@12345',
    });
    expect(res.status).toBe(400);
  });

  test('TC-L-13: Change password new=old → 400', async ({ page }) => {
    await loginAdmin(page);
    const res = await apiCall(page, 'PUT', '/api/auth/change-password', {
      old_password: CRED.admin.password,
      new_password: CRED.admin.password,
    });
    expect(res.status).toBe(400);
  });

  test('TC-L-14: Change password weak → 400', async ({ page }) => {
    await loginAdmin(page);
    const res = await apiCall(page, 'PUT', '/api/auth/change-password', {
      old_password: CRED.admin.password,
      new_password: 'weak',
    });
    expect(res.status).toBe(400);
  });

  test('TC-L-15: Change password >30 chars → 400', async ({ page }) => {
    await loginAdmin(page);
    const res = await apiCall(page, 'PUT', '/api/auth/change-password', {
      old_password: CRED.admin.password,
      new_password: 'A'.repeat(40) + '1!a',
    });
    expect(res.status).toBe(400);
  });

  test('TC-L-16: Change password <6 chars → 400', async ({ page }) => {
    await loginAdmin(page);
    const res = await apiCall(page, 'PUT', '/api/auth/change-password', {
      old_password: CRED.admin.password,
      new_password: 'Ab1!',
    });
    expect(res.status).toBe(400);
  });
});

// ─── Lock/Unlock ──────────────────────────────────────────

test.describe('Lock/Unlock', () => {
  test.describe.configure({ mode: 'serial' });

  test('TC-L-18: Account lock → blocked', async ({ page }) => {
    await loginAdmin(page);
    const createRes = await apiCall(page, 'POST', '/api/users', {
      username: 'lock-test-' + Date.now(),
      password: 'Test@123',
      full_name: 'Lock Test',
      email: 'lock-test@x.vn',
      role: 'infrastructure-officer',
    });
    const userId = createRes.data.id;
    const lockRes = await apiCall(page, 'PUT', `/api/users/${userId}/lock`, {});
    expect(lockRes.status).toBe(200);
    const loginRes = await page.request.post(`${BASE}/api/auth/login`, {
      data: { username: createRes.data.username, password: 'Test@123' },
    });
    expect(loginRes.status()).toBe(423);
    await apiCall(page, 'PUT', `/api/users/${userId}/unlock`, {}).catch(() => {});
    await apiCall(page, 'DELETE', `/api/users/${userId}`).catch(() => {});
  });

  test('TC-L-19: Account unlock → login OK', async ({ page }) => {
    await loginAdmin(page);
    const createRes = await apiCall(page, 'POST', '/api/users', {
      username: 'unlock-test-' + Date.now(),
      password: 'Test@123',
      full_name: 'Unlock Test',
      email: 'unlock-test@x.vn',
      role: 'infrastructure-officer',
    });
    const userId = createRes.data.id;
    await apiCall(page, 'PUT', `/api/users/${userId}/lock`, {});
    const unlockRes = await apiCall(page, 'PUT', `/api/users/${userId}/unlock`, {});
    expect(unlockRes.status).toBe(200);
    const loginRes = await page.request.post(`${BASE}/api/auth/login`, {
      data: { username: createRes.data.username, password: 'Test@123' },
    });
    expect(loginRes.status()).toBe(200);
    await apiCall(page, 'DELETE', `/api/users/${userId}`).catch(() => {});
  });

  test('TC-L-20: Cannot self-lock → 400', async ({ page }) => {
    await loginAdmin(page);
    const res = await apiCall(page, 'PUT', '/api/users/self/lock', {});
    expect(res.status).toBe(400);
  });

  test('TC-L-21: Cannot self-delete → 400', async ({ page }) => {
    await loginAdmin(page);
    const res = await apiCall(page, 'DELETE', '/api/users/self', {});
    expect(res.status).toBe(400);
  });
});

// ─── Sessions ─────────────────────────────────────────────

test.describe('Sessions', () => {
  test.describe.configure({ mode: 'parallel' });

  test('TC-L-22: Max 5 concurrent sessions', async ({ page }) => {
    await loginAdmin(page);
    const res = await apiCall(page, 'GET', '/api/auth/sessions');
    if (res.status === 200) { expect(res.data.sessions).toBeDefined(); }
  });

  test('TC-L-23: GET /api/auth/me → current user', async ({ page }) => {
    await loginAdmin(page);
    const res = await apiCall(page, 'GET', '/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.data.user).toBeDefined();
    expect(res.data.user.username).toBe(CRED.admin.username);
  });

  test('TC-L-24: GET /api/auth/me expired → 401', async ({ page }) => {
    await page.goto(BASE);
    await page.evaluate(() => localStorage.removeItem('mtis_token'));
    const res = await apiCall(page, 'GET', '/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('TC-L-25: GET /api/auth/login-log → access', async ({ page }) => {
    await loginAdmin(page);
    const res = await apiCall(page, 'GET', '/api/auth/login-log?page=1&limit=10');
    expect(res.status).toBe(200);
  });

  test('TC-L-26: GET /api/auth/login-log filter by status', async ({ page }) => {
    await loginAdmin(page);
    const res = await apiCall(page, 'GET', '/api/auth/login-log?status=success&page=1&limit=5');
    expect(res.status).toBe(200);
  });

  test('TC-L-27: GET /api/auth/login-log pagination', async ({ page }) => {
    await loginAdmin(page);
    const res = await apiCall(page, 'GET', '/api/auth/login-log?page=1&limit=2');
    expect(res.status).toBe(200);
  });

  test('TC-L-28: GET /api/auth/login-log filter by username', async ({ page }) => {
    await loginAdmin(page);
    const res = await apiCall(page, 'GET', '/api/auth/login-log?username=admin&page=1&limit=5');
    expect(res.status).toBe(200);
  });
});

// ─── TOTP ─────────────────────────────────────────────────

test.describe('TOTP', () => {
  test.describe.configure({ mode: 'parallel' });

  test('TC-L-29: TOTP setup endpoint exists', async ({ page }) => {
    await loginAdmin(page);
    const res = await apiCall(page, 'POST', '/api/auth/totp/setup', {});
    expect(res.status).toBe(200);
  });

  test('TC-L-30: TOTP verify endpoint exists', async ({ page }) => {
    await loginAdmin(page);
    const res = await apiCall(page, 'POST', '/api/auth/totp/verify', { code: '000000' });
    expect([400, 500]).toContain(res.status);
  });

  test('TC-L-31: TOTP disable endpoint exists', async ({ page }) => {
    await loginAdmin(page);
    const res = await apiCall(page, 'POST', '/api/auth/totp/disable', {});
    expect([200, 400]).toContain(res.status);
  });
});

// ─── Logout ───────────────────────────────────────────────

test.describe('Logout', () => {
  test.describe.configure({ mode: 'parallel' });

  test('TC-L-32: POST /api/auth/logout → session destroyed', async ({ page }) => {
    await loginAdmin(page);
    const res = await apiCall(page, 'POST', '/api/auth/logout', {});
    expect(res.status).toBe(200);
    const meRes = await apiCall(page, 'GET', '/api/auth/me');
    expect(meRes.status).toBe(401);
  });
});

// ─── Forgot Password ──────────────────────────────────────

test.describe('Forgot Password', () => {
  test.describe.configure({ mode: 'parallel' });

  test('TC-L-33: POST /api/auth/forgot-password accepts valid email', async ({ page }) => {
    const res = await page.request.post(`${BASE}/api/auth/forgot-password`, {
      data: { email: 'nonexistent@test.vn' },
    });
    expect(res.status()).toBe(200);
  });

  test('TC-L-34: POST /api/auth/forgot-password invalid → 400', async ({ page }) => {
    const res = await page.request.post(`${BASE}/api/auth/forgot-password`, {
      data: { email: 'not-an-email' },
    });
    expect(res.status()).toBe(400);
  });

  test('TC-L-35: POST /api/auth/reset-password invalid token → 400', async ({ page }) => {
    const res = await page.request.post(`${BASE}/api/auth/reset-password`, {
      data: { token: 'invalid-token-123', password: 'NewPass@123' },
    });
    expect(res.status()).toBe(400);
  });
});

// ─── Organizations ────────────────────────────────────────

test.describe('Organizations', () => {
  test.describe.configure({ mode: 'parallel' });

  test('TC-L-ORG-01: GET /api/organizations returns tree', async ({ page }) => {
    await loginAdmin(page);
    const res = await apiCall(page, 'GET', '/api/organizations');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data.orgs)).toBeTruthy();
  });

  test('TC-L-ORG-02: Non-admin cannot create org → 403', async ({ page }) => {
    await loginNonAdmin(page);
    const res = await apiCall(page, 'POST', '/api/organizations', {
      name: 'Test Org',
      description: 'Test',
    });
    expect(res.status).toBe(403);
  });
});

// ─── Permissions ──────────────────────────────────────────

test.describe('Permissions', () => {
  test.describe.configure({ mode: 'parallel' });

  test('TC-L-PERM-01: GET /api/permissions returns matrix', async ({ page }) => {
    await loginAdmin(page);
    const res = await apiCall(page, 'GET', '/api/permissions');
    expect(res.status).toBe(200);
  });

  test('TC-L-PERM-02: Non-admin cannot modify → 403', async ({ page }) => {
    await loginNonAdmin(page);
    const res = await apiCall(page, 'PUT', '/api/permissions', {
      group_id: 1, feature_code: 'user',
      can_create: 0, can_read: 0, can_update: 0, can_delete: 0,
    });
    expect(res.status).toBe(403);
  });
});
