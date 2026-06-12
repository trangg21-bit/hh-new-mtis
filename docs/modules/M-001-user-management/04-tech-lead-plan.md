# M01 — User Management: Tech Lead Plan

## 1. Wave Overview

| Wave | Priority | Features | Dev Capacity | Est. Days | Risk |
|------|----------|----------|--------------|-----------|------|
| **Wave 1** | P0 (Foundation) | F-M01-001, F-M01-002, F-M01-003 | 4 devs | 7–10 | Low |
| **Wave 2** | P1 (Authorization & Structure) | F-M01-004, F-M01-005, F-M01-006, F-M01-007, F-M01-008 | 4 devs | 7–10 | Medium |
| **Wave 3** | P2 (Advanced) | F-M01-009, F-M01-010 | 2 devs | 4–6 | Low |

**Note:** Wave 4 is a QA/Review wave — no new feature development.

---

## 2. Wave Dependency Graph

```
Wave 1 (P0) ───────────────────────────────────────────────────┐
  ├─ BE-1.1 Auth middleware + rate limiter + utils (blocking)  │
  ├─ BE-1.2 Login API + POST logout (blocking for FE-1.2)     │
  ├─ BE-1.3 User CRUD + dashboard stats API                   │
  ├─ BE-1.4 Password management APIs (change/forgot/reset)    │
  │  + password_history + reset_tokens tables                  │
  ├─ FE-1.1 SPA shell: index.html, app.js router, api.js      │
  ├─ FE-1.2 Login screen + auth flow + rate-limit feedback    │
  ├─ FE-1.3 User list + detail/edit + registration form       │
  └─ FE-1.4 Password management + forgot/reset screens        │
                                                               ▼
Wave 2 (P1) ───────────────────────────────────────────────────┐
  ├─ BE-2.1 Group CRUD + group_members API (dep: 1.1)         │
  ├─ BE-2.2 Permissions table + GET/PUT /api/permissions      │
  │  + permissionMiddleware (dep: 2.1)                         │
  ├─ BE-2.3 Login log API (GET /api/auth/login-log) (dep:1.2) │
  ├─ BE-2.4 Organization CRUD + move API (dep: 1.1)           │
  ├─ BE-2.5 Account lock/unlock + auto-lock logic (dep: 1.2)  │
  ├─ FE-2.1 User groups screen                                │
  ├─ FE-2.2 Permission matrix screen                          │
  ├─ FE-2.3 Login log screen                                  │
  └─ FE-2.4 Organization tree screen                          │
                                                               ▼
Wave 3 (P2) ───────────────────────────────────────────────────
  ├─ BE-3.1 TOTP setup/verify/disable APIs (dep: 1.1)
  ├─ BE-3.2 Sessions table + session limit + logout (dep: 1.1)
  ├─ FE-3.1 TOTP config screen
  └─ FE-3.2 Active sessions screen
```

---

## 3. Wave 1 — P0 Foundation (Login, Register, Auth)

### Dev 1 — Backend: Auth & Middleware Infrastructure

| Task | Files | Dependencies |
|------|-------|-------------|
| BE-1.1a | `src/apps/api/src/middleware/authMiddleware.js` — extract from `index.js` | None |
| BE-1.1b | `src/apps/api/src/middleware/adminMiddleware.js` — extract from `index.js` | None |
| BE-1.1c | `src/apps/api/src/middleware/permissionMiddleware.js` — stub (full impl in Wave 2) | None |
| BE-1.1d | `src/apps/api/src/services/rateLimiter.js` — in-memory `Map<username:ip, attempts>` | None |
| BE-1.1e | `src/apps/api/src/services/passwordService.js` — hash, verify, strength check, history | None |
| BE-1.1f | `src/apps/api/src/services/emailService.js` — console.log stub | None |
| BE-1.1g | `src/apps/api/src/utils/jwt.js` — sign + verify helpers | None |
| BE-1.1h | `src/apps/api/src/utils/validation.js` — input validation helpers | None |
| BE-1.1i | `src/apps/api/src/app.js` — refactor `index.js` to app setup + route mounting | None |
| BE-1.1j | Update `src/apps/api/src/db.js` — add `password_history`, `reset_tokens`, `sessions`, `group_permissions`, `organizations` tables (empty CREATE TABLE IF NOT EXISTS) | None |
| BE-1.1k | `src/apps/api/src/index.js` — slim down to just `app.listen()` | 1.1i |

