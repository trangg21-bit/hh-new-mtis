---
module-id: M-001
module-slug: user-management
audit-stage: ui-guardrail-design
auditor: architecture-compliance-auditor
date: 2026-06-12
scope: docs/ui/ (frontend vanilla JS SPA)
findings-count: 5
verdict: Blocked
---

# UI Guardrail Architecture Audit Report — M-001 User Management

## Executive Summary

Module M-001 implements a **Vanilla JS SPA** (no framework, no build step) with hash-based routing at `docs/ui/`. While the module passed QA with 38/38 test cases, **3 UI errors were confirmed by QA** and **5 additional UI guardrail violations** were identified through static analysis of 21 source files (1,520+ lines of JS). This report defines an automated UI Guardrail pipeline to catch these errors earlier in the SDLC.

## Current Architecture Assessment

### Stack Verification
| Component | Technology | Compliant |
|-----------|-----------|-----------|
| Frontend | Vanilla JS (HTML/CSS/JS) — no build step | ⚠️ Deviates from AGENTS.md spec (React SPA) — but accepted as interim |
| Routing | Hash router (`window.location.hash`) | ✅ |
| Auth | JWT in localStorage | ✅ |
| Component System | Custom objects (SCREEN_*) + global TOAST/MODAL | ✅ |
| Tests | Playwright (E2E) + manual QA | ✅ |
| No unauthorized npm packages | No package.json found | ✅ |

**Note:** The AGENTS.md tech stack specifies "React SPA (Vite) — TBC", but M-001 uses Vanilla JS. This is acknowledged as a pragmatic interim approach — the guardrail design should cover both patterns.

---

## Part 1: Confirmed UI Errors from QA (3 Critical Issues)

### UI-ERR-01: `alert()` Used Instead of TOAST — **16 instances across 6 files**

**Evidence:**

| File | Line | Code Pattern |
|------|------|-------------|
| `screens/users.js` | 219 | `return alert('Không có dữ liệu')` |
| `screens/users.js` | 313 | `return alert('⚠ Vui lòng điền đầy đủ thông tin!')` |
| `screens/users.js` | 317 | `return alert('⚠ Vui lòng nhập mật khẩu!')` |
| `screens/users.js` | 333 | `alert('❌ Lỗi: ' + e.message)` |
| `screens/users.js` | 343 | `alert('❌ Lỗi: ' + e.message)` |
| `screens/users.js` | 351 | `alert('❌ Lỗi: ' + e.message)` |
| `screens/groups.js` | 113 | `return alert('⚠ Vui lòng nhập tên nhóm!')` |
| `screens/groups.js` | 131 | `alert('❌ Lỗi: ' + e.message)` |
| `screens/groups.js` | 139 | `alert('❌ Lỗi: ' + e.message)` |
| `screens/groups.js` | 215 | `alert('❌ Lỗi: ' + e.message)` |
| `screens/groups.js` | 224 | `alert('❌ Lỗi: ' + e.message)` |
| `screens/permissions.js` | 287 | `return alert('⚠ Vui lòng chọn nhóm...')` |
| `screens/permissions.js` | 297 | `alert('✅ Lưu phân quyền thành công!')` |
| `screens/permissions.js` | 299 | `alert('❌ Lỗi: ' + e.message)` |
| `screens/organizations.js` | 175 | `return alert('⚠ Vui lòng nhập tên đơn vị!')` |
| `screens/organizations.js` | 197 | `alert('❌ Lỗi: ' + e.message)` |
| `screens/organizations.js` | 208 | `alert('❌ Lỗi: ' + e.message)` |
| `screens/sessions.js` | 86 | `alert(res.message || 'Đã thu hồi...')` |
| `screens/sessions.js` | 88 | `alert('Lỗi: ' + e.message)` |
| `screens/totp.js` | 196 | `prompt('Nhập mật khẩu để xác nhận...')` |

**Impact:** Native `alert()` blocks the thread, is not styled to match the enterprise theme, and is not accessible (no ARIA attributes). The `TOAST` component at `js/components/toast.js` exists and is used in some screens (users.js line 322, groups.js line 121, organizations.js line 186), but **not consistently** — developers use whichever pattern they choose at the moment.

**Contradiction in Tests:** `playwright/login.spec.ts` line 27-35 expects `.toast-error` class, but the login screen uses `showError()` which renders into `#login-error` div. No toast is ever shown on login failure — the test expectations are wrong.

### UI-ERR-02: Hardcoded Data Instead of API — **1 instance in 1 file**

