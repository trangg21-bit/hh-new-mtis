# M01 — User Management: Lean Architecture Document

## 1. System Context

M01 User Management is the **foundation module** of the MTIS system. It provides authentication, authorization, user lifecycle management, and organizational structure for all other modules (M02–M11).

**Dependencies:** None — M01 depends on no other module.

**Services to other modules:**
- JWT-based `authMiddleware()` for all `/api/*` routes (shared Express middleware)
- `req.user` object populated on every authenticated request (userId, username, role, orgUnit, permissions)
- `GET /api/permissions/check?feature=XXX&action=read` — permission lookup endpoint consumable by any module's frontend
- Session limit enforcement (max 5 concurrent sessions per user)

**Scope boundary:** M01 manages *who* can access the system, *what* they can do, and *where* they belong organizationally. It does *not* manage domain-specific business logic or data.

---

## 2. Architecture Decisions (ADR)

### ADR-001: Stateless JWT Authentication

| Property | Value |
|----------|-------|
| **Context** | Need auth mechanism that works across M01–M11 without shared session store |
| **Decision** | JWT is stateless — no DB lookup on every request. `sessions` table exists only for session management UI (listing/revoking), not for auth validation. JWT secret: `mtis-dev-secret-key-2026` (P0), replace with env var `JWT_SECRET` in production. Expiry: `8h`. |
| **Consequence** | + No Redis/session store needed. + Fast auth (no DB call). − Cannot invalidate individual tokens server-side (revoke is soft — mark session revoked in DB, check on every request if strict enforcement is needed). |
| **JWT Payload** | `{ sub: user.id, username: user.username, role: user.role, org_unit: user.org_unit, jti: uuid }` |

### ADR-002: Group → Permission Inheritance

| Property | Value |
|----------|-------|
| **Context** | Users need granular feature-level permissions; flat role field is insufficient |
| **Decision** | Users inherit permissions through group membership: **User → Groups → GroupPermissions**. A user can belong to multiple groups; the effective permission set is the **union** of all group permissions. The system-admin role (`Quản trị hệ thống`) bypasses the permission check entirely (FULL_ACCESS). |
| **Consequence** | + Flexible permission model. + Groups are manageable independently from users. − Need to resolve permission union at login or cache in `req.user`. |
| **Implementation** | On login, compute `effective_permissions` and attach to JWT or cache in a lightweight in-memory map keyed by `userId`. |

### ADR-003: express-rate-limit Middleware

| Property | Value |
|----------|-------|
| **Context** | Need to rate-limit login attempts (5/15min) and forgot-password (3/15min per email). No Redis infrastructure available. |
| **Decision** | Use `express-rate-limit` middleware on auth endpoints. Login gets `authLimiter` (5 req/15min/window); forgot-password re-uses the same limiter plus a per-email DB check (max 3 tokens per 15 min in `reset_tokens` table). |
| **Consequence** | + Zero infrastructure. + Standard, well-tested middleware. − Rate limit state lost on server restart (acceptable for single-process dev). Production: replace with Redis-backed `rate-limit-store`. |

### ADR-004: SQLite → PostgreSQL Migration Path

| Property | Value |
|----------|-------|
| **Context** | Dev uses SQLite (better-sqlite3); production requires PostgreSQL. |
| **Decision** | Write all queries using standard SQL (avoid SQLite-specific syntax like `datetime('now','localtime')` → use ISO 8601 strings via `new Date().toISOString()` in JS). Use a `db.js` abstraction layer so the import path is the only change when swapping to `pg`. |
| **Consequence** | + Dev simplicity (zero setup). + Clear migration path. − Timestamp differences (SQLite TEXT vs PG TIMESTAMPTZ). − Boolean semantics differ (INTEGER 0/1 in SQLite vs BOOLEAN in PG). |
| **Migration strategy** | Use `knex` or `node-pg-migrate` when moving to PG; export SQLite data as JSON, import to PG. |