**Feature scope:** F-M01-001, F-M01-002, F-M01-003 (infrastructure for all)

### Dev 2 — Backend: Auth APIs

| Task | Files | Dependencies |
|------|-------|-------------|
| BE-1.2a | Extend `POST /api/auth/login` — add rate limiter integration, IP/device capture, login_log insert, `jti` in JWT | 1.1a, 1.1d |
| BE-1.2b | `GET /api/auth/me` — return effective permissions (from groups) | 1.1a |
| BE-1.2c | `POST /api/auth/logout` — mark session revoked | 1.1a |
| BE-1.2d | Update `src/apps/api/src/routes/auth.js` — refactor to use extracted middleware | 1.1a–1.1g |

**Features:** F-M01-002

### Dev 3 — Backend: User CRUD & Password APIs

| Task | Files | Dependencies |
|------|-------|-------------|
| BE-1.3a | Extend `GET /api/users` — add pagination, search, filter by org_id | 1.1a, 1.1b |
| BE-1.3b | Extend `GET /api/users/:id` — include groups, org path | 1.1a |
| BE-1.3c | Extend `POST /api/users` — use passwordService | 1.1a, 1.1b, 1.1e |
| BE-1.3d | Extend `PUT /api/users/:id` — support status=lock/unlock | 1.1a, 1.1b |
| BE-1.3e | Extend `DELETE /api/users/:id` — cannot self-delete | 1.1a, 1.1b |
| BE-1.3f | `GET /api/admin/stats` — dashboard stats | 1.3a |
| BE-1.4a | `PUT /api/auth/change-password` — validate old password, history check | 1.1a, 1.1e |
| BE-1.4b | `POST /api/auth/forgot-password` — generate token, store in reset_tokens | 1.1a, 1.1g |
| BE-1.4c | `POST /api/auth/reset-password` — validate token, update password, history | 1.1a, 1.1e |

**Features:** F-M01-001, F-M01-003

### Dev 4 — Frontend: SPA Shell + Auth Screens

| Task | Files | Dependencies |
|------|-------|-------------|
| FE-1.1a | `src/apps/api/public/index.html` — SPA shell with `<div id="app">` and hash router | None |
| FE-1.1b | `src/apps/api/public/css/design-system.css` — CSS vars, typography, layout grid | None |
| FE-1.1c | `src/apps/api/public/css/screens.css` — per-screen styles | None |
| FE-1.1d | `src/apps/api/public/js/app.js` — hash-based SPA router + screen registry | None |
| FE-1.1e | `src/apps/api/public/js/api.js` — apiGet/apiPost/apiPut/apiDelete with JWT header | None |
| FE-1.1f | `src/apps/api/public/js/auth.js` — login/logout, JWT localStorage management | None |
| FE-1.2a | `src/apps/api/public/js/screens/login.js` (S-M01-11) | 1.1d–1.1f |
| FE-1.3a | `src/apps/api/public/js/screens/userRegistration.js` (S-M01-09) | 1.1d–1.1f |
| FE-1.3b | `src/apps/api/public/js/screens/userList.js` (S-M01-02) — table, search, pagination | 1.1d–1.1f |
| FE-1.3c | `src/apps/api/public/js/screens/userDetail.js` (S-M01-03) — view/edit mode toggle | 1.1d–1.1f |
| FE-1.4a | `src/apps/api/public/js/screens/passwordManagement.js` (S-M01-10) | 1.1d–1.1f |
| FE-1.4b | `src/apps/api/public/js/screens/forgotPassword.js` (S-M01-12) | 1.1d–1.1f |
| FE-1.4c | `src/apps/api/public/js/screens/resetPassword.js` (S-M01-13) | 1.1d–1.1f |
| FE-1.4d | `src/apps/api/public/js/components/passwordStrength.js` — strength meter | None |
| FE-1.4e | `src/apps/api/public/js/components/toast.js` — toast notification component | None |
| FE-1.4f | `src/apps/api/public/js/components/modal.js` — reusable modal/dialog | None |
| FE-1.4g | `src/apps/api/public/js/components/pagination.js` — pagination controls | None |
| FE-1.4h | Dashboard screen (S-M01-01) — header, stat cards, sidebar, layout | 1.1d–1.1f |

