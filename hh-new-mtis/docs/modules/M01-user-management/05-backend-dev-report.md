# M01 — Backend Development Report

## Verdict: ✅ Implemented (All Waves Complete)

## Architecture
- **Runtime**: Node.js 22, Express 4.21, SQLite via better-sqlite3 11
- **Pattern**: Monolithic Express + 6 route modules + 4 service modules + 3 middleware modules
- **Auth**: JWT (jsonwebtoken 9.0), bcrypt (bcryptjs 2.4), TOTP (otplib)

## Files Implemented

| File | Lines | Purpose |
|------|-------|---------|
| `src/index.js` | 128 | Server entry, auth middleware, admin middleware, static serve, SPA fallback |
| `src/app.js` | 62 | App factory, Helmet, CORS, JSON, rate limiting |
| `src/db.js` | 180 | SQLite schema (8 tables, 13 indexes), seed data, migrations |
| `src/routes/auth.js` | 593 | Login, logout, me, change-password, forgot-password, reset-password, login-log, TOTP setup/verify/verify-login/disable, sessions CRUD |
| `src/routes/users.js` | 131 | User CRUD (list, get, create, update, soft-delete), lock/unlock |
| `src/routes/groups.js` | 98 | Group CRUD, member add/remove, permission grant/revoke |
| `src/routes/permissions.js` | 82 | Permission list, check, bulk update |
| `src/routes/organizations.js` | 104 | Org CRUD with tree hierarchy |
| `src/middleware/authMiddleware.js` | 22 | JWT verification, req.user population |
| `src/middleware/adminMiddleware.js` | 10 | System-admin role check |
| `src/middleware/permissionMiddleware.js` | 28 | Feature-action permission check |
| `src/services/passwordService.js` | 45 | Password strength, history, auto-lock |
| `src/services/totpService.js` | 38 | TOTP secret gen, QR code, verification |
| `src/services/rateLimiter.js` | 15 | Server-side rate limit for auth routes |
| `src/services/emailService.js` | 12 | Stubbed email (console.log for dev) |
| `src/utils/jwt.js` | 18 | Token generation, verification helpers |
| `src/utils/validation.js` | 35 | Input validation (email, username, role, status) |

## DB Schema (8 tables)
`users`, `user_groups`, `group_members`, `group_permissions`, `organizations`, `sessions`, `login_log`, `password_history`, `reset_tokens`

## API Endpoints (31 total)
| Method | Path | Feature | Auth |
|--------|------|---------|------|
| POST | /api/auth/login | F-M01-002 | Public |
| GET | /api/auth/me | F-M01-002 | JWT |
| POST | /api/auth/logout | F-M01-010 | JWT |
| PUT | /api/auth/change-password | F-M01-003 | JWT |
| POST | /api/auth/forgot-password | F-M01-003 | Public (rate limited) |
| POST | /api/auth/reset-password | F-M01-003 | Public (token-based) |
| GET | /api/auth/login-log | F-M01-006 | JWT |
| POST | /api/auth/totp/setup | F-M01-009 | JWT (self or admin) |
| POST | /api/auth/totp/verify | F-M01-009 | JWT (self or admin) |
| POST | /api/auth/totp/verify-login | F-M01-009 | Public (temp_token) |
| POST | /api/auth/totp/disable | F-M01-009 | JWT (admin only) |
| GET | /api/auth/sessions | F-M01-010 | JWT |
| DELETE | /api/auth/sessions/:id | F-M01-010 | JWT |
| GET | /api/users | F-M01-001 | JWT |
| GET | /api/users/:id | F-M01-001 | JWT |
| POST | /api/users | F-M01-001 | JWT (admin) |
| PUT | /api/users/:id | F-M01-001 | JWT (admin) |
| DELETE | /api/users/:id | F-M01-001 | JWT (admin) |
| PUT | /api/users/:id/lock | F-M01-008 | JWT (admin) |
| PUT | /api/users/:id/unlock | F-M01-008 | JWT (admin) |
| GET | /api/users/groups | F-M01-004 | JWT |
| POST | /api/users/groups | F-M01-004 | JWT (admin) |
| PUT | /api/users/groups/:id | F-M01-004 | JWT (admin) |
| DELETE | /api/users/groups/:id | F-M01-004 | JWT (admin) |
| POST | /api/users/groups/:id/members | F-M01-004 | JWT (admin) |
| DELETE | /api/users/groups/:id/members/:userId | F-M01-004 | JWT (admin) |
| GET | /api/permissions | F-M01-005 | JWT |
| PUT | /api/permissions | F-M01-005 | JWT (admin) |
| GET | /api/organizations | F-M01-007 | JWT |
| POST | /api/organizations | F-M01-007 | JWT (admin) |
| PUT | /api/organizations/:id | F-M01-007 | JWT (admin) |

## Task Status vs Tech Lead Plan

| Task ID | Description | Status |
|---------|------------|--------|
| BE-1.1 | Auth middleware + admin middleware | ✅ Done |
| BE-1.2 | Auth APIs (login, me, logout) | ✅ Done |
| BE-1.3 | User CRUD + password APIs | ✅ Done |
| BE-2.1 | Groups + permissions infrastructure | ✅ Done |
| BE-2.2 | Organizations + login log + lock | ✅ Done |
| BE-3.1 | TOTP + sessions + logout | ✅ Done |
| BE-3.2 | Rate limiting + security hardening | ✅ Done |

## Deviations from Plan
- Inlined `authMiddleware` and `adminMiddleware` into `index.js` instead of separate files → later refactored to separate files by PM dispatch
- Added `src/services/` layer for testability (passwordService, totpService, rateLimiter, emailService)
- TOTP uses `otplib` instead of originally specified `speakeasy` based on SA ADR-005 decision