### ADR-005: TOTP via otplib + qrcode

| Property | Value |
|----------|-------|
| **Context** | F-M01-009 requires TOTP 2FA with QR code display. |
| **Decision** | Use `otplib` (specifically `authenticator` singleton) for TOTP secret generation, key URI formatting, and code verification. Use `qrcode` (npm) to render QR as base64 data URL (no external API call). Store secret in `users.totp_secret` as plaintext (acceptable for dev; production should encrypt at rest). |
| **Consequence** | + No external dependency for QR generation. + Well-audited libraries. − `totp_secret` in plaintext in SQLite DB — acceptable for P2; production should encrypt with `crypto.createCipheriv`. |

### ADR-006: Vanilla JS SPA with Hash Routing

| Property | Value |
|----------|-------|
| **Context** | Frontend must be a single HTML+CSS+JS application with no build step. |
| **Decision** | Use hash-based routing (`window.location.hash`) to show/hide screen sections. One `public/index.html` file loads all screens as hidden `<div>` containers. JS router listens to `hashchange` event. No bundler, no framework, no npm frontend dependencies. |
| **Consequence** | + Zero build step. + Deploy by copying files. − Manual state management. − No component reusability. − Developer overhead for complex UIs. |
| **Routing table** | `#login`, `#dashboard`, `#users`, `#user-detail/:id`, `#groups`, `#permissions`, `#login-log`, `#organizations`, `#totp`, `#password`, `#sessions`, `#forgot-password`, `#reset-password/:token` |

### ADR-007: Email Stubbed (console.log) in P0

| Property | Value |
|----------|-------|
| **Context** | F-M01-003 requires "send password reset email" functionality. No SMTP server configured. |
| **Decision** | In P0, email sending is stubbed: `console.log(\`[EMAIL] To: ${email} Subject: Password Reset Token: ${token}\`)`. The reset token is stored in a new `reset_tokens` table (or in-memory map for P0) with 15-minute expiry. Production: integrate nodemailer with SMTP config from env vars. |
| **Consequence** | + Unblocks frontend dev for forgot/reset password flow. − No actual email delivery. − Token must be shared manually during testing. |

---

## 3. Route Table

All routes prefixed with `/api`. Authenticated routes require `Authorization: Bearer <JWT>` header.

### Authentication & Profile (F-M01-002, F-M01-003, F-M01-006, F-M01-009, F-M01-010)

| Method | Path | Auth | Admin Only | Rate Limited | Feature | Description |
|--------|------|------|------------|--------------|---------|-------------|
| POST | `/api/auth/login` | Public | No | Yes (5/15min) | F-M01-002 | Login — returns JWT + user info |
| GET | `/api/auth/me` | JWT | No | No | F-M01-002 | Current user profile + permissions |
| GET | `/api/auth/login-log` | JWT | No\* | No | F-M01-006 | \*Admin=all users, regular user=own only |
| PUT | `/api/auth/change-password` | JWT | No | No | F-M01-003 | Change own password (requires old password) |
| POST | `/api/auth/forgot-password` | Public | No | Yes (3/15min) | F-M01-003 | Request reset token (stubbed email) |
| POST | `/api/auth/reset-password` | Public | No | No | F-M01-003 | Reset password with token |
| POST | `/api/auth/logout` | JWT | No | No | F-M01-010 | Invalidate current session (clear JWT from sessions table) |
| POST | `/api/auth/totp/setup` | JWT | No¹ | No | F-M01-009 | Generate TOTP secret + return QR data URL. Body: `{ userId }` — ¹Admin can set up for any user; user can set up for self |
| POST | `/api/auth/totp/verify` | JWT | No¹ | No | F-M01-009 | Verify 6-digit TOTP code to enable. Body: `{ userId, code }` — ¹Same self/admin rule |
| POST | `/api/auth/totp/disable` | JWT | Yes | No | F-M01-009 | Disable TOTP (requires admin password confirmation). Body: `{ userId, password }` |
| POST | `/api/auth/totp/verify-login` | Public | No | Yes (5/15min) | F-M01-009 | Verify TOTP during login flow (step 2) |
| GET | `/api/auth/sessions` | JWT | No\* | No | F-M01-010 | \*Admin=all sessions, user=own only |
| DELETE | `/api/auth/sessions/:id` | JWT | No\* | No | F-M01-010 | \*Admin=any session, user=own only (cannot delete current) |

