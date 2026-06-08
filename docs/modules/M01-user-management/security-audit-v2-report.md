# M01 — Enterprise Security Re-Audit v2

## Verdict: Needs-critical-fixes

## Audit Date: 2026-06-08

## Methodology

Đọc toàn bộ 17 file source M01 (app.js:126L, auth.js:502L, users.js:172L, groups.js:63L, permissions.js:106L, organizations.js:89L, 3 middleware files, 4 services, 2 utils, db.js:180L, package.json, docker-compose.yml, Dockerfile). Kiểm tra từng endpoint, middleware chain, input validation, authorization logic, JWT flow, TOTP flow, rate limit coverage, dependency version, CORS/Helmet config, và frontend XSS vectors. Đối chiếu với OWASP Top 10 2021, NIST SP 800-63B, và VN Government IT Security Decree 85/2016/NĐ-CP.

## Findings

### BLOCKER (2)

| ID | Category | Location | Description | Exploit Scenario | Remediation |
|----|----------|----------|-------------|------------------|-------------|
| S-01 | Privilege Escalation | `app.js:42-47` + `users.js:142-148` | Unlock endpoint bypasses admin check. Guard ở `app.js:43` dùng `!req.path.includes('/unlock')` để exempt unlock khỏi adminMiddleware. Nhưng route `/api/users/:id/unlock` không tự kiểm tra quyền — bất kỳ user đã đăng nhập nào cũng có thể unlock tài khoản bị khóa của người khác. | Chuyên viên A gửi `PUT /api/users/1/unlock` → mở khóa admin đã bị khóa → leo thang đặc quyền. | Thêm `adminMiddleware` check trực tiếp trong `users.js:142`, hoặc thay `req.path.includes` bằng regex chính xác: `/\/api\/users\/\d+\/unlock$/.test(req.path) && req.user.id === targetId`. |
| S-02 | JWT Algorithm Validation | `utils/jwt.js:15-16` | `jwt.verify(token, JWT_SECRET)` không truyền `algorithms` option. jsonwebtoken mặc định hỗ trợ nhiều algorithm (HS256, HS384, HS512, RS256...). Kẻ tấn công có thể gửi token signed với algorithm "none" và bypass verification. | Attacker gửi token `{"alg":"none","typ":"JWT"}.{"id":1,"role":"system-admin"}.` → server accept → full admin access. | `jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] })` |

### HIGH (6)

| ID | Category | Location | Description | Exploit Scenario | Remediation |
|----|----------|----------|-------------|------------------|-------------|
| S-03 | JWT Secret Hardcoded | `docker-compose.yml:17` | `JWT_SECRET=mtis-dev-secret-key-2026-change-in-production` — secret cứng trong file config. Nếu docker-compose.yml leak (git, CI log, shared screen), toàn bộ token có thể bị forge. | Developer push docker-compose.yml lên public repo → attacker forge admin JWT → full system access. | Production dùng `env_file` với `.env` ngoài git, hoặc Docker secrets / HashiCorp Vault. |
| S-04 | No TOTP verify-login Rate Limit | `auth.js:387` | `/totp/verify-login` chỉ dùng chung `loginLimiter` (50 req/15min). Không có per-user rate limit. Dù TOTP window ~30s hạn chế brute force, nhưng 1000 attempt/15min vẫn khả thi với botnet phân tán IP. | Attacker dùng nhiều IP proxy, gửi 50 attempt/IP mỗi 15 phút, thử 1M TOTP codes → phá 6-digit TOTP. | Thêm per-user rate limit: `3 failures / 5 minutes / per user_id`. Lưu failed TOTP count trong DB hoặc memory. |
| S-05 | Forgot-password Token Leak (dev) | `auth.js:216-218` | `_debug_raw_token` trả raw token trong response khi `NODE_ENV !== 'production'`. docker-compose.yml set `NODE_ENV=development` — nên raw token luôn exposed qua API response. | Anyone gọi POST /api/auth/forgot-password → nhận raw token trong response → reset password của user bất kỳ. | Chỉ trả `_debug_raw_token` khi có flag debug cụ thể (không phụ thuộc NODE_ENV), hoặc dùng log file thay vì API response. Production không log raw token. |
| S-06 | No Token JTI Validation per Request | `middleware/authMiddleware.js:3-12` + `auth.js:140-145` | authMiddleware chỉ verify JWT signature, KHÔNG check token_jti có tồn tại trong sessions table. Logout chỉ xóa session row, nhưng JWT vẫn valid 8h. Token bị đánh cắp trước logout vẫn dùng được. | User logout phiên cũ. Attacker có token cũ (đã logout) → gửi request với token → server vẫn accept vì JWT chưa hết hạn và không bị check blacklist. | authMiddleware kiểm tra sessions table: `SELECT 1 FROM sessions WHERE token_jti = ? AND expires_at > datetime('now')`. Nếu không có → 401. |
| S-07 | No Rate Limit on Change Password | `auth.js:149` | `/change-password` không có rate limiter. Attacker đã đăng nhập (hoặc có token) có thể brute-force old_password không giới hạn. | User session hijacked → attacker brute-forces old_password để đổi sang password mới → lock user thật ra khỏi tài khoản. | Thêm `changePasswordLimiter`: 5 attempt / 15 phút. Block sau 10 sai liên tiếp. |
| S-08 | SQLite DB File Unencrypted | `db.js:5-6`, `docker-compose.yml:11` | DB file tại `src/apps/api/data/database.sqlite` được bind mount vào container. Không mã hóa at rest. File chứa password hash, TOTP secret, email, phone của toàn bộ user. | DevOps có quyền đọc host filesystem → copy database.sqlite → offline brute force password hash, trích xuất TOTP secret → impersonate bất kỳ user nào. | (ADR-001 constrained) — ít nhất: document cần disk encryption (LUKS/FileVault) cho host, và hạn chế quyền truy cập file host. Dài hạn: SQLCipher hoặc SQL Server TDE. |

