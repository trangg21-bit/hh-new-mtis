# M01 — User Management (Quản lý người dùng)

## Business Goal
Module quản lý tài khoản người dùng, phân quyền truy cập, xác thực và bảo mật cho toàn bộ hệ thống MTIS. Đây là module nền tảng, không phụ thuộc module nào khác.

## Actor Map
| Actor | Features |
|-------|----------|
| Quản trị hệ thống (system-admin) | F-M01-001, F-M01-002, F-M01-003, F-M01-004, F-M01-005, F-M01-006, F-M01-007, F-M01-008, F-M01-009, F-M01-010 |
| Lãnh đạo Cục (director) | F-M01-002, F-M01-006 |
| Lãnh đạo Cảng vụ (port-authority-leader) | F-M01-002, F-M01-006 |
| Chuyên viên (infrastructure-officer) | F-M01-002, F-M01-003 |
| Tất cả người dùng nội bộ | F-M01-002, F-M01-003 |

## Feature Overview
| ID | Name | Priority | Type | Existing API | UI Screen |
|----|------|----------|------|-------------|-----------|
| F-M01-001 | User Registration | P0 | Workflow | POST /api/users (partial) | Registration form |
| F-M01-002 | User Login | P0 | CRUD | POST /api/auth/login, GET /api/auth/me | Login form |
| F-M01-003 | Password Management | P0 | CRUD | None | Password management |
| F-M01-004 | User Group Management | P1 | CRUD | GET /api/users/groups/list, POST /api/users/groups | User groups |
| F-M01-005 | Permission Role Management | P1 | Config | None | Permission matrix |
| F-M01-006 | Audit User Logins | P1 | Monitor | login_log table exists | Login log |
| F-M01-007 | Organization Management | P1 | CRUD | None (org_unit text field only) | Organization tree |
| F-M01-008 | Account Lock/Unlock | P1 | Config | PUT /api/users/:id (partial) | User list/detail |
| F-M01-009 | TOTP Two-Factor Auth | P2 | Config | None | TOTP config |
| F-M01-010 | Multi-Session Management | P2 | Monitor | None | (server-side) |

## Feature Details

### F-M01-001: User Registration
**ACs:** Admin-only. Require username, password, full_name. Validate password strength (BR-M01-002). Return 201 on success, 400 on missing fields, 409 on duplicate username, 403 on non-admin.
**BRs:** BR-M01-001, BR-M01-002, BR-M01-003, BR-M01-009
**API:** POST /api/users (exists, needs admin check added)
**UI:** Registration form section in M01-user-management.html

### F-M01-002: User Login
**ACs:** Username+password required. Validate account status=1. Rate limit 5 attempts/15min. Record login_log. Return JWT + user info. Status 401 on wrong credentials, 423 on locked.
**BRs:** BR-M01-004, BR-M01-005, BR-M01-006, BR-M01-007, BR-M01-018
**API:** POST /api/auth/login (exists), GET /api/auth/me (exists)
**UI:** login.html

### F-M01-003: Password Management
**ACs:** Change password requires old password. New password must differ, meet strength rules. Cannot reuse last 3 passwords. Forgot password flow sends reset link. Reset token has 15min expiry.
**BRs:** BR-M01-002, BR-M01-003, BR-M01-013, BR-M01-014
**API Needed:** PUT /api/auth/change-password, POST /api/auth/forgot-password, POST /api/auth/reset-password
**UI:** Password management screen in M01-user-management.html

### F-M01-004: User Group Management
**ACs:** CRUD groups. Group name unique. Assign/remove users from groups. List members per group. Cannot delete group with members.
**BRs:** BR-M01-010, BR-M01-011
**API Needed:** GET /api/users/groups/:id/members, DELETE /api/users/groups/:id, PUT /api/users/groups/:id, POST /api/users/groups/:id/members, DELETE /api/users/groups/:id/members/:userId
**UI:** User groups screen in M01-user-management.html

### F-M01-005: Permission Role Management
**ACs:** Matrix of Group x Function with CRUD checkboxes. Save permissions to AUTH_GROUP_PERMISSION table. Read-only for non-admin.
**BRs:** BR-M01-011
**API Needed:** GET /api/permissions, PUT /api/permissions
**UI:** Permission matrix screen in M01-user-management.html

### F-M01-006: Audit User Logins
**ACs:** List login_log with pagination. Filter by date range, username, status. Show IP, device, timestamp.
**BRs:** BR-M01-007
**API Needed:** GET /api/auth/login-log
**UI:** Login log screen in M01-user-management.html

### F-M01-007: Organization Management
**ACs:** CRUD organizations in tree structure. Move node in hierarchy. Cannot delete org with child orgs or users.
**BRs:** BR-M01-015
**API Needed:** GET /api/organizations, POST /api/organizations, PUT /api/organizations/:id, DELETE /api/organizations/:id
**UI:** Organization tree screen in M01-user-management.html

### F-M01-008: Account Lock/Unlock
**ACs:** Admin locks user → status=2. Admin unlocks → status=1. Auto-lock after 5 failed attempts. Cannot self-lock. Locked user sees 423 on login.
**BRs:** BR-M01-004, BR-M01-005, BR-M01-008, BR-M01-012, BR-M01-018
**API:** PUT /api/users/:id (exists, needs status=2 support)
**UI:** User list/detail screens in M01-user-management.html

### F-M01-009: TOTP Two-Factor Auth
**ACs:** Admin enables TOTP for user. User scans QR code. Verify 6-digit code. Disable TOTP requires admin password.
**BRs:** BR-M01-016
**API Needed:** POST /api/auth/totp/setup, POST /api/auth/totp/verify, POST /api/auth/totp/disable
**UI:** TOTP config screen in M01-user-management.html

### F-M01-010: Multi-Session Management
**ACs:** Max 5 sessions per user. List active sessions. Admin can revoke any session. User can see own sessions.
**BRs:** BR-M01-017
**API Needed:** GET /api/auth/sessions, DELETE /api/auth/sessions/:id
**DB Need:** sessions table (or track via JWT jti + expiry)

## Data Model References
| Table | Used By |
|-------|---------|
| users | F-M01-001, F-M01-002, F-M01-003, F-M01-008, F-M01-009 |
| user_groups | F-M01-004 |
| group_members | F-M01-004 |
| login_log | F-M01-002, F-M01-006 |
| (new) group_permissions | F-M01-005 |
| (new) organizations | F-M01-007 |
| (new) password_history | F-M01-003 |
| (new) sessions | F-M01-010 |

## Key Gaps (prototype → production)
1. Admin-only middleware chưa có trên /api/users routes
2. Rate limiting (login attempts) chưa implement
3. Auto-lock chưa implement
4. Login-log query API chưa có
5. Password management API chưa có
6. Permission matrix chưa có (cần new table)
7. Organization management chưa có (cần new table)
8. TOTP chưa có
9. Multi-session chưa có
10. Logout API chưa có