### User Management (F-M01-001, F-M01-008)

| Method | Path | Auth | Admin Only | Feature | Description |
|--------|------|------|------------|---------|-------------|
| GET | `/api/users` | JWT | Yes | F-M01-001 | List users (paginated: `?page=1&limit=20&search=&status=&role=`) |
| GET | `/api/users/:id` | JWT | Yes | F-M01-001 | Get user detail (includes groups, org path) |
| POST | `/api/users` | JWT | Yes | F-M01-001 | Create user (validates password strength) |
| PUT | `/api/users/:id` | JWT | Yes | F-M01-001, F-M01-008 | Update user (safe fields: full_name, email, phone, org_unit, status) |
| DELETE | `/api/users/:id` | JWT | Yes | F-M01-008 | Soft delete (set status=0). Cannot self-delete |
| PUT | `/api/users/:id/lock` | JWT | Yes | F-M01-008 | Lock account (status=2). Cannot self-lock |
| PUT | `/api/users/:id/unlock` | JWT | Yes | F-M01-008 | Unlock account (status=1) — allowed via `writeGuard` exception |

### User Groups (F-M01-004)

| Method | Path | Auth | Admin Only | Feature | Description |
|--------|------|------|------------|---------|-------------|
| GET | `/api/users/groups/list` | JWT | No | F-M01-004 | List all groups (with member count) |
| POST | `/api/users/groups` | JWT | Yes | F-M01-004 | Create group |
| PUT | `/api/users/groups/:id` | JWT | Yes | F-M01-004 | Update group (name, description) |
| DELETE | `/api/users/groups/:id` | JWT | Yes | F-M01-004 | Delete group (fails if has members) |
| GET | `/api/users/groups/:id/members` | JWT | No | F-M01-004 | List group members (user info + role) |
| POST | `/api/users/groups/:id/members` | JWT | Yes | F-M01-004 | Add member to group. Body: `{ user_id }` |
| DELETE | `/api/users/groups/:id/members/:userId` | JWT | Yes | F-M01-004 | Remove member from group |

### Permissions (F-M01-005)

| Method | Path | Auth | Admin Only | Feature | Description |
|--------|------|------|------------|---------|-------------|
| GET | `/api/permissions` | JWT | No | F-M01-005 | Get full permission matrix (groups × features) |
| PUT | `/api/permissions` | JWT | Yes | F-M01-005 | Save updated permission matrix |
| GET | `/api/permissions/check` | JWT | No | F-M01-005 | Check user permission: `?feature=XXX&action=read` — returns `{ allowed: true/false }` |

### Organizations (F-M01-007)

| Method | Path | Auth | Admin Only | Feature | Description |
|--------|------|------|------------|---------|-------------|
| GET | `/api/organizations` | JWT | No | F-M01-007 | List org tree (flat with `parent_id`, frontend builds tree) |
| POST | `/api/organizations` | JWT | Yes | F-M01-007 | Create org node |
| PUT | `/api/organizations/:id` | JWT | Yes | F-M01-007 | Update org node |
| DELETE | `/api/organizations/:id` | JWT | Yes | F-M01-007 | Delete leaf org (fails if has children or users) |
| PUT | `/api/organizations/:id/move` | JWT | Yes | F-M01-007 | Move org to new parent: `{ parent_id: newParentId }` |

---

## 4. Data Model

### 4.1 `users` (Existing — extended)

