# M01 — Handoff Note

**Created:** 2026-06-11 21:00  
**Module:** M01 User Management (`hh-new-mtis/docs/modules/M01-user-management`)

## Tình trạng hiện tại

| Trường | Giá trị |
|---|---|
| Pipeline status | `done` (8/8 stages completed) |
| QA verdict | ✅ 51/51 test cases pass |
| Final Reviewer verdict | ✅ **Pass** (reviewer v4, 21:00) |
| Must-fix remaining | **0** |
| Should-fix | 1 (CR-V3-04 silent catch, low risk) |

## Các fix đã hoàn thành

| CR | Mức | Mô tả | Status |
|---|---|---|---|
| CR-01 | BLOCKER | SQL injection trong permissions.js | ✅ Fixed (CASE WHEN parameterized) |
| CR-02 | BLOCKER | authMiddleware thiếu trên /api/permissions/check | ✅ Fixed (app.js áp dụng global) |
| CR-04 | HIGH | Race condition session limit | ✅ Fixed (db.transaction() wrap) |
| CR-V3-01 | BLOCKER | E2E reset hardcode admin123 | ✅ Fixed (env var + password verify) |
| CR-V3-02 | BLOCKER | Self-delete không yêu cầu password | ✅ Fixed (verifyPassword + 400 reject) |
| CR-V3-03 | HIGH | Password change không ghi audit log | ✅ Fixed (login_log INSERT) |

## Những gì cần lưu ý khi tiếp tục trên máy khác

1. **Chỉ có `hh-new-mtis` là workspace thật** — folder `docs/modules/M-001` ở root đã xóa
2. **Module ID là `M01`** (không có dash, legacy format) — ai-kit không thể resolve, cần thao tác thủ công
3. **Docker container** cần rebuild mỗi khi code đổi: `docker compose up -d --build api`
4. **DB volume** bind-mount từ `src/apps/api/data/` — xóa DB file để seed fresh
5. **Playwright tests** cần server chạy trên localhost:3000 (Docker container)
6. **ai-kit state** không hoạt động (legacy format) — `_state.md` phải update thủ công
7. **Test script** `test-cr-v3-clean.js` — đã test 3 CR-V3 fixes, nhưng Docker bind-mount cache có thể khiến test fail 404

## Các artifact quan trọng

- `_state.md` — pipeline state (status: done, reviewer: Approved)
- `code-review-v3-report.md` — reviewer v3 (Changes-requested)
- `08-review-report.md` — reviewer v4 (Pass)
- `module-brief.md` — module overview
- `qa/qa-report.md` — QA 51/51 pass
- `test-evidence/test-evidence.json` — test evidence JSON
- `security-audit-v3-report.md` — security audit v3
- `screenshots/` — 17 ảnh chụp UI

## Các stage đã hoàn thành

1. BA (engineering-business-analyst) — Approved
2. UI/UX Designer — Approved
3. SA (engineering-system-architect) — Approved
4. Security Auditor — Approved
5. Tech Lead — Approved
6. Backend Dev — Approved
7. QA — Approved
8. Code Reviewer — ✅ **Approved**

## Có thể làm gì tiếp theo

- **Generate docs:** `/generate-docs` (TKKT, TKCS, TKCT, HDSD)
- **Close module:** `/close-module M01` (chốt module)
- **Export delivery:** `/zip-disk` (package bàn giao)
- **Start M02:** `/resume-module M02`
- **Fix bugs sau này:** Sửa code → `/resume-module M01` reopen
