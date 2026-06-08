# M01 — Data Governance & PDPD Compliance Audit

## Verdict: Needs-fixes

## Audit Date: 2026-06-08

## Methodology

Đọc toàn bộ schema DB (`db.js` — 8 tables), tất cả 5 route files kiểm tra field nào trả về API response, 3 service files (email, password, TOTP), frontend `app.js` + screen files. Đối chiếu với Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân (PDPD Việt Nam), GDPR Articles 5, 15-20, 25, 32, và ISO 27701 PIMS framework.

## PII Inventory

| Field | Table(s) | Sensitivity | Stored Format | API Exposure | Accessible By |
|-------|----------|-------------|---------------|--------------|---------------|
| `username` | users, login_log | PII — Identifier | Plaintext | GET /api/users, GET /api/users/:id, GET /api/auth/me | All authenticated users |
| `full_name` | users | PII — Personal | Plaintext | GET /api/users, GET /api/auth/me | All authenticated users |
| `email` | users | PII — Contact | Plaintext | GET /api/users, GET /api/auth/me | All authenticated users |
| `phone` | users | PII — Contact | Plaintext | GET /api/users, GET /api/auth/me | All authenticated users |
| `password` | users | Sensitive — Auth | bcrypt hash | **NOT exposed** ✅ | DB only |
| `totp_secret` | users | Sensitive — Auth | **Plaintext** ⚠️ | **NOT exposed** ✅ | DB only |
| `password_hash` | password_history | Sensitive — Auth | bcrypt hash | **NOT exposed** ✅ | DB only |
| `token` (hashed) | reset_tokens | Sensitive — Auth | SHA-256 hash | **NOT exposed** ✅ | DB only |
| `ip` | login_log, sessions | PII — Network | Plaintext | GET /api/auth/login-log, GET /api/auth/sessions | Admin: all users; Non-admin: own only |
| `device` (User-Agent) | login_log, sessions | Low — Device fingerprint | Plaintext | GET /api/auth/login-log, GET /api/auth/sessions | Admin: all; Non-admin: own |
| `org_unit` | users | Low — Organizational | Plaintext | GET /api/users, GET /api/auth/me | All authenticated users |

## Findings

### HIGH (3)

| ID | Severity | Location | Description | PDPD Article | Remediation |
|----|----------|----------|-------------|--------------|-------------|
| DG-01 | HIGH | `users.js:14`, `users.js:55` | **PII over-exposure**: GET `/api/users` trả về `email`, `phone` của tất cả user cho bất kỳ ai đã đăng nhập. GET `/api/users/:id` tương tự. Theo nguyên tắc data minimization (PDPD Art 3.3, GDPR Art 5.1c), chỉ user tự xem hoặc admin xem PII của mình. | PDPD Điều 3.3 — Nguyên tắc tối thiểu dữ liệu | GET `/api/users` chỉ trả `id, username, full_name, org_unit, role, status`. Email + phone chỉ trả khi user gọi `/api/auth/me` hoặc admin gọi detail. |
| DG-02 | HIGH | `users.js:118-124` | **Soft delete không xóa PII**: DELETE user chỉ set `status=0`. `full_name`, `email`, `phone`, `org_unit`, `password`, `totp_secret` vẫn tồn tại trong DB. Không đáp ứng quyền xóa dữ liệu (PDPD Art 9, GDPR Art 17). Không có endpoint hard-delete. | PDPD Điều 9 — Quyền xóa dữ liệu | Thêm endpoint `DELETE /api/users/:id?hard=true` (admin-only): xóa PII fields (set null/empty), giữ ID cho referential integrity. Hoặc thêm `anonymize_user(id)` function. |
| DG-03 | HIGH | `services/totpService.js:7`, `db.js:122` | **TOTP secret plaintext**: `totp_secret` lưu dạng plaintext trong DB. Đã accepted trong audit v1 (M-03) với lý do "TOTP standard requires plaintext". Tuy nhiên, theo PDPD Art 17.2 (biện pháp bảo vệ dữ liệu nhạy cảm), secret authentication cần được mã hóa at rest. | PDPD Điều 17.2 — Biện pháp bảo vệ | Encrypt `totp_secret` bằng app-level key (AES-256-GCM, key từ env `TOTP_ENCRYPTION_KEY`). Encrypt/decrypt trong totpService trước khi lưu/đọc. |

### MEDIUM (6)

