# M01 — Enterprise Code Quality Review v2

## Verdict: Changes-required

## Audit Date: 2026-06-08

## Methodology

Đọc toàn bộ 17 file source (backend: app.js, index.js, db.js, 5 routes, 3 middleware, 4 services, 2 utils; frontend: app.js, screens/*; config: package.json, docker-compose.yml, Dockerfile). Đánh giá theo: code duplication, error handling consistency, input validation completeness, N+1 queries, race conditions, test coverage gaps, business rules compliance. Đối chiếu với 00-lean-spec.md và business-rules.md.

## Findings

### BLOCKER (2)

| ID | Severity | Category | Location | Description | Fix |
|----|----------|----------|----------|-------------|-----|
| CR-01 | BLOCKER | SQL Injection | `permissions.js:95-99` | **Dynamic column name in SQL**: `gp.${actionCol}` nội suy trực tiếp biến `actionCol` (từ `can_${action}`) vào SQL. `action` từ `req.query.action`, chỉ validate qua `VALID_ACTIONS = ['create','read','update','delete']` trong `permissionMiddleware.js:3` nhưng endpoint `/check` không dùng middleware đó — nó tự build SQL. Nếu attacker gửi `action=delete; DROP TABLE users--`, SQL injection xảy ra. | Whitelist action trước khi build SQL: `if (!['create','read','update','delete'].includes(action)) return 400`. Hoặc dùng prepared statement với CASE WHEN. |
| CR-02 | BLOCKER | Missing Validation | `permissions.js:84-104` | `/api/permissions/check` không import permissionMiddleware nhưng tự implement logic tương tự. Thiếu `authMiddleware` → endpoint public. Bất kỳ ai cũng có thể query permission check. Thiếu validate `feature` field. | Thêm `authMiddleware` vào route. Whitelist `feature` (chỉ cho phép known feature codes). Dùng `VALID_ACTIONS` từ permissionMiddleware hoặc validate độc lập. |

### HIGH (5)

| ID | Severity | Category | Location | Description | Fix |
|----|----------|----------|----------|-------------|-----|
| CR-03 | HIGH | N+1 Query | `users.js:68-75` | **Org path xây dựng với N+1**: `while (current) { ... db.prepare(...).get(current.parent_id) }` — mỗi cấp org là 1 query riêng. Với cây org 5 cấp × 50 users = 250 queries cho 1 page. | Load toàn bộ organizations vào Map một lần: `const orgMap = new Map(db.prepare('SELECT id, name, parent_id FROM organizations').all().map(o => [o.id, o]))`, rồi traverse in-memory. |
| CR-04 | HIGH | Race Condition | `auth.js:86-93` | **Session limit race condition**: `SELECT COUNT(*)` → `DELETE oldest` → `INSERT new` — không trong transaction. Nếu 2 request đồng thời cùng user: cả 2 đọc count=4, cả 2 delete oldest (xóa nhầm 2 sessions khác nhau), cả 2 insert → có thể có >5 sessions. | Wrap trong `db.transaction()`: check count + delete + insert atomic. |
| CR-05 | HIGH | Route Pollution | `users.js:150-171` | **Group CRUD routes lẫn trong users.js**: Route `/api/users/groups/list`, `POST /api/users/groups` định nghĩa trong `users.js`. Nhưng group CRUD đã có riêng `groups.js` mount tại `/api/users/groups`. Conflict route: `POST /api/users/groups` tồn tại ở cả 2 file → chỉ 1 handler chạy (tùy thứ tự require). | Xóa route group inline trong `users.js:150-171`. Tất cả group CRUD đã có trong `groups.js`. |
| CR-06 | HIGH | Session Cache | `middleware/authMiddleware.js:3-12` | authMiddleware KHÔNG verify token_jti trong sessions table. Token vẫn valid sau logout. Đồng thời, mỗi request đều parse JWT nhưng không cache user info → query DB mỗi lần cần user data. | Kiểm tra session existence: `db.prepare('SELECT user_id FROM sessions WHERE token_jti = ? AND expires_at > datetime(?)').get(payload.jti)`. Thêm `req.user` từ JWT payload (đã có id, username, role). |
| CR-07 | HIGH | Missing Error Handling | Nhiều route | **Inconsistent error handling**: `users.js:93-95` trả `{ error: e.message }` (leak DB error ra client). `permissions.js:77-78` trả `{ error: e.message }`. `auth.js:326-327` nuốt error (chỉ log vào console trong promise catch, không trả ra client rõ ràng). `organizations.js` không có try-catch. | Thống nhất error handler middleware: bắt tất cả error → log chi tiết server-side → trả `{ error: 'Lỗi máy chủ nội bộ' }` cho client. |

### MEDIUM (8)

| ID | Severity | Category | Location | Description | Fix |
|----|----------|----------|----------|-------------|-----|
| CR-08 | MEDIUM | Unnecessary I/O | `permissions.js:10-28` | `GET /api/permissions` đọc `catalog.json` từ disk MỖI LẦN request. File JSON parse + disk I/O trên mỗi request là lãng phí. | Cache catalog.json trong memory (load khi start + reload khi file thay đổi qua `fs.watch`). |
| CR-09 | MEDIUM | Missing Index | `db.js` (sessions) | `sessions` table không có index trên `user_id` cho query count + delete oldest. Mỗi login cần `SELECT COUNT(*) WHERE user_id = ?` → full scan. | Đã có `idx_sessions_user_id` ở dòng 84. OK — nhưng chưa có index composite cho `ORDER BY created_at ASC LIMIT 1` trong subquery. Thêm index nếu cần. |
| CR-10 | MEDIUM | Validation Gap | `auth.js:189-220` | Forgot-password chỉ validate email presence, không validate email format. `abc` passed validation → query DB → không match → response trả generic message (good). Nhưng DB query cho input rác là lãng phí. | Validate email format ở đầu hàm: `if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 400`. |
| CR-11 | MEDIUM | Inconsistent Pagination | `auth.js:225-262` | Login-log dùng manual parse pagination (page, limit từ query string), không dùng `parsePagination` từ `utils/validation.js` — trong khi `users.js` dùng. | Dùng chung `parsePagination` cho nhất quán. |
| CR-12 | MEDIUM | SQL Pattern | `auth.js:254` | `countSql = sql.replace(/SELECT .*? FROM/, 'SELECT COUNT(*) as c FROM')` — regex thay thế để build count query. Fragile: nếu SQL có subquery chứa SELECT, regex match sai. | Build count SQL riêng (như `users.js` làm với `countSql` riêng). |
| CR-13 | MEDIUM | Console Noise | `index.js:5-7` | In ra URL + emoji mỗi lần start. Production không nên có. | Log 1 dòng JSON: `{ event:'started', port:3000, node_env:process.env.NODE_ENV }`. |
| CR-14 | MEDIUM | No Input Sanitization | `users.js:82-97` | POST /api/users nhận `full_name`, `email`, `phone` nhưng không sanitize (trim, max length). Username cũng không validate format (chỉ có UNIQUE constraint bắt). | Sanitize: `full_name.trim().slice(0, 100)`, `email.trim().toLowerCase().slice(0, 200)`, validate email format, validate username format (`/^[a-z0-9_]{3,30}$/`). |
| CR-15 | MEDIUM | Orphan Data | `users.js:118-124` | Soft-delete user (`status=0`) nhưng không xóa `group_members` rows — nhóm vẫn đếm user đã xóa vào member_count. Sessions + password_history + reset_tokens có `ON DELETE CASCADE` nhưng soft-delete không trigger cascade. | Khi soft-delete: xóa group_members, xóa sessions, mark reset_tokens as used. |

### LOW (5)

| ID | Severity | Category | Location | Description | Fix |
|----|----------|----------|----------|-------------|-----|
| CR-16 | LOW | Code Smell | `db.js:114-130` | `ALTER TABLE ... ADD COLUMN` bọc trong try-catch để ignore error nếu column đã tồn tại. Pattern này OK cho SQLite nhưng không đẹp. | Dùng `PRAGMA table_info(users)` check column existence trước khi ALTER. |
| CR-17 | LOW | Magic Number | `auth.js:17` | `max: 50` — rate limit value. Không documented tại sao 50. | Đặt làm biến: `const DEV_RATE_LIMIT_MAX = 50`. Config từ env. |
| CR-18 | LOW | Frontend Double Escape | `app.js:7-12` | `esc()` dùng `d.textContent = s; return d.innerHTML` — đây là double-encode pattern. Một số screen dùng `esc()` rồi lại innerHTML nữa → text bị encode 2 lần (ký tự `&` thành `&amp;amp;`). | Kiểm tra tất cả screen dùng `esc()`. Nếu screen đã dùng `esc()` và assign vào `innerHTML`, không cần escape thêm lần nữa. |
| CR-19 | LOW | Unused Import | `services/rateLimiter.js` | File `rateLimiter.js` định nghĩa custom rate limiter (in-memory Map) nhưng không được import ở đâu. Auth.js dùng `express-rate-limit` thay thế. | Xóa file nếu không dùng, hoặc document rằng đây là alternative implementation. |
| CR-20 | LOW | No Type Safety | Toàn bộ backend | JavaScript không type. `req.user` có shape không documented. `db.get()` trả `undefined` thay vì `null`. | Dùng JSDoc annotations cho tất cả function. Hoặc migrate sang TypeScript (theo ADR-002 migration path). |

### INFO (3)

| ID | Category | Location | Description |
|----|----------|----------|-------------|
| CR-21 | Good Pattern | `organizations.js:18-26` | Validate parent_id existence khi create org — good. Circular reference check khi update (org không thể là cha của chính nó) — good. |
| CR-22 | Good Pattern | `permissions.js:68-72` | Batch update permissions trong transaction (`db.transaction`) — đúng pattern. |
| CR-23 | Good Pattern | `auth.js:198-203` | Forgot-password kiểm tra recent tokens per-user (3 token/15 phút) — good rate limit defense. |

## Compliance with Business Rules

| Rule (từ 00-lean-spec.md) | Implemented? | Tested? | Notes |
|---------------------------|-------------|---------|-------|
| Login with username+password | ✅ | ✅ | m01-all-tests.spec.ts |
| Password must have 8+ chars, uppercase, lowercase, digit, special | ✅ | ✅ | validatePassword tested |
| Account auto-lock after 5 failed logins in 15 min | ✅ | ✅ | m01-business-rules.spec.ts |
| Password history (last 3) | ✅ | ✅ | Kiểm tra khi change-password |
| JWT expiry 8h | ✅ | ⚠️ | Token TTL tested nhưng không test expiry edge case |
| Multi-session max 5 | ⚠️ | ⚠️ | Race condition (CR-04). Test không cover concurrent login |
| TOTP: setup → verify → enable → login 2-step | ✅ | ⚠️ | UI render test nhưng không test full flow (acceptable limitation) |
| Forgot-password: token hash SHA-256, single-use, 15min TTL | ✅ | ✅ | m01-business-rules.spec.ts |
| RBAC: admin full access, role-based permission via groups | ✅ | ✅ | 7 role tests in m01-all-tests.spec.ts |
| User CRUD: admin-only create/update/delete | ✅ | ✅ | 403 tests cho non-admin |
| Soft delete (status=0) | ✅ | ⚠️ | Soft delete có nhưng không cleanup related data (CR-15) |
| Unlock account: admin hoặc authorized user | ❌ | ❌ | S-01: unlock bypass admin check |
| Auditable login_log | ✅ | ✅ | Admin thấy tất cả, user thấy của mình |
| Email notification for forgot-password | ⚠️ | ⚠️ | Mock chỉ log console (S-14) |

## Test Coverage Gaps (Scenarios NOT Covered by Current 47 Tests)

| Gap | Priority | Description |
|-----|----------|-------------|
| TG-01 | HIGH | **JWT expiry edge case**: Token hết hạn 8h+1s → 401. Hiện không test. |
| TG-02 | HIGH | **Concurrent login race**: 2 request login đồng thời → session count không vượt 5. |
| TG-03 | HIGH | **Concurrent change-password**: 2 request đổi password đồng thời → không corrupt data. |
| TG-04 | MEDIUM | **TOTP brute force**: Gửi 10 TOTP code sai liên tiếp → rate limited. |
| TG-05 | MEDIUM | **Mass user creation**: Gửi 1000 request POST /api/users → không crash, không OOM. |
| TG-06 | MEDIUM | **SQL injection vector**: `permissions/check` với `action=delete; DROP TABLE--` → 400, không execute. |
| TG-07 | MEDIUM | **Forgot-password with invalid email format**: `email=abc` → 400 validation error. |
| TG-08 | LOW | **Unicode username**: `ngườidùng1` → hoạt động hoặc lỗi rõ ràng. |
| TG-09 | LOW | **Very long input**: full_name=500 chars → truncate/sanitize. |
| TG-10 | LOW | **DB connection lost mid-request**: → 500, không crash process. |

## Performance Concerns

| Issue | Location | Impact | Fix |
|-------|----------|--------|-----|
| N+1 org path query | `users.js:68-75` | 250 queries cho 50 users × 5 cấp org | Load org tree vào memory |
| catalog.json disk read per request | `permissions.js:10-28` | Disk I/O mỗi lần GET permissions | Cache in-memory |
| bcrypt.compareSync block event loop | `passwordService.js:20-21` | Block Node.js event loop 50-100ms/login | Dùng `bcrypt.compare` async hoặc worker thread |
| No DB query timeout | Tất cả route | Query treo vô hạn nếu DB lock | Set `db.pragma('busy_timeout = 5000')` |
| Sessions table không cleanup | `db.js:73-82` | 1000 users × 5 sessions = 5000 rows, tăng dần | Cron cleanup expired |

## Summary

- **Total**: 20 findings (2 BLOCKER, 5 HIGH, 8 MEDIUM, 5 LOW, 3 INFO)
- **Business rules compliance**: 10/14 rules fully implemented + tested, 3 partial, 1 broken (unlock)
- **Test gaps**: 10 scenarios identified, 3 HIGH priority
- **Key concerns**:
  - SQL injection trong permissions/check (CR-01) — **phải fix ngay**
  - Unlock privilege escalation (S-01 from security) — xác nhận ở đây
  - N+1 query org path (CR-03) — ảnh hưởng performance
  - Session race condition (CR-04) — vi phạm business rule max 5 sessions
- **Good patterns**: Transaction cho batch update, validate parent_id, forgot-password per-user rate limit
