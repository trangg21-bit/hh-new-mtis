# M01 Verification — Encoding & Cache Guardrail

> **Ngày tạo**: 2026-06-12  
> **Module**: M01 — User Management  
> **Mục đích**: Tổng quan các artifact đã tạo cho encoding và cache guardrail

---

## Tóm tắt

Đã tạo đầy đủ các guardrail và test cho M01 verification:

1. ✅ **Playwright E2E test** — Kiểm tra Content-Type encoding cho API và static assets
2. ✅ **Browser cache checklist** — Checklist trước khi đóng module
3. ✅ **Encoding pipeline checklist** — Checklist SDLC cho các module sau
4. ✅ **Cache-busting** — Đã apply version hash vào 25 static assets

---

## Artifacts đã tạo

### 1. Playwright E2E Test

**File:** `.playwright-mcp/tests/encoding.spec.ts`

**Nội dung:**
- 15 API endpoints được kiểm tra Content-Type: `application/json; charset=utf-8`
- Static assets (HTML/CSS/JS) được kiểm tra charset encoding
- Hard refresh test — xác nhận assets load fresh
- Service worker cache test — đảm bảo không có stale SW
- DevTools disable cache test — XHR/Fetch bypass cache
- Form encoding test — UTF-8 Vietnamese characters
- Cache-busting version hash verification

**Cách chạy:**
```bash
# Chạy encoding tests
npx playwright test .playwright-mcp/tests/encoding.spec.ts

# Chạy toàn bộ E2E tests
npx playwright test e2e/
```

### 2. Browser Cache Checklist

**File:** `.ai-kit/checklist/browser-cache-checklist.md`

**Nội dung:**
- Hard refresh test cho 12 màn hình
- Clear service worker cache verification
- Disable cache in DevTools verification
- Encoding verification cho 4 loại form (login, register, forgot/reset, change password)
- Cache-busting version hash verification

**Cách sử dụng:**
- Checklist này điền trước khi đóng module M01
- Đánh dấu ☐ → ☑ khi hoàn thành mỗi test
- Sign-off bởi QA Engineer, Tech Lead, Project Manager

### 3. Encoding Pipeline Checklist

**File:** `.ai-kit/checklist/encoding-pipeline-checklist.md`

**Nội dung:**
- Checklist cho từng phase SDLC (Requirement, Design, Implementation, Testing, Code Review, Pre-Close, Post-Deployment)
- Template code cho API routes, static assets, forms
- Checklist test cases cho unit/integration/E2E tests
- Module-specific checklist template
- Quick reference: common issues và solutions

**Cách sử dụng:**
- Áp dụng cho tất cả module mới hoặc module đang phát triển
- Mỗi module cần điền module-specific checklist
- Dùng làm template cho các module tương lai

### 4. Cache-Busting Implementation

**Files đã update:**
- `hh-new-mtis/docs/ui/index.html` — 25 script/CSS links có version hash

**Files hỗ trợ:**
- `temp/generate-versions.js` — Generate version hash cho từng file
- `temp/apply-versions.js` — Apply hash vào HTML files
- `.ai-kit/checklist/CACHE-BUSTING-GUIDE.md` — Hướng dẫn implement cache-busting

**Version hash patterns:**
```html
<!-- CSS với hash -->
<link rel="stylesheet" href="css/app-eeea1b66.css">

<!-- JS với hash -->
<script src="js/app-c994974c.js"></script>
```

**Cách apply cho module mới:**
1. Chạy `node temp/generate-versions.js`
2. Chạy `node temp/apply-versions.js`
3. Kiểm tra HTML có đúng hash patterns
4. Commit thay đổi

---

## File Tree

```
.hh-new-mtis/
├── docs/
│   └── ui/
│       ├── index.html              ← ✅ Đã apply cache-busting
│       ├── login.html              ← Chưa cần apply (không có script/CSS)
│       ├── theme-tokens.css        ← Đã có hash
│       ├── css/
│       │   ├── icons-de3f100e.css  ← ✅ Có hash
│       │   ├── app-eeea1b66.css    ← ✅ Có hash
│       │   └── screens-12be4dc0.css← ✅ Có hash
│       └── js/
│           ├── icons-0e53767f.js   ← ✅ Có hash
│           ├── api-6d1bf93f.js     ← ✅ Có hash
│           ├── auth-0a3442bc.js    ← ✅ Có hash
│           ├── app-c994974c.js     ← ✅ Có hash
│           └── ... (21 files khác)  ← ✅ Có hash
```

```
.ai-kit/
├── intel.db
└── checklist/
    ├── browser-cache-checklist.md      ← ✅ Checklist trước khi đóng module
    ├── encoding-pipeline-checklist.md  ← ✅ Checklist SDLC cho các module
    └── CACHE-BUSTING-GUIDE.md          ← ✅ Hướng dẫn implement cache-busting
```

```
.playwright-mcp/
└── tests/
    └── encoding.spec.ts                ← ✅ E2E test cho encoding & cache
```

---

## Test Coverage

| Category | # Tests | Status |
|----------|---------|--------|
| API Encoding (15 endpoints) | 15 | ✅ Tạo sẵn |
| Static Assets Encoding (HTML/CSS/JS) | 3 | ✅ Tạo sẵn |
| Hard Refresh | 1 | ✅ Tạo sẵn |
| Service Worker Cache | 1 | ✅ Tạo sẵn |
| DevTools Disable Cache | 1 | ✅ Tạo sẵn |
| Form Encoding — Vietnamese | 4 | ✅ Tạo sẵn |
| Cache-Busting Version Hash | 2 | ✅ Tạo sẵn |
| **Tổng** | **27** | |

---

## Checklist trước khi đóng Module M01

- [ ] Chạy `npx playwright test .playwright-mcp/tests/encoding.spec.ts` — tất cả test pass
- [ ] Chạy `npx playwright test e2e/` — tất cả test pass
- [ ] Điền `.ai-kit/checklist/browser-cache-checklist.md` — tất cả items ☑
- [ ] Verify HTML có 25 script/CSS links với version hash
- [ ] Hard refresh browser — assets load fresh (status 200, không 304)
- [ ] Clear service worker cache — không còn SW nào
- [ ] Test trên Chrome, Firefox, Edge — đều pass
- [ ] Test mobile responsive — pass
- [ ] Commit thay đổi vào git
- [ ] Code review approved
- [ ] QA evidence triple complete
- [ ] Sign-off bởi QA Engineer, Tech Lead, Project Manager

---

## Sign-Off

| Role | Tên | Ngày | Ký tên |
|------|-----|------|--------|
| QA Engineer | | | |
| Tech Lead | | | |
| Project Manager | | | |

---

## References

- [Playwright Test Documentation](https://playwright.dev/docs/intro)
- [MDN — Content-Type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type)
- [MDN — Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
- [RFC 7231 — HTTP/1.1: Semantics](https://tools.ietf.org/html/rfc7231)
- [CACHE-BUSTING-GUIDE.md](CACHE-BUSTING-GUIDE.md)