| ID | Severity | Location | Description | Remediation |
|----|----------|----------|-------------|-------------|
| DG-04 | MEDIUM | `db.js:43-50`, `auth.js:225-262` | **login_log không có retention policy**: Bảng login_log chứa IP + username + timestamp, không auto-purge. Với 1000 users × 10 logins/ngày, sau 1 năm = 3.65M rows chứa PII vô thời hạn. Vi phạm PDPD Art 6.2 (storage limitation). | Cron cleanup (node-cron hoặc startup job): `DELETE FROM login_log WHERE logged_at < datetime('now', '-365 days')`. Hoặc archive ra cold storage. |
| DG-05 | MEDIUM | `db.js:61-68` | **reset_tokens không cleanup**: Token đã used (`used=1`) và đã expired vẫn tồn tại trong DB vô hạn. Tuy token đã hash (SHA-256), nhưng vẫn là dữ liệu liên quan đến user. | Cleanup job: `DELETE FROM reset_tokens WHERE used = 1 OR expires_at < datetime('now', '-24 hours')`. |
| DG-06 | MEDIUM | `db.js:73-82` | **sessions không cleanup expired**: Sessions table không có cron cleanup. Expired sessions (quá `expires_at`) tích tụ. Token JTI + IP + device info. | Cleanup: `DELETE FROM sessions WHERE expires_at < datetime('now')`. |
| DG-07 | MEDIUM | `services/emailService.js:4-8` | **Console.log PII**: `sendEmail` log toàn bộ email address + reset token raw ra console. Trong container, console log đi vào Docker log → persisted trên host, có thể accessible qua `docker logs`. Vi phạm PDPD Art 17.3 (kiểm soát truy cập log). | Xóa console.log PII. Dùng structured logger với log level. Mask email: `e***@domain`. Không log raw token. |
| DG-08 | MEDIUM | `docs/ui/js/screens/register.js:55-61` (via `app.js:189-190`) | **Token trong localStorage**: JWT token lưu trong `localStorage`. Nếu có XSS (do vanilla JS frontend không CSP), attacker đọc được token → impersonate user → truy cập toàn bộ PII qua API. | Ngắn hạn: document risk. Dài hạn: httpOnly cookie + SameSite=Strict (cần backend hỗ trợ). |
| DG-09 | MEDIUM | `auth.js:116-118` | **GET /api/auth/me trả PII không filter**: endpoint trả `email, phone, org_unit` cho mọi user về chính mình — đúng. Nhưng cũng trả `totp_enabled`. Chấp nhận vì là dữ liệu của chính user đó. | OK — nhưng document rằng đây là intentional. |

### LOW (4)

| ID | Severity | Location | Description | Remediation |
|----|----------|----------|-------------|-------------|
| DG-10 | LOW | `users.js:82-97` | **Đăng ký không có consent capture**: POST /api/users không yêu cầu checkbox đồng ý điều khoản/privacy policy. Frontend `register.js` cũng không có privacy notice. | Thêm `consent_given` field (checkbox) vào registration form. Backend validate field này. |
| DG-11 | LOW | `users.js:118` | **Không cho phép user tự xóa tài khoản**: DELETE /api/users/:id chỉ cho admin. User không có quyền yêu cầu xóa dữ liệu của chính mình (PDPD Art 9). | Thêm endpoint `DELETE /api/auth/me` hoặc cho phép user gọi DELETE với id của chính mình. |
| DG-12 | LOW | Tất cả route | **Không có data export/portability**: Không có endpoint cho phép user tải dữ liệu của mình (PDPD Art 10, GDPR Art 20). | `GET /api/auth/export` — trả JSON chứa toàn bộ dữ liệu của user (profile + groups + login_log + sessions). |
| DG-13 | LOW | `db.js:6`, `docker-compose.yml:11` | **SQLite file không encrypted at rest**: DB file bind mount trên host filesystem không mã hóa. Ai có quyền đọc host có toàn bộ PII. | Document: yêu cầu disk encryption (LUKS/FileVault) trên host production. Dài hạn: SQLCipher. |

### INFO (2)

| ID | Location | Description |
|----|----------|-------------|
| DG-14 | `db.js:59-68` | `password_history` được prune (giữ 3 bản gần nhất) — đúng data minimization. |
| DG-15 | `db.js:70-71` | `idx_reset_tokens_token` + `idx_reset_tokens_user_id` — indexes hợp lý cho query lookup. |

## Retention Gaps

| Table | Growth Pattern | Rows/Year (1000 users) | Current Cleanup | Recommendation |
|-------|---------------|------------------------|-----------------|----------------|
| `login_log` | ~10 logins/user/day | ~3.65M | ❌ None | Auto-purge > 365 days |
| `reset_tokens` | ~1/month/user | ~12K | ❌ None | Purge used + expired daily |
| `sessions` | ~5 active/user + expired | ~5K active, nhiều expired | ❌ None | Purge expired daily |
| `password_history` | ~1/change/user | ~1K | ✅ Pruned to 3/user | OK |
| `users` | Static | ~1K | ❌ None | OK (small, bounded) |

## PDPD Compliance Scorecard

| Requirement | PDPD Article | Status | Gap |
|-------------|-------------|--------|-----|
| Data minimization | Art 3.3 | ❌ | PII over-exposure in list API |
| Purpose limitation | Art 3.2 | ✅ | Data dùng đúng mục đích quản lý user |
| Storage limitation | Art 6.2 | ❌ | login_log, reset_tokens, sessions không cleanup |
| Data accuracy | Art 7 | ✅ | User có thể đổi password, cập nhật profile |
| Security measures | Art 17 | ⚠️ | DB unencrypted, TOTP plaintext, token in localStorage |
| Right to access | Art 8 | ✅ | /api/auth/me + /api/users/:id |
| Right to rectification | Art 8.2 | ✅ | PUT /api/users/:id |
| Right to erasure | Art 9 | ❌ | Soft-delete only, no PII scrubbing |
| Right to portability | Art 10 | ❌ | No export endpoint |
| Consent | Art 12 | ❌ | No consent capture at registration |
| Breach notification | Art 23 | ❌ | No documented procedure |
| Data Protection Officer | Art 28 | ❌ | Not applicable (internal system) |

## Summary

- **Total**: 15 findings (3 HIGH, 6 MEDIUM, 4 LOW, 2 INFO)
- **PDPD Compliance Score**: 6/12 requirements met (50%)
- **Critical gaps**:
  - PII over-exposed in list APIs (DG-01)
  - No hard-delete/anonymization (DG-02)
  - TOTP secret plaintext at rest (DG-03)
  - 3 Bảng không có retention cleanup (DG-04, DG-05, DG-06)
- **Actionable without DB schema changes**: ALL 3 HIGH + 6 MEDIUM = 9 findings có thể fix ở app level