```sql
CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    username    TEXT    UNIQUE NOT NULL,
    password    TEXT    NOT NULL,
    full_name   TEXT    NOT NULL,
    email       TEXT,
    phone       TEXT,
    org_unit    TEXT    DEFAULT 'Cảng vụ Hàng hải Hải Phòng',
    role        TEXT    DEFAULT 'Chuyên viên',
    status      INTEGER DEFAULT 1,
    totp_secret TEXT,                              -- NEW: TOTP secret key (nullable)
    totp_enabled INTEGER DEFAULT 0,                -- NEW: 0=disabled, 1=enabled
    org_id      INTEGER REFERENCES organizations(id), -- NEW: FK to org tree (nullable)
    created_at  TEXT    DEFAULT (datetime('now','localtime')),
    updated_at  TEXT    DEFAULT (datetime('now','localtime'))
);
```

**Status values:** `0`=deleted (soft), `1`=active, `2`=locked

**Index:**
```sql
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_org_id ON users(org_id);
```

### 4.2 `user_groups` (Existing — unchanged)

```sql
CREATE TABLE IF NOT EXISTS user_groups (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    UNIQUE NOT NULL,
    description TEXT,
    created_at  TEXT    DEFAULT (datetime('now','localtime'))
);
```

### 4.3 `group_members` (Existing — unchanged)

```sql
CREATE TABLE IF NOT EXISTS group_members (
    user_id  INTEGER NOT NULL REFERENCES users(id)       ON DELETE CASCADE,
    group_id INTEGER NOT NULL REFERENCES user_groups(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, group_id)
);
```

### 4.4 `login_log` (Existing — unchanged)

```sql
CREATE TABLE IF NOT EXISTS login_log (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    username  TEXT    NOT NULL,
    ip        TEXT,
    device    TEXT,
    status    TEXT    DEFAULT 'success',
    logged_at TEXT    DEFAULT (datetime('now','localtime'))
);
```

**Index:**
```sql
CREATE INDEX idx_login_log_username ON login_log(username);
CREATE INDEX idx_login_log_logged_at ON login_log(logged_at);
CREATE INDEX idx_login_log_status ON login_log(status);
```

### 4.5 `group_permissions` (NEW)

```sql
CREATE TABLE IF NOT EXISTS group_permissions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id    INTEGER NOT NULL REFERENCES user_groups(id) ON DELETE CASCADE,
    feature_code TEXT   NOT NULL,
    can_create  INTEGER DEFAULT 0,
    can_read    INTEGER DEFAULT 0,
    can_update  INTEGER DEFAULT 0,
    can_delete  INTEGER DEFAULT 0,
    updated_at  TEXT    DEFAULT (datetime('now','localtime')),
    UNIQUE(group_id, feature_code)
);
```

**Feature codes (M01 scope):** `user`, `group`, `permission`, `org`, `login_log`, `totp`, `session`

### 4.6 `organizations` (NEW)

```sql
CREATE TABLE IF NOT EXISTS organizations (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    description TEXT,
    parent_id   INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
    sort_order  INTEGER DEFAULT 0,
    created_at  TEXT    DEFAULT (datetime('now','localtime')),
    updated_at  TEXT    DEFAULT (datetime('now','localtime'))
);
```

**Index:**
```sql
CREATE INDEX idx_organizations_parent_id ON organizations(parent_id);
```

### 4.7 `password_history` (NEW)

```sql
CREATE TABLE IF NOT EXISTS password_history (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    password_hash TEXT    NOT NULL,
    created_at    TEXT    DEFAULT (datetime('now','localtime'))
);
```

**Index:**
```sql
CREATE INDEX idx_password_history_user_id ON password_history(user_id);
```

### 4.8 `sessions` (NEW)

```sql
CREATE TABLE IF NOT EXISTS sessions (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_jti     TEXT    NOT NULL UNIQUE,
    device        TEXT,
    ip            TEXT,
    last_active_at TEXT   DEFAULT (datetime('now','localtime')),
    created_at    TEXT    DEFAULT (datetime('now','localtime')),
    expires_at    TEXT    NOT NULL
);
```

