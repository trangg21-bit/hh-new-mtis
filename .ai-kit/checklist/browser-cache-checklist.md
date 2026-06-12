# Browser Cache Checklist — Trước khi Đóng Module

> **Module**: M01 — User Management  
> **Ngày tạo**: 2026-06-12  
> **Mục đích**: Checklist kiểm tra cache browser trước khi đóng module, đảm bảo không có stale cache hoặc encoding issues

---

## 1. Hard Refresh Test

### 1.1 Kiểm tra hard refresh trên tất cả các màn hình

| # | Màn hình | Trạng thái | Ghi chú |
|---|----------|------------|---------|
| 1 | Login page | ☐ Đã test | Ctrl+F5 / Cmd+Shift+R |
| 2 | Dashboard | ☐ Đã test | Ctrl+F5 / Cmd+Shift+R |
| 3 | Users list | ☐ Đã test | Ctrl+F5 / Cmd+Shift+R |
| 4 | User detail | ☐ Đã test | Ctrl+F5 / Cmd+Shift+R |
| 5 | Groups list | ☐ Đã test | Ctrl+F5 / Cmd+Shift+R |
| 6 | Permissions | ☐ Đã test | Ctrl+F5 / Cmd+Shift+R |
| 7 | Organizations | ☐ Đã test | Ctrl+F5 / Cmd+Shift+R |
| 8 | Login Log | ☐ Đã test | Ctrl+F5 / Cmd+Shift+R |
| 9 | Sessions | ☐ Đã test | Ctrl+F5 / Cmd+Shift+R |
| 10 | TOTP setup | ☐ Đã test | Ctrl+F5 / Cmd+Shift+R |
| 11 | Forgot password | ☐ Đã test | Ctrl+F5 / Cmd+Shift+R |
| 12 | Reset password | ☐ Đã test | Ctrl+F5 / Cmd+Shift+R |

**Test steps:**
1. Mở browser DevTools → Network tab → **Disable cache** (✓ "Disable cache")
2. Hard refresh (Ctrl+F5 / Cmd+Shift+R)
3. Xác nhận tất cả assets tải lại hoàn toàn (status 200, không 304)
4. Kiểm tra Content-Type cho từng asset

---

## 2. Clear Service Worker Cache

### 2.1 Kiểm tra service workers

| # | Kiểm tra | Trạng thái | Ghi chú |
|---|----------|------------|---------|
| 1 | Kiểm tra `navigator.serviceWorker.getRegistrations()` | ☐ Đã test | Phải trả về mảng rỗng [] |
| 2 | Unregister service workers (nếu có) | ☐ Đã test | Gọi `reg.unregister()` |
| 3 | Xác nhận không còn service workers | ☐ Đã test | `getRegistrations()` trả về [] |
| 4 | Kiểm tra Application tab → Service Workers | ☐ Đã test | Không có entry nào |

**Test steps:**
1. Mở browser DevTools → Application tab → Service Workers
2. Xác nhận không có service worker đang hoạt động
3. Nếu có, click **Unregister**
4. Reload page, kiểm tra lại Service Workers section
5. Chạy `await navigator.serviceWorker.getRegistrations()` trong Console — phải trả về `[]`

---

## 3. Disable Cache in DevTools

### 3.1 Kiểm tra với cache disabled

| # | Kiểm tra | Trạng thái | Ghi chú |
|---|----------|------------|---------|
| 1 | Network → Disable cache (✓) | ☐ Đã test | DevTools Setting |
| 2 | Reload page — tất cả assets là 200 | ☐ Đã test | Không có 304 Not Modified |
| 3 | Kiểm tra Content-Type: charset=utf-8 | ☐ Đã test | API: `application/json; charset=utf-8` |
| 4 | Kiểm tra HTML: `text/html; charset=utf-8` | ☐ Đã test | |
| 5 | Kiểm tra CSS: `text/css; charset=utf-8` | ☐ Đã test | |
| 6 | Kiểm tra JS: `application/javascript; charset=utf-8` | ☐ Đã test | |