**Features:** F-M01-001, F-M01-002, F-M01-003

### Wave 1 Exit Criteria

- User can log in with seeded admin account → JWT issued ✅
- Login rate-limited (5/15min) with clear feedback ✅
- Admin can create/list/edit/soft-delete users ✅
- Password validation enforced (strength, history, old password) ✅
- Forgot/reset password flow works (stubbed email) ✅
- SPA router shows/hides screens via hash ✅
- All screens show loading/empty/error states ✅

---

## 4. Wave 2 — P1 Authorization & Structure (Groups, Permissions, Orgs, Lock)

### Dev 1 — Backend: Groups + Permissions

| Task | Files | Dependencies |
|------|-------|-------------|
| BE-2.1a | `src/apps/api/src/routes/groups.js` — CRUD groups + member management | 1.1a, 1.1b |
| BE-2.2a | `src/apps/api/src/routes/permissions.js` — GET/PUT /api/permissions + /api/permissions/check | 1.1a, 2.1a |
| BE-2.2b | Implement `permissionMiddleware.js` — load permissions from group_permissions | 2.1a, 2.2a |
| BE-2.2c | Integrate permissionMiddleware into all admin routes | 2.2b |

**Features:** F-M01-004, F-M01-005

### Dev 2 — Backend: Orgs + Login Log + Lock

| Task | Files | Dependencies |
|------|-------|-------------|
| BE-2.3a | `GET /api/auth/login-log` — paginated, filterable | 1.2a |
| BE-2.4a | `src/apps/api/src/routes/organizations.js` — CRUD + move endpoint | 1.1a, 1.1b |
| BE-2.5a | Auto-lock logic — after 5 failed attempts, set status=2 | 1.2a, 1.1d |
| BE-2.5b | `PUT /api/users/:id` — admin lock/unlock, cannot self-lock | 1.1a, 1.1b |
| BE-2.5c | Locked account returns 423 on login | 1.2a |

**Features:** F-M01-006, F-M01-007, F-M01-008

### Dev 3 — Frontend: Groups + Permissions

| Task | Files | Dependencies |
|------|-------|-------------|
| FE-2.1a | `src/apps/api/public/js/screens/userGroups.js` (S-M01-04) — table, CRUD modals, member list | FE-1.1d–1.1f, FE-1.4e |
| FE-2.2a | `src/apps/api/public/js/screens/permissions.js` (S-M01-05) — matrix with real checkboxes | FE-1.1d–1.1f |

**Features:** F-M01-004, F-M01-005

### Dev 4 — Frontend: Login Log + Orgs + Lock/Unlock

| Task | Files | Dependencies |
|------|-------|-------------|
| FE-2.3a | `src/apps/api/public/js/screens/loginLog.js` (S-M01-06) — filters, pagination | FE-1.1d–1.1f, FE-1.4g |
| FE-2.4a | `src/apps/api/public/js/screens/organizations.js` (S-M01-07) — interactive tree expand/collapse, CRUD modals | FE-1.1d–1.1f, FE-1.4e |
| FE-2.4b | Lock/unlock buttons in user list + confirmation dialog | FE-1.3b, FE-1.4e |
| FE-2.4c | `src/apps/api/public/js/screens/dashboard.js` (S-M01-01) — stat cards from API | FE-1.1d–1.1f |

**Features:** F-M01-006, F-M01-007, F-M01-008

### Wave 2 Exit Criteria