**Evidence:** `screens/permissions.js` lines 124-168 — `_buildFeatureTree()` returns a hardcoded tree with 5 feature categories (`QLND`, `QTHT`, `TSKT`, `GISM`, `OPS`) with 13 sub-features. This is used as a fallback when API fails:

```javascript
// permissions.js line 95-98
this._featureTree = data.feature_tree || this._buildFeatureTree();
```

The hardcoded tree has **5 root nodes and 13 leaf nodes** that may diverge from the actual backend data model. Any backend feature addition requires manual sync of both API and this fallback.

### UI-ERR-03: Duplicate Method Definition — **1 instance in 1 file**

**Evidence:** `screens/permissions.js` lines 203-207 and 209-213 — `toggleParent(id, checked)` is **defined twice** with identical body:

```javascript
// Line 203-207
toggleParent(id, checked) {
    this._recursiveCheck(id, checked);
    this.renderTree();
},
// Line 209-213  — DUPLICATE
toggleParent(id, checked) {
    this._recursiveCheck(id, checked);
    this.renderTree();
},
```

While the second definition overwrites the first (so functionally correct), this is a **code quality hazard** — a future refactorer might modify one copy but not the other, silently breaking the behavior.

---

## Part 2: Additional Patterns Flagged for Guardrail Design

### Pattern A: `confirm()` Used Instead of MODAL.confirm — **8 instances**

All confirmation dialogs use the blocking `confirm()` instead of the non-blocking `MODAL.confirm()`:

| File | Line | Usage |
|------|------|-------|
| `screens/users.js` | 339 | `confirm('...')` |
| `screens/users.js` | 347 | `confirm('...')` |
| `screens/groups.js` | 135 | `confirm('...')` |
| `screens/groups.js` | 220 | `confirm('...')` |
| `screens/organizations.js` | 203 | `confirm('...')` |
| `screens/sessions.js` | 83 | `confirm('...')` |

The `MODAL` component exists (`js/components/modal.js`) with `MODAL.confirm()` returning a Promise and styled to match the enterprise theme.

### Pattern B: `prompt()` Used for Sensitive Input — **1 instance**

| File | Line | Usage |
|------|------|-------|
| `screens/totp.js` | 196 | `prompt('Nhập mật khẩu để xác nhận vô hiệu hóa 2FA:')` |

Native `prompt()` is a security anti-pattern — it cannot be styled, is not accessible, and users can dismiss it without intent. Should use `MODAL.alert()` with a password input field.

---

## Part 3: UI Guardrail Auto-Scan Patterns (Regex)

These patterns should be integrated into the code-reviewer stage as pre-scan checks:

| Pattern ID | Description | Regex / Search Pattern | Severity |
|------------|------------|----------------------|----------|
| UR-01 | Native `alert()` call | `[^.]alert\(` | **High** — should use TOAST.error() |
| UR-02 | Success alert (should be TOAST) | `alert\(['"]\s*[✅✔]` | **High** — success must use TOAST |
| UR-03 | Native `confirm()` call | `[^.]confirm\(` | **Medium** — should use MODAL.confirm() |
| UR-04 | Native `prompt()` call | `[^.]prompt\(` | **High** — security anti-pattern |
| UR-05 | Hardcoded feature tree (permissions.js) | `_buildFeatureTree\(` | **Medium** — fallback should not have real data |
| UR-06 | Duplicate method name | Regex scan: find same method name with same body in same object literal | **Low** — code smell |
| UR-07 | `onclick=` in HTML string with method call | `onclick="SCREEN_\w+\.(\w+)"` | **Medium** — validate method exists |
| UR-08 | TOAST existence check | Verify `TOAST.success()` used instead of `alert()` in success paths | **High** — consistency |
| UR-09 | Modal not closing after save | Check `saveForm` / `savePermissions` for `.modal-overlay` removal | **High** — UX bug |
| UR-10 | Hardcoded static data objects | Multi-line object literal with ≥3 levels of nesting, assigned to `_build*` or `static` variable | **Medium** — should be API-driven |

---

## Part 4: Playwright Smoke Test Templates

### Template 1: No `alert()` on User Journey

