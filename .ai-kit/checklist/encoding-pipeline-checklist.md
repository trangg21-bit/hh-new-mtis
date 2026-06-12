# SDLC Pipeline Checklist — Encoding & Cache Guardrail cho các Module sau

> **Ngày tạo**: 2026-06-12  
> **Áp dụng cho**: Tất cả module mới hoặc module đang được phát triển trong tương lai  
> **Mục đích**: Đảm bảo mỗi module đều có encoding guardrail và cache strategy phù hợp

---

## Phase 1: Requirement & Design

### 1.1 Business Requirements

- [ ] Yêu cầu về encoding đã được ghi nhận trong SRS/URD
- [ ] Yêu cầu về cache strategy đã được đề cập
- [ ] Yêu cầu về UTF-8 hỗ trợ tiếng Việt đã được xác nhận
- [ ] Performance impact của cache-busting đã được đánh giá

**Template câu hỏi BA:**
- Hệ thống có cần hỗ trợ đa ngôn ngữ (UTF-8)?
- Có yêu cầu về caching strategy cho static assets?
- Có cần cache-busting cho versioned deployments?
- Các form có nhập liệu tiếng Việt không?

### 1.2 Technical Design

- [ ] API routes trả về `Content-Type: application/json; charset=utf-8`
- [ ] Static assets (HTML/CSS/JS) có `charset=utf-8` trong Content-Type
- [ ] HTML script links có version hash: `src="js/app-abc12345.js"`
- [ ] HTML CSS links có version hash: `href="css/app-def67890.css"`
- [ ] Không có service worker được đăng ký (hoặc có策略 rõ ràng)
- [ ] Cache-Control headers được cấu hình đúng cho từng loại resource

**Architecture decision log:**
- Quyết định về cache strategy: ☐ No cache ☐ Browser cache ☐ CDN cache
- Quyết định về version hash: ☐ Git SHA ☐ Timestamp ☐ Content hash
- Quyết định về service worker: ☐ Không dùng ☐ Dùng với strategy rõ ràng

---

## Phase 2: Implementation

### 2.1 API Routes

#### Checklist cho từng route:

| # | Kiểm tra | Trạng thái | Ghi chú |
|---|----------|------------|---------|
| 1 | Response headers có `Content-Type: application/json; charset=utf-8` | ☐ Đã implement | |
| 2 | Error responses cũng có charset=utf-8 | ☐ Đã implement | |
| 3 | Content-Disposition header cho file downloads | ☐ Đã implement | |
| 4 | CORS headers cho cross-origin requests | ☐ Đã implement | |

**Template code (Express.js):**
```javascript
// ✅ Đúng
res.json({ data: result });
// Express tự động set Content-Type: application/json; charset=utf-8

// ❌ Sai — không có charset
res.type('json').json({ data: result });

// ✅ Đúng — download file
res.setHeader('Content-Type', 'application/octet-stream');
res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
res.sendFile(filePath);
```

### 2.2 Static Assets

#### Checklist cho từng file:

| # | Kiểm tra | Trạng thái | Ghi chú |
|---|----------|------------|---------|
| 1 | HTML có `<meta charset="UTF-8">` | ☐ Đã implement | |
| 2 | Script tags có version hash | ☐ Đã implement | `src="js/file-hash.js"` |
| 3 | CSS links có version hash | ☐ Đã implement | `href="css/file-hash.css"` |
| 4 | Content-Type headers đúng cho từng file type | ☐ Đã implement | |
| 5 | Không có inline event handlers (để CSP hoạt động) | ☐ Đã implement | |

**Template HTML với version hash:**
```html
<!-- ✅ Có version hash -->
<script src="js/app-abc12345.js"></script>
<script src="js/api-def67890.js"></script>
<link rel="stylesheet" href="css/theme-11122233.css">
<link rel="stylesheet" href="css/app-44455566.css">

<!-- ❌ Không có version hash — dễ stale cache -->
<script src="js/app.js"></script>
<link rel="stylesheet" href="css/app.css">
```

**Version hash generation (Node.js):**
```javascript
const crypto = require('crypto');
const fs = require('fs');

function generateVersionHash(filePath) {
  const content = fs.readFileSync(filePath);
  const hash = crypto.createHash('md5').update(content).digest('hex').slice(0, 8);
  return hash;
}

// Ví dụ: generate app-abc12345.js từ app.js
const hash = generateVersionHash('js/app.js');
const versionedPath = `js/app-${hash}.js`;
```