- Groups CRUD works — create/edit/delete with member management ✅
- Permission matrix renders with real checkboxes, save to DB ✅
- Permission middleware enforces feature-level access ✅
- Login log shows paginated, filterable audit trail ✅
- Organization tree is interactive — add/edit/delete/move nodes ✅
- Admin can lock/unlock accounts; auto-lock on 5 failed attempts ✅
- Dashboard displays live stat cards ✅

---

## 5. Wave 3 — P2 Advanced (2FA, Sessions)

### Dev 1 — Backend: TOTP + Sessions + Logout

| Task | Files | Dependencies |
|------|-------|-------------|
| BE-3.1a | `src/apps/api/src/services/totpService.js` — speakeasy + qrcode | 1.1a |
| BE-3.1b | `POST /api/auth/totp/setup/:userId` — generate secret, return QR data URL | 1.1a, 1.1b |
| BE-3.1c | `POST /api/auth/totp/verify` — verify 6-digit code | 1.1a |
| BE-3.1d | `POST /api/auth/totp/disable/:userId` — admin password confirmation | 1.1a, 1.1b |
| BE-3.1e | `POST /api/auth/totp/verify-login` — step 2 in login flow | 1.2a |
| BE-3.2a | Sessions table writes on login, revoke on logout | 1.2a |
| BE-3.2b | Session limit enforcement (max 5, auto-revoke oldest) | 1.1a |
| BE-3.2c | `GET /api/auth/sessions` + `DELETE /api/auth/sessions/:id` | 1.1a |

**Features:** F-M01-009, F-M01-010

### Dev 2 — Frontend: TOTP + Sessions

| Task | Files | Dependencies |
|------|-------|-------------|
| FE-3.1a | `src/apps/api/public/js/screens/totpConfig.js` (S-M01-08) — QR code display, verify/disable | FE-1.1d–1.1f, FE-1.4e |
| FE-3.1b | Extend login screen with TOTP step-2 flow | FE-1.2a |
| FE-3.2a | `src/apps/api/public/js/screens/activeSessions.js` (S-M01-14) — list sessions, revoke button | FE-1.1d–1.1f, FE-1.4e |
| FE-3.2b | Header dropdown — user menu with "Đổi mật khẩu", "Đăng xuất" | FE-1.4h |

**Features:** F-M01-009, F-M01-010

### Wave 3 Exit Criteria

- TOTP setup generates QR code; verify/disble flows work ✅
- Login flow supports TOTP as second step ✅
- Session table tracks active sessions per user ✅
- Max 5 concurrent sessions enforced ✅
- Active sessions screen shows device/IP/last-active with revoke ✅
- Logout endpoint invalidates session ✅

---

## 6. Wave 4 — QA & Code Review (No New Features)

| Task | Responsible | Scope |
|------|-------------|-------|
| QA-1 | QA Engineer | Integration test across all 10 features, 14 screens |
| QA-2 | QA Engineer | Test all ACs from each `_feature.md` |
| QA-3 | Code Reviewer | Security audit: confirm no secrets leaked, adminMiddleware on all routes |
| QA-4 | Code Reviewer | Architecture compliance with lean-architecture.md |
| QA-5 | All devs | Bug fix sprint (3 days buffer) |

---

## 7. Feature ↔ Wave Mapping

| Feature ID | Name | Priority | Wave | BE Dev | FE Dev |
|-----------|------|----------|------|--------|--------|
| F-M01-001 | User Registration | P0 | 1 | Dev 3 | Dev 4 |
| F-M01-002 | User Login | P0 | 1 | Dev 2 | Dev 4 |
| F-M01-003 | Password Management | P0 | 1 | Dev 3 | Dev 4 |
| F-M01-004 | User Group Management | P1 | 2 | Dev 1 | Dev 3 |
| F-M01-005 | Permission Role Management | P1 | 2 | Dev 1 | Dev 3 |
| F-M01-006 | Audit User Logins | P1 | 2 | Dev 2 | Dev 4 |
| F-M01-007 | Organization Management | P1 | 2 | Dev 2 | Dev 4 |
| F-M01-008 | Account Lock/Unlock | P1 | 2 | Dev 2 | Dev 4 |
| F-M01-009 | TOTP Two-Factor Auth | P2 | 3 | Dev 1 | Dev 2 |
| F-M01-010 | Multi-Session Management | P2 | 3 | Dev 1 | Dev 2 |

