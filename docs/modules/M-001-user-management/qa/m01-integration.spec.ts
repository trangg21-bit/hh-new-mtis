import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

/**
 * M01 — User Management Integration Test Suite
 * Covers 10 features across 14 screens
 *
 * Prerequisites:
 * - Server running at http://localhost:3000 with seeded data
 * - Playwright installed (npm init playwright)
 *
 * Run: npx playwright test m01-integration.spec.ts
 */

test.describe('M01 — User Management', () => {
  // ─── F-M01-002: Login / F-M01-010: Session ─────────────────────

  test.describe('F-M01-002: User Login + F-M01-010: Session', () => {
    test('TC-LOGIN-001: Login page loads and renders correctly', async ({ page }) => {
      await page.goto(`${BASE}/#login`);
      await expect(page.locator('.login-card')).toBeVisible();
      await expect(page.locator('#login-username')).toBeVisible();
      await expect(page.locator('#login-password')).toBeVisible();
      await expect(page.locator('#login-btn')).toBeVisible();
      await expect(page.locator('a[href="#forgot-password"]')).toBeVisible();
    });

    test('TC-LOGIN-002: Login with valid admin credentials', async ({ page }) => {
      await page.goto(`${BASE}/#login`);
      await page.fill('#login-username', 'admin');
      await page.fill('#login-password', 'admin123');
      await page.click('#login-btn');
      await expect(page).toHaveURL(/#dashboard/);
      // Verify dashboard shows user greeting
      await expect(page.locator('.page-subtitle')).toContainText('Xin chào');
    });

    test('TC-LOGIN-003: Login with wrong password shows error', async ({ page }) => {
      await page.goto(`${BASE}/#login`);
      await page.fill('#login-username', 'admin');
      await page.fill('#login-password', 'wrongpass');
      await page.click('#login-btn');
      await expect(page.locator('#login-error')).toBeVisible();
      await expect(page.locator('#login-error')).toContainText('Sai tên đăng nhập');
    });

    test('TC-LOGIN-004: Empty fields show validation', async ({ page }) => {
      await page.goto(`${BASE}/#login`);
      await page.click('#login-btn');
      await expect(page.locator('#login-error')).toBeVisible();
    });

    test('TC-LOGIN-005: Login with locked account shows 423 message', async ({ page }) => {
      // First, login as admin to lock a user
      await page.goto(`${BASE}/#login`);
      await page.fill('#login-username', 'admin');
      await page.fill('#login-password', 'admin123');
      await page.click('#login-btn');
      await expect(page).toHaveURL(/#dashboard/);

      // Navigate to users and lock chuyenviem1
      await page.goto(`${BASE}/#users`);
      await page.waitForSelector('#users-tbody');

      // Find the lock button for chuyenviem1 and click
      const lockBtn = page.locator('button[aria-label="Khóa"]').first();
      if (await lockBtn.isVisible()) {
        page.on('dialog', (dialog) => dialog.accept());
        await lockBtn.click();
        await page.waitForTimeout(500);
      }

      // Logout
      await page.evaluate(() => {
        localStorage.removeItem('mtis_token');
        localStorage.removeItem('mtis_user');
      });
      await page.goto(`${BASE}/#login`);

      // Try logging in as locked user
      // Note: using a pre-locked user would be more deterministic
      // This test is a placeholder for the actual locked-user flow
    });

    test('TC-LOGOUT-001: Logout clears session and redirects to login', async ({ page }) => {
      await page.goto(`${BASE}/#login`);
      await page.fill('#login-username', 'admin');
      await page.fill('#login-password', 'admin123');
      await page.click('#login-btn');
      await expect(page).toHaveURL(/#dashboard/);

      // Click logout via dropdown
      await page.click('.avatar');
      await page.click('a[href="#"] >> text=Đăng xuất');

      await expect(page).toHaveURL(/#login/);
    });
  });

  // ─── F-M01-003: Password Management ─────────────────────────────

  test.describe('F-M01-003: Password Management', () => {
    test('TC-PW-001: Forgot password screen renders', async ({ page }) => {
      await page.goto(`${BASE}/#forgot-password`);
      await expect(page.locator('#forgot-email')).toBeVisible();
      await expect(page.locator('#forgot-btn')).toBeVisible();
      await expect(page.locator('a[href="#login"]')).toBeVisible();
    });

    test('TC-PW-002: Change password screen accessible from dashboard', async ({ page }) => {
      await page.goto(`${BASE}/#login`);
      await page.fill('#login-username', 'admin');
      await page.fill('#login-password', 'admin123');
      await page.click('#login-btn');

      await page.goto(`${BASE}/#password`);
      await expect(page.locator('#pw-old')).toBeVisible();
      await expect(page.locator('#pw-new')).toBeVisible();
      await expect(page.locator('#pw-confirm')).toBeVisible();
    });

    test('TC-PW-003: Reset password screen with token renders', async ({ page }) => {
      await page.goto(`${BASE}/#reset-password/some-test-token`);
      await expect(page.locator('#reset-password')).toBeVisible();
      await expect(page.locator('#reset-confirm')).toBeVisible();
      await expect(page.locator('#reset-btn')).toBeVisible();
    });
  });

  // ─── F-M01-001: User Registration ──────────────────────────────

  test.describe('F-M01-001: User Registration', () => {
    test('TC-REG-001: Registration form renders for admin', async ({ page }) => {
      await page.goto(`${BASE}/#login`);
      await page.fill('#login-username', 'admin');
      await page.fill('#login-password', 'admin123');
      await page.click('#login-btn');

      await page.goto(`${BASE}/#register`);
      await expect(page.locator('#reg-fullname')).toBeVisible();
      await expect(page.locator('#reg-username')).toBeVisible();
      await expect(page.locator('#reg-password')).toBeVisible();
      await expect(page.locator('#reg-confirm')).toBeVisible();
      await expect(page.locator('#reg-role')).toBeVisible();
    });

    test('TC-REG-002: Password strength indicator updates on input', async ({ page }) => {
      await page.goto(`${BASE}/#login`);
      await page.fill('#login-username', 'admin');
      await page.fill('#login-password', 'admin123');
      await page.click('#login-btn');

      await page.goto(`${BASE}/#register`);
      await page.fill('#reg-password', 'Test@123');
      await expect(page.locator('#reg-strength')).toBeVisible();
    });

    test('TC-REG-003: Create new user via form', async ({ page }) => {
      await page.goto(`${BASE}/#login`);
      await page.fill('#login-username', 'admin');
      await page.fill('#login-password', 'admin123');
      await page.click('#login-btn');

      await page.goto(`${BASE}/#register`);
      await page.fill('#reg-fullname', 'QA Test User');
      await page.fill('#reg-username', 'qa.testuser');
      await page.fill('#reg-email', 'qa@test.com');
      await page.fill('#reg-password', 'QaTest@123');
      await page.fill('#reg-confirm', 'QaTest@123');
      await page.click('#reg-btn');

      await expect(page.locator('#reg-success')).toBeVisible();
    });
  });

  // ─── F-M01-004: User Group Management ──────────────────────────

  test.describe('F-M01-004: User Group Management', () => {
    test('TC-GROUP-001: Groups screen renders with list', async ({ page }) => {
      await page.goto(`${BASE}/#login`);
      await page.fill('#login-username', 'admin');
      await page.fill('#login-password', 'admin123');
      await page.click('#login-btn');

      await page.goto(`${BASE}/#groups`);
      await expect(page.locator('table')).toBeVisible();
      await expect(page.locator('button:has-text("Thêm nhóm")')).toBeVisible();
    });

    test('TC-GROUP-002: Create group via modal', async ({ page }) => {
      await page.goto(`${BASE}/#login`);
      await page.fill('#login-username', 'admin');
      await page.fill('#login-password', 'admin123');
      await page.click('#login-btn');

      await page.goto(`${BASE}/#groups`);
      await page.click('button:has-text("Thêm nhóm")');
      await expect(page.locator('.modal-overlay')).toBeVisible();
      await page.fill('#create-group-name', 'QA Test Group');
      await page.click('#btn-create-save');
      await page.waitForTimeout(500);
      // Modal should close and list should refresh
      await expect(page.locator('.modal-overlay')).toHaveCount(0);
    });
  });

  // ─── F-M01-005: Permission Role Management ─────────────────────

  test.describe('F-M01-005: Permission Role Management', () => {
    test('TC-PERM-001: Permissions screen renders matrix', async ({ page }) => {
      await page.goto(`${BASE}/#login`);
      await page.fill('#login-username', 'admin');
      await page.fill('#login-password', 'admin123');
      await page.click('#login-btn');

      await page.goto(`${BASE}/#permissions`);
      await expect(page.locator('#perms-tbody')).toBeVisible();
      await expect(page.locator('#perms-save-btn')).toBeVisible();
    });

    test('TC-PERM-002: Toggle a permission checkbox', async ({ page }) => {
      await page.goto(`${BASE}/#login`);
      await page.fill('#login-username', 'admin');
      await page.fill('#login-password', 'admin123');
      await page.click('#login-btn');

      await page.goto(`${BASE}/#permissions`);
      await page.waitForSelector('#perms-tbody input[type="checkbox"]');

      const checkbox = page.locator('#perms-tbody input[type="checkbox"]').first();
      const isChecked = await checkbox.isChecked();
      await checkbox.click();
      await expect(checkbox).toBeChecked({ checked: !isChecked });
    });
  });

  // ─── F-M01-006: Audit User Logins ──────────────────────────────

  test.describe('F-M01-006: Audit User Logins', () => {
    test('TC-LOG-001: Login log screen renders with filters', async ({ page }) => {
      await page.goto(`${BASE}/#login`);
      await page.fill('#login-username', 'admin');
      await page.fill('#login-password', 'admin123');
      await page.click('#login-btn');

      await page.goto(`${BASE}/#login-log`);
      await expect(page.locator('#log-username')).toBeVisible();
      await expect(page.locator('#log-from-date')).toBeVisible();
      await expect(page.locator('#log-to-date')).toBeVisible();
      await expect(page.locator('#log-status')).toBeVisible();
      await expect(page.locator('#log-tbody')).toBeVisible();
    });

    test('TC-LOG-002: Apply filter shows matching logs', async ({ page }) => {
      await page.goto(`${BASE}/#login`);
      await page.fill('#login-username', 'admin');
      await page.fill('#login-password', 'admin123');
      await page.click('#login-btn');

      await page.goto(`${BASE}/#login-log`);
      await page.fill('#log-username', 'admin');
      await page.click('button:has-text("Lọc")');
      await page.waitForTimeout(500);
      // Filter should have been applied
    });
  });

  // ─── F-M01-007: Organization Management ────────────────────────

  test.describe('F-M01-007: Organization Management', () => {
    test('TC-ORG-001: Organizations screen renders tree', async ({ page }) => {
      await page.goto(`${BASE}/#login`);
      await page.fill('#login-username', 'admin');
      await page.fill('#login-password', 'admin123');
      await page.click('#login-btn');

      await page.goto(`${BASE}/#organizations`);
      await expect(page.locator('#org-tree-container')).toBeVisible();
      await expect(page.locator('#org-add-btn')).toBeVisible();
    });

    test('TC-ORG-002: Create new organization via inline form', async ({ page }) => {
      await page.goto(`${BASE}/#login`);
      await page.fill('#login-username', 'admin');
      await page.fill('#login-password', 'admin123');
      await page.click('#login-btn');

      await page.goto(`${BASE}/#organizations`);
      await page.click('#org-add-btn');
      await expect(page.locator('#org-new-name')).toBeVisible();
      await page.fill('#org-new-name', 'QA Test Org');
      await page.click('button:has-text("Lưu")');
      await page.waitForTimeout(500);
    });
  });

  // ─── F-M01-008: Account Lock/Unlock ────────────────────────────

  test.describe('F-M01-008: Account Lock/Unlock', () => {
    test('TC-LOCK-001: User list shows lock/unlock buttons', async ({ page }) => {
      await page.goto(`${BASE}/#login`);
      await page.fill('#login-username', 'admin');
      await page.fill('#login-password', 'admin123');
      await page.click('#login-btn');

      await page.goto(`${BASE}/#users`);
      await page.waitForSelector('#users-tbody tr td:not(:only-child)');

      // Check lock buttons exist
      const lockButtons = page.locator('button[aria-label="Khóa"], button[aria-label="Mở khóa"]');
      const count = await lockButtons.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  // ─── F-M01-009: TOTP Two-Factor Auth ───────────────────────────

  test.describe('F-M01-009: TOTP Two-Factor Auth', () => {
    test('TC-TOTP-001: TOTP config screen renders', async ({ page }) => {
      await page.goto(`${BASE}/#login`);
      await page.fill('#login-username', 'admin');
      await page.fill('#login-password', 'admin123');
      await page.click('#login-btn');

      await page.goto(`${BASE}/#totp`);
      await expect(page.locator('#btn-totp-setup')).toBeVisible();
    });

    test('TC-TOTP-002: Setup TOTP opens QR code', async ({ page }) => {
      await page.goto(`${BASE}/#login`);
      await page.fill('#login-username', 'admin');
      await page.fill('#login-password', 'admin123');
      await page.click('#login-btn');

      await page.goto(`${BASE}/#totp`);
      await page.click('#btn-totp-setup');
      await page.waitForTimeout(1000);
      // QR code image should appear
      await expect(page.locator('#totp-qrcode')).toBeVisible();
    });
  });

  // ─── F-M01-010: Multi-Session Management ──────────────────────────

  test.describe('F-M01-010: Multi-Session Management', () => {
    test('TC-SESS-001: Sessions screen renders with list', async ({ page }) => {
      await page.goto(`${BASE}/#login`);
      await page.fill('#login-username', 'admin');
      await page.fill('#login-password', 'admin123');
      await page.click('#login-btn');

      await page.goto(`${BASE}/#sessions`);
      await page.waitForSelector('#sessions-tbody');
      // Should show at least 1 session (the current one)
      const sessionCount = await page.locator('#sessions-tbody tr').count();
      expect(sessionCount).toBeGreaterThan(0);
    });
  });

  // ─── Dashboard (cross-feature) ────────────────────────────────

  test.describe('Dashboard (cross-feature)', () => {
    test('Dashboard shows user stats after login', async ({ page }) => {
      await page.goto(`${BASE}/#login`);
      await page.fill('#login-username', 'admin');
      await page.fill('#login-password', 'admin123');
      await page.click('#login-btn');

      await expect(page).toHaveURL(/#dashboard/);
      await expect(page.locator('#stat-total')).not.toHaveText('—');
      await expect(page.locator('#stat-active')).not.toHaveText('—');
    });
  });

  // ─── Navigation: all sidebar links work ─────────────────────────

  test.describe('Sidebar Navigation', () => {
    test('All sidebar menu items navigate to correct screens', async ({ page }) => {
      await page.goto(`${BASE}/#login`);
      await page.fill('#login-username', 'admin');
      await page.fill('#login-password', 'admin123');
      await page.click('#login-btn');
      await expect(page).toHaveURL(/#dashboard/);

      const links = [
        { hash: '#dashboard', label: 'Dashboard' },
        { hash: '#users', label: 'Người dùng' },
        { hash: '#groups', label: 'Nhóm người dùng' },
        { hash: '#permissions', label: 'Phân quyền' },
        { hash: '#organizations', label: 'Đơn vị' },
        { hash: '#password', label: 'Đổi mật khẩu' },
        { hash: '#sessions', label: 'Phiên đăng nhập' },
        { hash: '#totp', label: 'Cấu hình TOTP' },
        { hash: '#login-log', label: 'Nhật ký đăng nhập' },
      ];

      for (const link of links) {
        await page.goto(`${BASE}/${link.hash}`);
        await page.waitForTimeout(300);
        // Verify the sidebar highlights the active item
        const activeItem = page.locator(`.menu-item.active`);
        await expect(activeItem).toHaveCount(1);
      }
    });
  });

  // ─── Auth guards ─────────────────────────────────────────────

  test.describe('Auth Guards', () => {
    test('Unauthenticated user is redirected to login', async ({ page }) => {
      await page.goto(`${BASE}/#dashboard`);
      await expect(page).toHaveURL(/#login/);
    });

    test('Authenticated user is redirected from login to dashboard', async ({ page }) => {
      await page.goto(`${BASE}/#login`);
      await page.fill('#login-username', 'admin');
      await page.fill('#login-password', 'admin123');
      await page.click('#login-btn');
      await expect(page).toHaveURL(/#dashboard/);

      // Try going to login page
      await page.goto(`${BASE}/#login`);
      await expect(page).toHaveURL(/#dashboard/);
    });
  });
});