### 2.3 Service Worker

#### Checklist:

| # | Kiểm tra | Trạng thái | Ghi chú |
|---|----------|------------|---------|
| 1 | Không có service worker được đăng ký | ☐ Đã implement | Nếu không cần PWA |
| 2 | Hoặc có strategy cache rõ ràng (nếu cần PWA) | ☐ Đã implement | Stale-while-revalidate, v.v. |
| 3 | Có cơ chế unregister service worker | ☐ Đã implement | Cho development |
| 4 | Application tab → Service Workers trống | ☐ Đã implement | |

### 2.4 Forms

#### Checklist cho từng form:

| # | Kiểm tra | Trạng thái | Ghi chú |
|---|----------|------------|---------|
| 1 | Form có `enctype="multipart/form-data"` (nếu upload file) | ☐ Đã implement | |
| 2 | Input fields có `name` attribute đúng | ☐ Đã implement | |
| 3 | Validation client-side hỗ trợ UTF-8 | ☐ Đã implement | |
| 4 | Validation server-side hỗ trợ UTF-8 | ☐ Đã implement | |
| 5 | Display tên tiếng Việt đúng encoding | ☐ Đã implement | |

---

## Phase 3: Testing

### 3.1 Unit Tests

- [ ] Test Content-Type headers trong mock HTTP requests
- [ ] Test JSON serialization có charset=utf-8
- [ ] Test HTML generation có meta charset UTF-8
- [ ] Test version hash generation function

### 3.2 Integration Tests

- [ ] Test toàn bộ API endpoints trả về đúng Content-Type
- [ ] Test static file serving có charset=utf-8
- [ ] Test form submission với Vietnamese characters
- [ ] Test file download với Content-Disposition header

### 3.3 E2E Tests (Playwright)

#### Checklist test cases:

| # | Test case | File | Trạng thái |
|---|-----------|------|------------|
| 1 | API encoding — Content-Type: charset=utf-8 | `encoding.spec.ts` | ☐ Đã tạo |
| 2 | Static assets encoding | `encoding.spec.ts` | ☐ Đã tạo |
| 3 | Hard refresh test | `encoding.spec.ts` | ☐ Đã tạo |
| 4 | Service worker cache test | `encoding.spec.ts` | ☐ Đã tạo |
| 5 | DevTools disable cache test | `encoding.spec.ts` | ☐ Đã tạo |
| 6 | Form encoding — Vietnamese chars | `encoding.spec.ts` | ☐ Đã tạo |
| 7 | Cache-busting version hash | `encoding.spec.ts` | ☐ Đã tạo |

**Chạy test:**
```bash
# Chạy encoding tests
npx playwright test .playwright-mcp/tests/encoding.spec.ts

# Chạy toàn bộ E2E tests
npx playwright test e2e/
```

### 3.4 Manual Testing Checklist

| # | Kiểm tra | Công cụ | Trạng thái |
|---|----------|---------|------------|
| 1 | Hard refresh (Ctrl+F5) | Browser DevTools | ☐ Đã test |
| 2 | Clear service worker cache | Browser DevTools → Application | ☐ Đã test |
| 3 | Disable cache in DevTools | Browser DevTools → Network | ☐ Đã test |
| 4 | Verify encoding on all forms | Browser DevTools | ☐ Đã test |
| 5 | Test trên multiple browsers | Chrome, Firefox, Edge | ☐ Đã test |
| 6 | Test mobile responsive | Chrome DevTools → Device mode | ☐ Đã test |

---

## Phase 4: Code Review

### 4.1 Checklist cho reviewer

- [ ] API responses có `Content-Type: application/json; charset=utf-8`
- [ ] Static assets có version hash trong filename
- [ ] HTML có `<meta charset="UTF-8">`
- [ ] Không có hardcoded encoding (như `encoding='latin1'`)
- [ ] Form validation support UTF-8
- [ ] File upload/download có đúng Content-Type headers
- [ ] Cache-Control headers phù hợp cho từng loại resource
- [ ] Không có service worker không cần thiết
- [ ] E2E tests cho encoding và cache đã được thêm

### 4.2 Code review questions

1. **Encoding**: API endpoints có trả về charset=utf-8 không?
2. **Cache**: Static assets có version hash chưa?
3. **Forms**: Form inputs có hỗ trợ UTF-8 không?
4. **Service Worker**: Có service worker không cần thiết không?
5. **Testing**: Có E2E test cho encoding và cache chưa?