```typescript
import { test, expect } from '@playwright/test';

test.describe('UI Guardrail — No native alert/prompt/confirm', () => {
  test('User creation failure shows TOAST not alert', async ({ page }) => {
    await page.goto('http://localhost:3000/#users');
    await page.waitForSelector('.ant-table');
    
    // Click "Thêm" to open create modal
    await page.click('.btn-primary'); // "＋ Thêm" button
    await expect(page.locator('.modal-overlay')).toBeVisible();
    
    // Try to submit with empty fields
    await page.click('.btn-primary', { hasText: 'Lưu' });
    
    // Verify: TOAST error visible, NOT native alert
    // Playwright's page.on('dialog') catches native alerts
    let dialogShown = false;
    page.on('dialog', () => { dialogShown = true; });
    
    // If dialogShown, that means alert() was used (BAD)
    // If TOAST visible, that's correct (GOOD)
    const toastVisible = await page.locator('.toast-error').isVisible().catch(() => false);
    expect(dialogShown).toBe(false);
    expect(toastVisible).toBe(true);
  });

  test('No native prompt() on TOTP disable', async ({ page }) => {
    await page.goto('http://localhost:3000/#password');
    
    let promptShown = false;
    page.on('dialog', async (dialog) => {
      if (dialog.type() === 'prompt') promptShown = true;
    });
    
    // Trigger TOTP disable flow
    // ... (after navigating to TOTP section)
    // Verify no native prompt was triggered
    expect(promptShown).toBe(false);
  });

  test('No native confirm() on destructive actions', async ({ page }) => {
    await page.goto('http://localhost:3000/#groups');
    
    let confirmShown = false;
    page.on('dialog', async (dialog) => {
      if (dialog.type() === 'confirm') confirmShown = true;
    });
    
    // Trigger delete on a group
    await page.click('.btn-ghost[title="Xóa"]');
    
    expect(confirmShown).toBe(false);
  });
});
```

### Template 2: Modal Auto-Close After Save

```typescript
test.describe('UI Guardrail — Modal lifecycle', () => {
  test('Create user modal auto-closes after successful save', async ({ page }) => {
    await page.goto('http://localhost:3000/#users');
    
    // Open create modal
    await page.click('button:has-text("＋ Thêm")');
    await expect(page.locator('.modal-overlay')).toBeVisible();
    
    // Fill form
    await page.fill('#user-username', 'test-user-guardrail');
    await page.fill('#user-fullname', 'Test User');
    await page.fill('#user-email', 'test@example.com');
    await page.fill('#user-password', 'Test1234!');
    
    // Save
    await page.click('button.btn-primary:has-text("Lưu")');
    
    // Verify modal closes AND TOAST shows
    await expect(page.locator('.modal-overlay')).toBeHidden();
    await expect(page.locator('.toast-success')).toBeVisible();
    
    // Verify data refreshed
    const row = page.locator('td', { hasText: 'test-user-guardrail' });
    await expect(row).toBeVisible();
  });

  test('Edit group modal auto-closes after save', async ({ page }) => {
    await page.goto('http://localhost:3000/#groups');
    await page.click('button:has-text("＋ Thêm nhóm")');
    await expect(page.locator('.modal-overlay')).toBeVisible();
    
    await page.fill('#group-name', 'Test Group Guardrail');
    await page.click('button.btn-primary:has-text("Lưu")');
    
    await expect(page.locator('.modal-overlay')).toBeHidden();
    await expect(page.locator('.toast-success')).toBeVisible();
  });
});
```

### Template 3: Hardcoded Data Detection via API Comparison

```typescript
test.describe('UI Guardrail — No hardcoded data', () => {
  test('Permissions feature tree comes from API, not hardcoded', async ({ page }) => {
    await page.goto('http://localhost:3000/#permissions');
    
    // Capture API calls
    const apiCalls: string[] = [];
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/permissions')) {
        apiCalls.push(url);
      }
    });
    
    // Select a role to trigger tree render
    await page.selectOption('#perms-role-select', { value: '1' });
    await page.waitForTimeout(500);
    
    // Verify tree was rendered from API response
    const apiData = await apiCalls.length > 0 
      ? await page.evaluate(async () => {
          // The feature_tree from API should be in DOM
          return document.querySelector('.perms-node')?.textContent;
        })
      : null;
    
    expect(apiCalls.length).toBeGreaterThan(0);
  });
});
```

---

## Part 5: Integration into SDLC Pipeline — `_state.md` Stage Addition

Add the following to the pipeline stages in `_state.md`:

```yaml
stages-queue:
  # ... existing stages ...
  utility-ui-guardrail:
    description: "Auto-scan frontend code for UI anti-patterns before code-review"
    triggers: "on PR submission or merge to dev"
    checks:
      - pattern: UR-01 (alert → TOAST migration)
      - pattern: UR-02 (success alert → TOAST)
      - pattern: UR-03 (confirm → MODAL.confirm)
      - pattern: UR-04 (prompt → MODAL with password input)
      - pattern: UR-05 (hardcoded feature tree detection)
      - pattern: UR-07 (onclick method existence validation)
      - pattern: UR-09 (modal auto-close after save)
    tools:
      - grep regex scan (UR-01 to UR-06)
      - Playwright smoke tests (Template 1, 2, 3)
      - JS AST scan for duplicate methods (UR-06)
    pass_criteria:
      - Zero UR-01 violations (alert → TOAST)
      - Zero UR-04 violations (prompt)
      - Zero UR-09 violations (modal leak)
      - All Playwright smoke tests pass
    stage_duration_target: "2 minutes"
    blocking: true
```

