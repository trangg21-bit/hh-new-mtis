---
id: M01
name: "User Management"
status: completed
current-stage: enterprise-dual-security-verify
completed-stages:
  - engineering-business-analyst
  - engineering-ui-ux-designer
  - engineering-system-architect
  - utility-security-auditor
  - engineering-technical-lead
  - engineering-backend-developer
  - engineering-frontend-developer
  - engineering-qa-engineer
  - engineering-code-reviewer
  # v2 pipeline (risk_score=4 → data-flow tracing + dual verify):
  - enterprise-security-reaudit
  - enterprise-code-review-expert
  - enterprise-dual-security-verify
completed-enterprise-stages:
  - enterprise-security-reaudit
  - enterprise-code-review-expert
  - enterprise-dual-security-verify
stages-queue: []
pipeline-type: sdlc
repo-type: mono
intel-path: docs/intel
output-mode: lean
source-type: specification from-doc
risk-score: 4
risk-escalation: pro-tier
dual-reviewer: verified
---
# User Management [M01]

## Business Goal
Module quản lý tài khoản người dùng, phân quyền truy cập, xác thực và bảo mật cho toàn bộ hệ thống MTIS.

## Features (10)
- F-M01-001 User Registration — ✅ implemented
- F-M01-002 User Login — ✅ implemented
- F-M01-003 Password Management — ✅ implemented
- F-M01-004 User Group Management — ✅ implemented
- F-M01-005 Permission Role Management — ✅ implemented
- F-M01-006 Audit User Logins — ✅ implemented
- F-M01-007 Organization Management — ✅ implemented
- F-M01-008 Account Lock/Unlock — ✅ implemented
- F-M01-009 TOTP Two-Factor Auth — ✅ implemented
- F-M01-010 Multi-Session Management — ✅ implemented

## Final Status
All 10 features fully implemented. Backend API (Express + SQLite + JWT) complete with 6 route files, 8 DB tables, JWT auth, rate limiting, password history, auto-lock, session management, TOTP 2FA, permission matrix, org tree. Frontend SPA has 13 screens with live API integration, hash router, auth guard. QA: 48 tests pass.

## Enterprise Re-Audit (2026-06-08) — ✅ COMPLETE

Pipeline reopened per risk_score=4 escalation rules. 3 enterprise stages completed via data-flow tracing methodology.

### 7 Security Fixes Applied (ALL BLOCKER + HIGH)

| Fix | File | What |
|-----|------|------|
| CQ-01 | `passwordService.js:29` | `checkPasswordHistory` now receives plaintext `newPassword` and uses `bcrypt.compareSync` — **rule was completely broken before** |
| S-02 | `jwt.js:16` | `jwt.verify` now enforces `{algorithms: ['HS256']}` — prevents alg=none bypass |
| SEC-10 | `authMiddleware.js:9-12` | Middleware validates JTI exists in `sessions` table — **logout now actually works** |
| SEC-06 | `auth.js:113-120` | `/api/auth/me` checks `user.status`: 0→401 deleted, 2→423 locked |
| SEC-01 | `app.js:72` | `/api/admin/stats` requires `adminMiddleware` |
| SEC-02 | `app.js:42-48` | Unlock requires admin (removed `req.path.includes('/unlock')` bypass, use `req.method` check) |
| SEC-11 | `auth.js:53` | Auto-lock deletes ALL sessions immediately |

### 5-Critical-Flow Data Audit (ALL PASS)

| Flow | Trace Path | Verdict |
|------|-----------|---------|
| 1. Login | `password` → `bcrypt.compareSync` → `jwt.sign(HS256, jti)` → session INSERT → login_log INSERT | ✅ |
| 2. Password Change | `new_password` → `validate(5 rules)` → `hash` → `checkPasswordHistory(userId, new_password)` → `bcrypt.compareSync(hash)` → DELETE sessions | ✅ |
| 3. Token Verify | `Bearer` → `jwt.verify(alg:HS256)` → `sessions WHERE token_jti= ?` → `req.user` | ✅ |
| 4. Account Lockout | 5 fails → `UPDATE status=2` → `DELETE FROM sessions WHERE user_id=?` → 423 | ✅ |
| 5. RBAC Enforcement | `app.js:42-48` middleware chain: authMiddleware → `userWriteGuard(req.method)` → adminMiddleware (no bypass) | ✅ |

### Remaining (non-blocking)

13 findings in MEDIUM/LOW severity remain across security, data governance, and SRE domains (logged in audit reports). None are BLOCKER or HIGH.

### Test Results
48/48 Playwright tests PASS (3.1 min runtime, no regression). Tests verify: login, registration, CRUD, RBAC, lock/unlock, password history, forgot-password, TOTP UI, session revoke, rate limit.