---

## Phase 5: Pre-Close Verification

### 5.1 Checklist trước khi đóng module

| # | Kiểm tra | Trạng thái | Ghi chú |
|---|----------|------------|---------|
| 1 | Chạy encoding.spec.ts — tất cả test pass | ☐ Đã test | |
| 2 | Chạy toàn bộ E2E tests — tất cả test pass | ☐ Đã test | |
| 3 | Browser cache checklist đã hoàn thành | ☐ Đã test | `.ai-kit/checklist/browser-cache-checklist.md` |
| 4 | Hard refresh test — assets load fresh | ☐ Đã test | |
| 5 | Clear service worker cache — không còn SW | ☐ Đã test | |
| 6 | Disable cache in DevTools — 200 OK, không 304 | ☐ Đã test | |
| 7 | Verify encoding on all forms — UTF-8 works | ☐ Đã test | |
| 8 | Version hash có trong script/CSS tags | ☐ Đã test | |
| 9 | Test trên Chrome, Firefox, Edge | ☐ Đã test | |
| 10 | Test mobile responsive | ☐ Đã test | |
| 11 | Commit thay đổi vào git | ☐ Đã commit | |
| 12 | Code review approved | ☐ Đã approved | |
| 13 | QA evidence triple complete | ☐ Đã complete | |

### 5.2 QA Evidence Triple

1. **Test report**: `test-results/` — Playwright test results
2. **Code review record**: PR/merge request đã approved
3. **Manual test log**: Browser cache checklist đã sign-off

---

## Phase 6: Post-Deployment Monitoring

### 6.1 Monitoring Checklist

| # | Kiểm tra | Công cụ | Trạng thái |
|---|----------|---------|------------|
| 1 | Monitoring error logs cho encoding issues | App logs | ☐ Đã setup |
| 2 | Monitoring cache hit ratios | CDN/Browser | ☐ Đã setup |
| 3 | Monitoring form submission errors | Analytics | ☐ Đã setup |
| 4 | Alert cho encoding-related errors | Monitoring | ☐ Đã setup |

---

## Module-Specific Checklist

### Template cho mỗi module mới:

```markdown
## Module: M-XXX — [Module Name]

### API Routes
- [ ] Route 1: /api/xxx — Content-Type: application/json; charset=utf-8
- [ ] Route 2: /api/yyy — Content-Type: application/json; charset=utf-8
- [ ] Error responses — Content-Type: application/json; charset=utf-8

### Static Assets
- [ ] HTML — meta charset UTF-8
- [ ] Script tags — version hash
- [ ] CSS links — version hash
- [ ] Content-Type headers đúng

### Forms
- [ ] Form 1 — UTF-8 support
- [ ] Form 2 — UTF-8 support
- [ ] File upload/download — Content-Disposition

### Testing
- [ ] Unit tests — encoding
- [ ] Integration tests — encoding
- [ ] E2E tests — encoding.spec.ts
- [ ] Manual tests — browser cache

### Pre-Close
- [ ] All tests pass
- [ ] Browser cache checklist complete
- [ ] Code review approved
- [ ] QA evidence triple complete
```

---

## Quick Reference: Common Issues

| Vấn đề | Nguyên nhân | Giải pháp |
|--------|-------------|-----------|
| Content-Type thiếu charset=utf-8 | Express không tự động set | Dùng `res.json()` thay vì `res.send()` |
| Static assets không có version hash | Không generate hash | Script Node.js generate hash |
| Stale cache sau deploy | Browser cache không bust | Thêm version hash vào filename |
| Vietnamese characters bị lỗi | Missing charset | Thêm `<meta charset="UTF-8">` |
| Service worker giữ stale assets | Không unregister | Check Application tab, unregister |
| Form submission thất bại | Encoding mismatch | Đảm bảo Content-Type: charset=utf-8 |

---

## References

- [RFC 7231 — HTTP/1.1: Semantics and Content-Type](https://tools.ietf.org/html/rfc7231)
- [MDN — Content-Type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type)
- [MDN — Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
- [Service Worker Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache_API)
- [Playwright Test Documentation](https://playwright.dev/docs/intro)

---

## Sign-Off

| Role | Tên | Ngày | Ký tên |
|------|-----|------|--------|
| Tech Lead | | | |
| QA Engineer | | | |
| Project Manager | | | |