**Test steps:**
1. DevTools → Network tab
2. ☑ **Disable cache**
3. Reload page (F5)
4. Kiểm tra mỗi request:
   - Status code = 200 (không phải 304)
   - Content-Type header có `charset=utf-8`
5. Lặp lại cho ít nhất 3 lần reload

---

## 4. Verify Encoding on All Forms

### 4.1 Form login

| # | Kiểm tra | Trạng thái | Ghi chú |
|---|----------|------------|---------|
| 1 | Submit form với username/password ASCII | ☐ Đã test | `admin` / `admin123` |
| 2 | Submit form với username/password Unicode | ☐ Đã test | `admin_tëst` / `mät_key123` |
| 3 | Content-Type response: `charset=utf-8` | ☐ Đã test | |
| 4 | Response body parse đúng JSON | ☐ Đã test | Không lỗi decode |

### 4.2 Form register

| # | Kiểm tra | Trạng thái | Ghi chú |
|---|----------|------------|---------|
| 1 | displayName tiếng Việt: `Nguyễn Văn A` | ☐ Đã test | |
| 2 | email: `test@ví dụ.vn` | ☐ Đã test | |
| 3 | Content-Type response: `charset=utf-8` | ☐ Đã test | |
| 4 | Response body parse đúng JSON | ☐ Đã test | |

### 4.3 Form forgot/reset password

| # | Kiểm tra | Trạng thái | Ghi chú |
|---|----------|------------|---------|
| 1 | Email tiếng Việt: `nguỳên.văn@ví dụ.vn` | ☐ Đã test | |
| 2 | Content-Type response: `charset=utf-8` | ☐ Đã test | |
| 3 | Response body parse đúng JSON | ☐ Đã test | |

### 4.4 Form change password (self)

| # | Kiểm tra | Trạng thái | Ghi chú |
|---|----------|------------|---------|
| 1 | oldPassword/newPassword có ký tự đặc biệt | ☐ Đã test | `Mật khẩu!@#$%123` |
| 2 | Content-Type response: `charset=utf-8` | ☐ Đã test | |
| 3 | Response body parse đúng JSON | ☐ Đã test | |

---

## 5. Cache-Busting Version Hash

### 5.1 Kiểm tra version hash trong HTML

| # | Kiểm tra | Trạng thái | Ghi chú |
|---|----------|------------|---------|
| 1 | Script tags có version hash | ☐ Đã test | `src="js/app-abc12345.js"` |
| 2 | CSS links có version hash | ☐ Đã test | `href="css/app-def67890.css"` |
| 3 | Hash dài ít nhất 8 ký tự hex | ☐ Đã test | Pattern: `[a-f0-9]{8,}` |
| 4 | Tất cả script/CSS đều có hash | ☐ Đã test | Không bỏ sót file nào |

**Test steps:**
1. Fetch `http://localhost:3000/`
2. Parse HTML, tìm tất cả `<script src="...">` và `<link href="...">`
3. Kiểm tra mỗi file có `-<hash>` trong filename
4. Hash phải là 8+ ký tự hex

---

## 6. Post-Checklist Actions

Sau khi hoàn thành checklist, thực hiện:

- [ ] Chạy Playwright test: `npx playwright test .playwright-mcp/tests/encoding.spec.ts`
- [ ] Chạy toàn bộ E2E test: `npx playwright test e2e/`
- [ ] Xác nhận không có test nào fail
- [ ] Commit thay đổi
- [ ] Đóng module M01

---

## 7. Known Issues & Notes

| # | Issue | Trạng thái | Ghi chú |
|---|-------|------------|---------|
| 1 | | ☐ Chưa có | |
| 2 | | ☐ Chưa có | |

---

## 8. Sign-Off

| Role | Tên | Ngày | Ký tên |
|------|-----|------|--------|
| QA Engineer | | | |
| Tech Lead | | | |
| Project Manager | | | |