---

## 8. Key Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| SQLite → PostgreSQL migration (ADR-004) | Medium | Already using ISO 8601 strings via JS rather than SQLite-specific `datetime()`; `boolean` as INTEGER 0/1 needs migration script |
| Permission resolution performance (union of group permissions per request) | Medium | Cache `effective_permissions` in JWT or lightweight in-memory map; only recompute on group membership change |
| Email service stub → SMTP | Low | Console.log stub sufficient for P0–P2; production needs nodemailer + env vars |
| Frontend is vanilla JS (no framework) | Low | Falls within ADR-006; increased manual testing but zero build step |
| Concurrent waves need shared middleware | Low | BE-1.1 produces all shared middleware first; all Wave 2/3 tasks depend on it |

---

## 9. File Structure (Target)

```
src/apps/api/
├── public/                          # Frontend SPA
│   ├── index.html                   #   SPA shell
│   ├── css/
│   │   ├── design-system.css
│   │   └── screens.css
│   ├── js/
│   │   ├── app.js                   #   Hash router
│   │   ├── api.js                   #   HTTP wrappers
│   │   ├── auth.js                  #   JWT storage
│   │   ├── screens/
│   │   │   ├── dashboard.js          #   S-M01-01 (W2)
│   │   │   ├── userList.js           #   S-M01-02 (W1)
│   │   │   ├── userDetail.js         #   S-M01-03 (W1)
│   │   │   ├── userGroups.js         #   S-M01-04 (W2)
│   │   │   ├── permissions.js        #   S-M01-05 (W2)
│   │   │   ├── loginLog.js           #   S-M01-06 (W2)
│   │   │   ├── organizations.js      #   S-M01-07 (W2)
│   │   │   ├── totpConfig.js         #   S-M01-08 (W3)
│   │   │   ├── userRegistration.js   #   S-M01-09 (W1)
│   │   │   ├── passwordManagement.js #   S-M01-10 (W1)
│   │   │   ├── login.js              #   S-M01-11 (W1)
│   │   │   ├── forgotPassword.js     #   S-M01-12 (W1)
│   │   │   ├── resetPassword.js      #   S-M01-13 (W1)
│   │   │   └── activeSessions.js     #   S-M01-14 (W3)
│   │   └── components/
│   │       ├── modal.js
│   │       ├── toast.js
│   │       ├── pagination.js
│   │       └── passwordStrength.js
│   └── assets/
├── src/
│   ├── index.js
│   ├── app.js                       # (extracted from index.js — W1)
│   ├── db.js
│   ├── middleware/
│   │   ├── authMiddleware.js        # (W1)
│   │   ├── adminMiddleware.js       # (W1)
│   │   └── permissionMiddleware.js  # (W2)
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── groups.js                # (W2)
│   │   ├── organizations.js         # (W2)
│   │   └── permissions.js           # (W2)
│   ├── services/
│   │   ├── rateLimiter.js           # (W1)
│   │   ├── passwordService.js       # (W1)
│   │   ├── totpService.js           # (W3)
│   │   └── emailService.js          # (W1 stub, W3 SMTP)
│   └── utils/
│       ├── jwt.js                   # (W1)
│       └── validation.js            # (W1)
└── data/
    └── database.sqlite
```

---

## 10. Plan Execution Notes

1. **Wave 1 must finish before Wave 2 starts** — shared auth middleware is needed by all Wave 2 endpoints.
2. **Waves 2 and 3 can overlap** if Dev 1 (backend) finishes BE-2.1/BE-2.2 early — but Wave 3 TOTP depends on auth middleware from Wave 1, not on Wave 2 features.
3. **Frontend devs start in Wave 1** (not Wave 2) because auth + user CRUD + password management are the UI foundation.
4. **Each wave includes a 0.5-day buffer** for integration testing between BE and FE at the end of the wave.
5. **After Wave 3**, a full regression test across all 10 features + 14 screens is mandatory before marking M01 as complete.