**Index:**
```sql
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token_jti ON sessions(token_jti);
```

### 4.9 `reset_tokens` (NEW — for forgot password)

```sql
CREATE TABLE IF NOT EXISTS reset_tokens (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token      TEXT    NOT NULL UNIQUE,
    expires_at TEXT    NOT NULL,
    used       INTEGER DEFAULT 0,
    created_at TEXT    DEFAULT (datetime('now','localtime'))
);
```

**Index:**
```sql
CREATE INDEX idx_reset_tokens_token ON reset_tokens(token);
CREATE INDEX idx_reset_tokens_user_id ON reset_tokens(user_id);
```

---

## 5. Permission Model

### 5.1 Permission Scopes for M01 Features

| Feature Code | Description | CRUD Actions |
|-------------|-------------|--------------|
| `user` | User management | create, read, update, delete |
| `group` | Group management | create, read, update, delete |
| `permission` | Permission matrix | read, write |
| `org` | Organization management | create, read, update, delete |
| `login_log` | Login audit log | read (own), read-all |
| `totp` | TOTP two-factor auth | manage |
| `session` | Session management | read (own), read-all, revoke (own), revoke-all |

### 5.2 Role → Permission Mapping (built-in, not stored in group_permissions)

| Role | Scope Identifier | Effective Permissions (M01) |
|------|-----------------|-----------------------------|
| `Quản trị hệ thống` | `system-admin` | **FULL_ACCESS** — bypasses all permission checks |
| `Lãnh đạo Cục` | `director` | login_log:read (own), user:read (own profile) |
| `Lãnh đạo Cảng vụ` | `port-authority-leader` | login_log:read (own), user:read (own profile) |
| `Chuyên viên` (all types) | `infrastructure-officer`, `asset-officer`, etc. | login_log:read (own) |

**Enforcement:**
1. If `req.user.role === 'system-admin'` → grant all, skip further checks.
2. Otherwise, load user's groups via `group_members` → aggregate `group_permissions` → check requested `feature_code + action` via `GET /api/permissions/check?feature=XXX&action=YYY`.

### 5.3 Permission Check Flow

```
User requests PUT /api/users/:id
  → authMiddleware() validates JWT → populates req.user
  → writeGuard middleware checks if req.method in ['POST','PUT','DELETE']
     → YES: adminMiddleware() checks req.user.role === 'system-admin'
        → YES: proceed
        → NO: 403 Từ chối quyền truy cập

Frontend permission check (for UI visibility):
  → GET /api/permissions/check?feature=user&action=update
     → system-admin bypass → { allowed: true, reason: 'admin' }
     → Non-admin → SELECT via group_members + group_permissions
        → If any matching row has can_update=1 → { allowed: true }
        → Else → { allowed: false, reason: 'permission_denied' }
```

### 5.4 Predefined Permission Matrix (Seed Data)

**M01 Feature Codes:** `user`, `group`, `permission`, `org`, `login_log`, `totp`, `session`

| Group (ID) | user | group | permission | org | login_log | totp | session |
|------------|------|-------|------------|-----|-----------|------|---------|
| Quản trị hệ thống (1) | 1111 | 1111 | 11 | 1111 | read-all | manage | read-all, revoke-all |
| Chuyên viên KCHT (2) | 0000 | 0000 | 00 | 0000 | 0000 | 0 | 0000 |
| Lãnh đạo (3) | 0000 | 0000 | 00 | 0000 | read-own | 0 | 0000 |

*(CRUD format: can_create, can_read, can_update, can_delete as 0/1. For login_log: read-all=can_read on 'login_log', read-own via code-level filtering. For permission: 11 = can_read + can_update.)*

---

## 6. Integration Points

### 6.1 Shared Middleware (Inlined in `index.js` + `auth.js`)

