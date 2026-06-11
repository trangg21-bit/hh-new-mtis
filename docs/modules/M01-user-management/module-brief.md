---
module-id: "M01"
module-slug: "user-management"
module-name: "User Management"
module-name-vn: "Quản lý người dùng"
purpose: "Quản lý tài khoản người dùng, phân quyền, đăng nhập cho toàn bộ hệ thống MTIS"
status: "done"
depends-on: []
feature-count: 10
---

# Module M01: User Management (Quản lý người dùng)

## Business Goal
Module quản lý tài khoản người dùng, phân quyền truy cập, xác thực và bảo mật cho toàn bộ hệ thống MTIS. Đây là module nền tảng, không phụ thuộc module nào khác.

## Features

| ID | Name | Priority | Status |
|----|------|----------|--------|
| F-M01-001 | User Registration | P0 | implemented |
| F-M01-002 | User Login | P0 | implemented |
| F-M01-003 | Password Management | P0 | implemented |
| F-M01-004 | User Group Management | P1 | implemented |
| F-M01-005 | Permission Role Management | P1 | implemented |
| F-M01-006 | Audit User Logins | P1 | implemented |
| F-M01-007 | Organization Management | P1 | implemented |
| F-M01-008 | Account Lock/Unlock | P1 | implemented |
| F-M01-009 | TOTP Two-Factor Auth | P2 | implemented |
| F-M01-010 | Multi-Session Management | P2 | implemented |

## Architecture
- **Runtime**: Node.js 22, Express 4.21, SQLite via better-sqlite3 11
- **Pattern**: Monolithic Express + 6 route modules + 4 service modules + 3 middleware modules
- **Auth**: JWT (jsonwebtoken 9.0), bcrypt (bcryptjs 2.4), TOTP (otplib)
- **DB**: 8 tables (users, user_groups, group_members, group_permissions, organizations, sessions, login_log, password_history) + 13 indexes

## Security
- OWASP Top 10 2021 compliant
- NIST SP 800-63B authentication guidelines
- VN Decree 85/2016/NĐ-CP compliance
- HSTS enabled for production
- JWT HS256 algorithm enforced
- Session validation via JTI in sessions table
- Rate limiting on login (5 attempts/15min)
- Password strength validation (min 8 chars, uppercase, lowercase, digit, special char)
- bcrypt hashing (salt rounds = 10)
- TOTP two-factor authentication support

## Pipeline Status
- **BA**: Approved (2026-06-09) — 00-lean-spec.md
- **UI/UX**: Approved (2026-06-09) — 01-ui-ux-spec.md
- **SA**: Approved (2026-06-09) — sa/00-lean-architecture.md
- **Security**: Approved (2026-06-09) — security-audit-v3-report.md
- **Tech-Lead**: Approved (2026-06-09) — 04-tech-lead-plan.md
- **Backend Dev**: Approved (2026-06-09) — 05-backend-dev-report.md
- **QA**: Approved (2026-06-09) — qa/qa-report.md
- **Code Review**: Approved (2026-06-09) — code-review-v2-report.md

## Key Implementation Notes
- Admin-only middleware on /api/users routes
- Rate limiting via express-rate-limit
- Auto-lock after 5 failed login attempts
- Login-log query API at /api/auth/login-log
- Password management with history (last 3 passwords)
- Permission matrix with group-permission table
- Organization tree with parent-child hierarchy
- TOTP two-factor authentication
- Multi-session management (max 5 per user)
- Soft-delete for users
- HSTS and security headers
- Session validation via JTI in sessions table