### MEDIUM (7)

| ID | Category | Location | Description | Remediation |
|----|----------|----------|-------------|-------------|
| S-09 | CORS fallback ambiguous | `app.js:23-25` | `origin: process.env.CORS_ORIGIN \|\| false` — nếu biến env không set, CORS bị disable hoàn toàn (no Access-Control-Allow-Origin). Nếu set `*`, mở toang cho mọi origin. Nếu set đúng domain, hoạt động tốt. Thiếu validation env. | Validate CORS_ORIGIN format khi start. Reject `*` trong production. Default về `false` nếu không set — nhưng document rõ ràng. |
| S-10 | Substring match in writeGuard | `app.js:43` | `!req.path.includes('/unlock')` — nếu có route khác chứa 'unlock' trong path, cũng bị exempt. Risk thấp vì chỉ có 1 unlock route hiện tại, nhưng là anti-pattern. | Dùng regex chính xác: `/^\/api\/users\/\d+\/unlock$/` hoặc middleware per-route. |
| S-11 | Unbounded login_log & reset_tokens tables | `db.js:43-50`, `db.js:61-68` | Không auto-purge login_log cũ hoặc reset_tokens đã expired/hết hạn. Bảng tăng vô hạn → disk exhaustion + slow query. | Cron job hoặc startup cleanup: xóa login_log > 90 ngày, xóa reset_tokens > 24h và đã used. |
| S-12 | No HSTS Header | `app.js:20` | Helmet `contentSecurityPolicy: false` đúng, nhưng `hsts` mặc định của helmet có thể không set nếu không dùng HTTPS. Production qua reverse proxy TLS cần `Strict-Transport-Security: max-age=31536000; includeSubDomains`. | Set `app.use(helmet({ contentSecurityPolicy: false, hsts: { maxAge: 31536000, includeSubDomains: true } }))` khi qua reverse proxy TLS. |
| S-13 | session.last_active_at never updated | `sessions` table, `auth.js:451-478` | `last_active_at` được set DEFAULT nhưng không có middleware update nó mỗi lần user gọi API. Dẫn đến không thể detect idle sessions để auto-logout. | authMiddleware cập nhật: `UPDATE sessions SET last_active_at = datetime('now','localtime') WHERE token_jti = ?` mỗi request. |
| S-14 | No email sending (mock) | `services/emailService.js:1-9` | `sendEmail` chỉ log ra console. Trong production, forgot-password token sẽ không được gửi. Token vẫn được tạo, lưu, và trả về (qua `_debug_raw_token`). | Implement real SMTP/API email sender. Fallback: log có structured format để ops team có thể gửi thủ công. |
| S-15 | Default seed passwords | `db.js:145-151` | `admin123` cho cả 3 seed user. Nếu seed script chạy trong production (do container restart mất volume), tài khoản mặc định được tạo với weak password. | Production: seed chỉ chạy nếu DB trống + NODE_ENV=development. Log warning nếu phát hiện mật khẩu mặc định. |

### LOW (4)

| ID | Category | Location | Description | Remediation |
|----|----------|----------|-------------|-------------|
| S-16 | Missing CSP | `app.js:20` | CSP bị disable (`contentSecurityPolicy: false`) vì frontend dùng inline event handlers. Chấp nhận cho prototype nhưng cần migration plan. | Migration plan: refactor inline `onclick`/`onkeydown` → `addEventListener`, enable CSP. |
| S-17 | Better-sqlite3 version ~11 | `package.json:13` | `"better-sqlite3": "^11.0.0"` — version 11.x có thể có CVE chưa được audit. | Chạy `npm audit` định kỳ. Pin version chính xác, không dùng `^`. |
| S-18 | No body size limit beyond default | `app.js:28` | `express.json()` default 100KB — đủ cho API payload nhưng không có limit rõ ràng. | Set explicit `express.json({ limit: '1mb' })` để document rõ ràng. |
| S-19 | bcryptjs 2.4.3 — acceptable | `package.json:12` | bcryptjs thuần JS, không có native binding. Chậm hơn bcrypt native nhưng chấp nhận cho prototype. | Production migration: dùng `bcrypt` native với worker thread. |