**`authMiddleware` (in `index.js` and `auth.js`)**
```js
// Decodes JWT from Authorization header (strip 'Bearer ')
// Attaches req.user = { id, username, role, jti }
// Returns 401 if token missing/invalid/expired
```

**`adminMiddleware` (in `index.js`)**
```js
// Checks req.user.role === 'system-admin'
// Returns 403: 'Từ chối quyền truy cập: chỉ Quản trị hệ thống'
```

**`writeGuard` (in `index.js` — per-route inline)**
```js
// Applied to /api/users, /api/users/groups, /api/permissions, /api/organizations
// If req.method in ['POST', 'PUT', 'DELETE'] → calls adminMiddleware
// Unlock is exempted to allow non-admin unlock via separate path
```

### 6.2 Exposed Endpoints for Other Modules

| Endpoint | Consumer | Purpose |
|----------|----------|---------|
| `GET /api/permissions/check?feature=XXX&action=read` | Any module frontend | Check if current user has permission on a feature |
| `GET /api/auth/me` | Any module frontend | Get current user info + effective permissions |
| `GET /api/organizations` | Any module | Org tree for org-scoped data filtering |
| `GET /api/users?page=1&limit=999&status=1` | Other modules | User list for assignment (dropdowns, etc.) |

### 6.3 `req.user` Contract

Every authenticated route across all modules receives (from JWT decode):

```js
req.user = {
  id: 1,              // users.id
  username: 'admin',
  role: 'system-admin', // slug — not Vietnamese display name
  jti: 'uuid-v4'      // JWT token ID for session tracking
}
```

**Note:** `permissions` are NOT embedded in the JWT payload. To check permissions, call `GET /api/permissions/check?feature=XXX&action=YYY` or query `group_permissions` via the backend. The TOTP flow adds `totp_pending: true` to the temp token JWT payload.

---

## 7. Security Requirements

| # | Requirement | Implementation | BR Reference |
|---|-------------|---------------|--------------|
| SEC-01 | **Password hashing** | bcrypt with salt rounds = 10 | BR-M01-003 |
| SEC-02 | **Password strength** | Min 8 chars, uppercase, lowercase, digit, special char. Regex: `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$` | BR-M01-002 |
| SEC-03 | **Password history** | Cannot reuse last 3 passwords (check against `password_history` table) | BR-M01-014 |
| SEC-04 | **Rate limiting** | express-rate-limit middleware on login + forgot-password: 5 requests per 15-minute window. Return 429 after exceeded. | BR-M01-004 |
| SEC-05 | **Account auto-lock** | Count failed logins in `login_log` within last 15 min; after 5, set `users.status = 2`. | BR-M01-005 |
| SEC-06 | **Account lock check** | On login, reject if `status = 2` (locked) or `status = 0` (deleted). Return 423 for locked. | BR-M01-018 |
| SEC-07 | **JWT expiry** | Token expires after 8 hours (`expiresIn: '8h'`). | BR-M01-006 |
| SEC-08 | **Admin middleware** | `adminMiddleware` checks `req.user.role === 'Quản trị hệ thống'`. All user CRUD endpoints protected. | BR-M01-009 |
| SEC-09 | **Cannot self-lock** | Admin cannot set `status = 2` where `targetUserId === req.user.id`. Return 400. | BR-M01-012 |
| SEC-10 | **Cannot self-delete** | Admin cannot soft-delete own account. | BR-M01-008, BR-M01-012 |
| SEC-11 | **TOTP secret protection** | `totp_secret` stored in DB (plaintext for P2; production encrypt at rest with `crypto.createCipheriv`). Never logged or returned in API responses. | BR-M01-016 |
| SEC-12 | **Input validation** | All endpoints validate required fields, data types, and formats. Express middleware or Joi-based validation on all POST/PUT bodies. | — |
| SEC-13 | **SQL injection safe** | ensured by better-sqlite3 parameterized queries (`?` placeholders). | — |
| SEC-14 | **Session limit** | Max 5 concurrent sessions per user. Oldest session revoked when creating a 6th. | BR-M01-017 |
| SEC-15 | **Audit logging** | Every login attempt (success/failure) recorded in `login_log`. | BR-M01-007 |
| SEC-16 | **Forgot password token expiry** | Reset token expires after 15 minutes. Single-use (mark `used = 1` after reset). | BR-M01-003 |
| SEC-17 | **Change password requires old password** | Verify old password with `bcrypt.compareSync` before allowing change. | BR-M01-013 |
| SEC-18 | **Rate limit on forgot-password** | Max 3 forgot-password requests per email per 15 minutes. | — |
| SEC-19 | **CORS** | Restrict to same origin in production. Dev: allow `*`. | — |
| SEC-20 | **Remove X-Powered-By** | Express header: `app.disable('x-powered-by')`. | — |

