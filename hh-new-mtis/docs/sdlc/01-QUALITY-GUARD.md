# Quality Guard Process

## Mục đích: chặn bug tái diễn khi chạy M02 → M11

## 1. Playwright regression test phải chạy TOÀN BỘ mỗi khi deploy

File: `e2e/m01-full-flow.spec.ts` + `e2e/debug-bugs.spec.ts`

Đây không phải tùy chọn. Chạy:
```bash
npx playwright test e2e/ --reporter=list
```

Nếu bất kỳ test nào fail → KHÔNG deploy, KHÔNG chuyển module.

## 2. Kiểm tra "3 cái bẫy" đã phá được

| Bug | Module ảnh hưởng | Kiểm tra |
|-----|-------------------|----------|
| Body flex conflict (theme-tokens.css) | Tất cả module dùng SPA index.html | `body { display: flex }` tồn tại nhưng login page dùng `position: fixed inset: 0` override |
| Hash empty không set | Tất cả module dùng route guard | `app.js` resolve() có `history.replaceState(null, '', '#login')` |
| Rate limit quá thấp cho dev | Tất cả module có login/lock | `auth.js` rate limit max: 50 (dev) |

## 3. Checklist trước khi pass engineering-code-reviewer

- [ ] Playwright E2E coverage: ≥80% UI screens của module
- [ ] Test cả 3 viewport: 1440×900, 1920×1080, 768×1024 (tablet)
- [ ] Console error test: không có `Failed to load resource` (trừ 401 từ auth guard)
- [ ] CSS check: login page dùng `.login-page` layout `position: fixed`, không phụ thuộc `body { display: flex }`
- [ ] Không có 2 file HTML/JS login tồn tại song song — 1 source of truth
- [ ] Docker rebuild + restart trước khi test (volume-mounted files không cần rebuild, backend code cần)

## 4. Nếu review phát hiện bug layout

Dùng `position: fixed` cho full-viewport layout (login, forgot-password), không dùng `min-height: 100vh` với `body { display: flex }`. Vì body flex co flex-child theo content, không theo viewport.

## 5. DB reset giữa test suites

Rate limit + account lock state là global. Cần reset DB trước mỗi test suite:
```bash
docker exec hhnew-api-1 node -e "
const D=require('better-sqlite3');
const db=new D('/app/data/database.sqlite');
db.prepare('DELETE FROM login_log').run();
db.prepare('DELETE FROM sessions').run();
db.prepare(\"UPDATE users SET status=1 WHERE status=2\").run();
db.close();
"
```