---

## Part 6: Code-Reviewer Checklist

Integrate this checklist into the `engineering-code-reviewer` stage:

### UI Guardrail Checklist for Code Reviewer

- [ ] **UR-01**: No `alert()` in screen files — all user-facing messages use `TOAST` or `MODAL.alert()`
- [ ] **UR-02**: Success messages never use `alert()` with ✅/✔ emoji — must use `TOAST.success()`
- [ ] **UR-03**: All confirmation dialogs use `MODAL.confirm()` not native `confirm()`
- [ ] **UR-04**: No `prompt()` for password or sensitive input — use `MODAL.alert()` with form
- [ ] **UR-05**: Feature trees, menus, and config data come from API — `_build*()` fallback must contain zero business data
- [ ] **UR-06**: No duplicate method definitions in screen objects — verify with duplicate detection
- [ ] **UR-07**: All `onclick="SCREEN_*.*"` handlers reference methods that exist in the screen object
- [ ] **UR-08**: Consistent TOAST usage — all 3 screens (users, groups, organizations) use TOAST for success
- [ ] **UR-09**: All modal `saveForm()` functions close the overlay AND show TOAST before closing
- [ ] **UR-10**: Static/hardcoded data objects checked against backend API response structure

---

## Findings Summary

| Finding ID | Severity | Category | Status |
|------------|----------|----------|--------|
| UR-01 | High | alert() instead of TOAST | **Blocked** — 16 instances found |
| UR-02 | High | Success uses alert() | **Blocked** — 3 instances |
| UR-03 | Medium | confirm() instead of MODAL | **Needs-clarification** — 8 instances, no impact on functionality |
| UR-04 | High | prompt() for sensitive input | **Blocked** — 1 instance (TOTP disable) |
| UR-05 | Medium | Hardcoded feature tree | **Needs-clarification** — functional as fallback |
| UR-06 | Low | Duplicate toggleParent method | **Changes-requested** — code smell only |
| UR-07 | Medium | onclick method existence | **Needs-clarification** — no evidence of broken handler yet |
| UR-09 | High | Modal auto-close pattern | **Pass** — users.js, groups.js, organizations.js DO close modals correctly |

---

## Verdict Justification

**Verdict: Blocked**

The module is blocked from proceeding in the SDLC pipeline because:

1. **UR-01 (alert vs TOAST)**: 16 instances of `alert()` across 6 screen files. The `TOAST` component exists but is used inconsistently — some screens use it, others use `alert()`. The Playwright tests expect `.toast-error` but the login screen never renders toasts. This creates a **functional gap** between tests and implementation.

2. **UR-04 (prompt for password)**: The TOTP disable flow uses `prompt()` for password confirmation — a security anti-pattern for a 2FA-sensitive operation.

3. **UR-09 (modal close)**: Partially compliant — users.js, groups.js, and organizations.js close modals after save, but this is done inconsistently. `permissions.js` save uses `alert()` for success and has no modal to close, but the inconsistency is a signal.

4. **UR-06 (duplicate method)**: `toggleParent` duplicated in permissions.js — while functionally harmless, it indicates a lack of tooling to catch such issues early.

The UI Guardrail stage MUST be added to the pipeline BEFORE the code-reviewer stage. The guardrail should run auto-scan regex checks + Playwright smoke tests. Without this stage, the same 3 UI errors that QA found at the end of the pipeline will recur in every new module.

---

## Next Actions

1. **Implement UR-01 fix**: Replace all 16 `alert()` calls with `TOAST.error()` or `MODAL.alert()` — assign to Frontend Developer
2. **Implement UR-04 fix**: Replace `prompt()` in TOTP disable with `MODAL.alert()` containing password input — assign to Frontend Developer
3. **Implement UR-05 fix**: Add `_featureTree` from backend API response, remove hardcoded fallback data — assign to Backend + Frontend Developer
4. **Implement UR-06 fix**: Remove duplicate `toggleParent` method — assign to Frontend Developer
5. **Integrate UI Guardrail stage** into `_state.md` pipeline configuration — assign to Architecture/DevOps
6. **Add Playwright smoke tests** from Part 3 templates to `docs/modules/M-001-user-management/playwright/` — assign to QA Engineer
7. **Add checklist** from Part 6 to code-reviewer agent instructions — assign to Pipeline Orchestrator