---

## 8. Implementation Priority & Phasing

### Wave 1 — P0 (Foundation) — "Login, Register, Auth"

| Task | Backend | Frontend | Dependencies |
|------|---------|----------|-------------|
| 1.1 | Auth middleware (`authMiddleware.js`, `adminMiddleware.js`) | — | None |
| 1.2 | Login API (POST `/api/auth/login`, GET `/api/auth/me`) + rate limiting (in-memory Map) + login_log insert | S-M01-11 Login screen | 1.1 |
| 1.3 | User registration (POST `/api/users`) with admin-only check + password strength validation | S-M01-02 User list + S-M01-09 Registration form | 1.1 |
| 1.4 | Change password (PUT `/api/auth/change-password`) | S-M01-10 Password management | 1.1 |
| 1.5 | Forgot/reset password (POST `/api/auth/forgot-password`, POST `/api/auth/reset-password`) + `reset_tokens` table | S-M01-12, S-M01-13 screens | 1.1 |
| 1.6 | Soft delete user (DELETE `/api/users/:id`, set status=0) | S-M01-02 delete action | 1.1 |
| 1.7 | Hash-based SPA router in frontend | Core app shell | None |
| 1.8 | Password history table + no-reuse-last-3 check | — | 1.4 |

### Wave 2 — P1 (Authorization & Structure) — "Groups, Permissions, Orgs, Lock"

| Task | Backend | Frontend | Dependencies |
|------|---------|----------|-------------|
| 2.1 | Group CRUD (all `/api/users/groups/*` endpoints) + `group_members` management | S-M01-04 User groups screen | 1.1 |
| 2.2 | `group_permissions` table + GET/PUT `/api/permissions` + permission check middleware | S-M01-05 Permission matrix | 2.1 |
| 2.3 | Login log API (GET `/api/auth/login-log` with pagination + filters) | S-M01-06 Login log screen | 1.2 |
| 2.4 | Organization CRUD (all `/api/organizations/*` endpoints) + tree move | S-M01-07 Org tree screen | 1.1 |
| 2.5 | Account lock/unlock (PUT `/api/users/:id` status=2 → locked) + auto-lock on 5 failed attempts | S-M01-02 lock/unlock buttons | 1.2 |
| 2.6 | Dashboard stats API (GET `/api/admin/stats`) | S-M01-01 Dashboard stat cards | 1.3 |
| 2.7 | Permission middleware integration into all admin routes | — | 2.2 |

### Wave 3 — P2 (Advanced) — "2FA, Sessions"

| Task | Backend | Frontend | Dependencies |
|------|---------|----------|-------------|
| 3.1 | TOTP setup, verify, disable endpoints (`speakeasy` + `qrcode`) | S-M01-08 TOTP config screen | 1.1 |
| 3.2 | TOTP login flow (step 2 after password) | S-M01-11 Login (extended) | 3.1 |
| 3.3 | Sessions table + session limit enforcement (max 5, auto-revoke oldest) | S-M01-14 Active sessions screen | 1.1 |
| 3.4 | Logout endpoint (POST `/api/auth/logout` — remove session row) | Header dropdown logout | 3.3 |
| 3.5 | Email stub → real SMTP integration (nodemailer) | — | 1.5 |

