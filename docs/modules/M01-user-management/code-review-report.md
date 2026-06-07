# M01 — Code Review Report

## Verdict: ✅ Approved

## Architecture Compliance
- All routes documented in sa/00-lean-architecture.md are implemented (31 API endpoints across 6 route files)
- Permission model (group → permission inheritance through group_permissions table) correctly implemented
- ADR decisions followed: stateless JWT (ADR-001), group-based permissions (ADR-002), in-memory rate limiting (ADR-003), SQLite→PG migration path (ADR-004), TOTP via speakeasy+qrcode (ADR-005), vanilla JS SPA (ADR-006), stubbed email (ADR-007)
- req.user contract documented in ADR-001 matches implementation

## Security Assessment
- ✅ Admin middleware guards all mutation endpoints (index.js writeGuard, groupsGuard, orgGuard, permGuard)
- ✅ JWT validated on every authenticated route via inline authMiddleware
- ✅ bcrypt password hashing with salt rounds=10
- ✅ Rate limiting on login (5/15min) and forgot-password (3/15min)
- ✅ Account auto-lock after 5 failed attempts
- ✅ Password history: cannot reuse last 3 passwords
- ✅ SQL injection prevented by better-sqlite3 parameterized queries
- ✅ X-Powered-By header disabled
- ✅ CORS restricted via env var
- ⚠️ totp_secret stored in plaintext (ADR-005 accepts for P2; production should encrypt)
- ⚠️ JWT_SECRET hardcoded in ADR-001 but overridden by env var in index.js:10

## Code Quality
- Consistent error handling: all endpoints return { error: "message" }
- Frontend screens use async/await consistently
- XSS prevention via esc() helper throughout SPA
- No placeholder TODO stubs remain in production code
- Duplicate validation logic (validatePassword appears in auth.js and users.js) — minor DRY violation
- Groups.js create/edit modals use inline DOM manipulation — acceptable for vanilla JS SPA

## Test Adequacy
- 38 test cases across all 10 features in test-evidence/M01-user-management.json
- Playwright spec: m01-integration.spec.ts covers all 14 screens
- QA evidence shows all features have happy-path + edge-case coverage

## Known Low-Severity Items (deferred)
1. Password regex uses `[^A-Za-z0-9]` instead of explicit special chars — accepts non-ASCII as "special"
2. TOTP verify-login shares rate limiter with login
3. Email is stubbed (ADR-007 — production needs nodemailer)
4. Groups create/edit modals rely on server 409 for uniqueness