### INFO (2)

| ID | Category | Location | Description |
|----|----------|----------|-------------|
| S-20 | otplib 13.4.1 | `package.json:19` | otplib 13.x — version latest, không có known CVE. TOTP implementation chuẩn RFC 6238. |
| S-21 | express-rate-limit 7.4.0 | `package.json:16` | Latest version, standard headers enabled, legacy disabled. Config đúng best practices. |

## NEW Findings Not in Previous Audit (v1)

Previous audit covered 21 findings (17 fixed, 4 accepted). V2 phát hiện thêm **15 findings mới**:

| V2 ID | New? | Criticality |
|-------|------|-------------|
| S-01 | NEW | BLOCKER — Unlock privilege escalation |
| S-02 | NEW | BLOCKER — JWT alg=none bypass |
| S-03 | NEW | HIGH — JWT secret hardcoded in docker-compose |
| S-04 | NEW | HIGH — TOTP verify-login no per-user rate limit |
| S-05 | NEW | HIGH — `_debug_raw_token` in response (NODE_ENV=development) |
| S-06 | NEW | HIGH — No JTI validation per request |
| S-07 | NEW | HIGH — No rate limit on change-password |
| S-08 | NEW | HIGH — DB file unencrypted |
| S-09 | NEW | MEDIUM — CORS config ambiguous |
| S-10 | ENHANCED | MEDIUM — Substring match (v1 M-02 fixed but incomplete) |
| S-11 | NEW | MEDIUM — Unbounded table growth |
| S-12 | NEW | MEDIUM — Missing HSTS |
| S-13 | NEW | MEDIUM — Session last_active_at stale |
| S-14 | ENHANCED | MEDIUM — Email mock (v1 noted but didn't score) |
| S-15 | NEW | MEDIUM — Default seed passwords |

## Dependency CVE Scan Result

Đã kiểm tra `package.json` dependencies:
- `better-sqlite3@^11.0.0` — không có CVE critical trong npm advisory (2026-06)
- `jsonwebtoken@^9.0.2` — đã fix CVE-2022-23529 (RS256 bypass) từ 9.0.0
- `express@^4.21.0` — 4.21.x đã fix CVE-2024-43796, CVE-2024-45590
- `helmet@^8.0.0` — latest, không known CVE
- `otplib@^13.4.1` — latest, không known CVE

Tất cả dependency đều ở version gần latest, không có CVE CRITICAL known.

**Tuy nhiên**: `bcryptjs@^2.4.3` không phải `bcrypt` native — không có hardware acceleration, chậm hơn khi verify.

## Rate Limit Coverage Map

| Endpoint | Method | Rate Limited? | Limit | Notes |
|----------|--------|---------------|-------|-------|
| `/api/auth/login` | POST | ✅ loginLimiter | 50/15min | OK cho dev |
| `/api/auth/forgot-password` | POST | ✅ loginLimiter | 50/15min | + per-user 3 token/15min trong code |
| `/api/auth/totp/verify-login` | POST | ✅ loginLimiter | 50/15min | ⚠️ Thiếu per-user rate limit |
| `/api/auth/change-password` | PUT | ❌ | — | Cần rate limit |
| `/api/auth/reset-password` | POST | ❌ | — | Không rate limit |
| `/api/users` (POST/PUT/DELETE) | POST/PUT/DELETE | ❌ | — | Admin-only (trusted) |
| `/api/users/:id/unlock` | PUT | ❌ | — | ⚠️ Không admin check + không rate limit |
| `/api/permissions` PUT | PUT | ❌ | — | Admin-only |
| `/api/organizations` POST/PUT/DELETE | POST/PUT/DELETE | ❌ | — | Admin-only |
| `/api/users/groups` POST/PUT/DELETE | POST/PUT/DELETE | ❌ | — | Admin-only |
| All GET endpoints | GET | ❌ | — | Chấp nhận (read-only) |

## Summary

- **Total**: 21 findings (2 BLOCKER, 6 HIGH, 7 MEDIUM, 4 LOW, 2 INFO)
- **New vs v1**: 15 new + 2 enhanced from v1
- **Actionable now**: 2 BLOCKER + 6 HIGH = 8 must-fix trước production
- **Compliance level**: Đạt Level 2/3 (MTIS yêu cầu Level 3) — thiếu HSTS, JTI validation, per-user TOTP rate limit để lên Level 3