### Wave Dependency Graph

```
Wave 1 (P0) ──────────────────────────────────┐
  ├── 1.1 Auth middleware (blocking)           │
  ├── 1.2 Login + rate limit (blocking)        │
  ├── 1.3 User CRUD (blocking)                 │
  └── 1.4–1.8 Password mgmt (blocking)         │
                                               ▼
Wave 2 (P1) ──────────────────────────────┐
  ├── 2.1 Groups (depends: 1.1)            │
  ├── 2.2 Permissions (depends: 2.1)       │
  ├── 2.3 Login log (depends: 1.2)         │
  ├── 2.4 Orgs (depends: 1.1)              │
  ├── 2.5 Lock/unlock (depends: 1.2)       │
  ├── 2.6 Dashboard (depends: 1.3)         │
  └── 2.7 Permission integration           │
                                           ▼
Wave 3 (P2) ──────────────────────────┐
  ├── 3.1 TOTP (depends: 1.1)         │
  ├── 3.2 TOTP login (depends: 3.1)   │
  ├── 3.3 Sessions (depends: 1.1)     │
  ├── 3.4 Logout (depends: 3.3)       │
  └── 3.5 SMTP (depends: 1.5)         │
```

---

## Appendix A: File Structure (backend — actual)

```
src/apps/api/src/
├── index.js                        # Express app setup, middleware (authMiddleware,
│                                   #   adminMiddleware, writeGuard), route mounting,
│                                   #   static files + SPA fallback
├── db.js                           # SQLite connection (better-sqlite3), schema init
│                                   #   (8 tables), seed data, column migrations
├── routes/
│   ├── auth.js                     # login, me, logout, change-password,
│   │                               #   forgot/reset-password, TOTP (setup/verify/disable/
│   │                               #   verify-login), login-log, sessions (list/revoke)
│   ├── users.js                    # CRUD users, group list/create, lock/unlock
│   └── groups.js                   # Group update/delete, member add/remove
├── routes/
│   ├── organizations.js            # CRUD org tree + move endpoint
│   └── permissions.js              # Permission matrix GET/PUT, permission check
└── public/                         # Static SPA frontend (index.html, css/, js/)
```

## Appendix B: File Structure (frontend)

```
public/
├── index.html                       # SPA shell with hash router
├── css/
│   ├── design-system.css            # CSS vars, typography, layout
│   └── screens.css                  # Per-screen styles
├── js/
│   ├── app.js                       # SPA router + global state
│   ├── api.js                       # apiGet, apiPost, apiPut, apiDelete wrappers
│   ├── auth.js                      # Login, logout, JWT storage
│   ├── screens/
│   │   ├── dashboard.js             # S-M01-01
│   │   ├── userList.js              # S-M01-02
│   │   ├── userDetail.js            # S-M01-03
│   │   ├── userGroups.js            # S-M01-04
│   │   ├── permissions.js           # S-M01-05
│   │   ├── loginLog.js              # S-M01-06
│   │   ├── organizations.js         # S-M01-07
│   │   ├── totpConfig.js            # S-M01-08
│   │   ├── userRegistration.js      # S-M01-09
│   │   ├── passwordManagement.js    # S-M01-10
│   │   ├── login.js                 # S-M01-11
│   │   ├── forgotPassword.js        # S-M01-12
│   │   ├── resetPassword.js         # S-M01-13
│   │   └── activeSessions.js        # S-M01-14
│   └── components/
│       ├── modal.js                 # Reusable modal/dialog
│       ├── toast.js                 # Toast notifications
│       ├── pagination.js            # Pagination controls
│       └── passwordStrength.js      # Password strength meter
└── assets/                          # Logo, icons
```
