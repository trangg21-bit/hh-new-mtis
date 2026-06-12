# Cache-Busting Implementation Guide

> **Ngày tạo**: 2026-06-12  
> **Mục đích**: Tài liệu hướng dẫn implement cache-busting cho static assets trong MTIS

---

## Tổng quan

Cache-busting là kỹ thuật thêm version hash vào filename của static assets (JS/CSS) để đảm bảo browser tải lại file mới khi deploy, thay vì dùng cached version cũ.

### Lợi ích
- ✅ Tránh stale cache sau khi deploy
- ✅ Auto-bust cache khi code thay đổi
- ✅ Không cần thủ công clear cache browser
- ✅ Đảm bảo user luôn dùng version mới nhất

---

## Cách implement

### 1. Generate Version Hash

Chạy script để generate hash cho từng file:

```bash
node temp/generate-versions.js
```

Output sẽ hiển thị:
- File gốc → File với version hash
- JSON replacements để apply

**Ví dụ output:**
```
js/app.js → js/app-c994974c.js
css/app.css → css/app-eeea1b66.css
```

### 2. Apply Version Hash

Chạy script để apply vào HTML:

```bash
node temp/apply-versions.js
```

Script sẽ:
- Đọc từng file HTML trong `hh-new-mtis/docs/ui/`
- Thay thế filename gốc bằng filename có hash
- Ghi file HTML đã update

### 3. Kiểm tra kết quả

Mở HTML file, xác nhận script/css links có hash:

```html
<!-- ✅ Có version hash -->
<script src="js/app-c994974c.js"></script>
<link rel="stylesheet" href="css/app-eeea1b66.css">

<!-- ❌ Không có version hash -->
<script src="js/app.js"></script>
<link rel="stylesheet" href="css/app.css">
```

---

## Automation (Tương lai)

Để tự động hóa hoàn toàn, có thể:

### Option 1: Build script với npm

Thêm vào `package.json`:
```json
{
  "scripts": {
    "cache-bust": "node temp/apply-versions.js",
    "prebuild": "node temp/generate-versions.js > temp/versions.json"
  }
}
```

### Option 2: Webpack/Rollup plugin

Dùng `html-webpack-plugin` với `filenameHashing: true`:
```javascript
{
  filename: '[name]-[contenthash:8].[ext]',
}
```

### Option 3: CI/CD pipeline

Thêm bước cache-busting vào deploy pipeline:
```yaml
deploy:
  steps:
    - npm run build
    - npm run cache-bust
    - deploy dist/
```

---

## Testing

### Playwright test

Đã có test tự động trong `.playwright-mcp/tests/encoding.spec.ts`:

```typescript
test('index.html — script tags include version hash', async ({ page }) => {
  const response = await page.request.get(`${BASE}/`);
  const html = await response.text();
  const scriptPattern = /src="js\/[\w-]+-([a-f0-9]{8,})\.js"/g;
  const scripts = html.match(scriptPattern);
  expect(scripts && scripts.length > 0).toBeTruthy();
});
```

### Manual test

1. Hard refresh browser (Ctrl+F5)
2. Mở DevTools → Network tab → Disable cache
3. Xác nhận mỗi file có content hash trong URL
4. Kiểm tra status code = 200 (không phải 304)

---

## Version Hash Algorithm

Đang dùng MD5 hash, lấy 8 ký tự đầu:

```javascript
const crypto = require('crypto');
const hash = crypto.createHash('md5').update(content).digest('hex').slice(0, 8);
```

### Lưu ý

- MD5 cho cache-busting là OK (không cần cryptographic security)
- 8 ký tự đủ ngắn để URL đẹp, đủ dài để tránh collision
- Content-based hash: thay đổi code → thay đổi hash → bust cache

---

## File Structure

```
hh-new-mtis/docs/ui/
├── index.html          ← Đã apply cache-busting
├── login.html          ← Cần apply cache-busting (nếu có script/CSS)
├── theme-tokens.css    ← Đã có version hash
├── css/
│   ├── icons-de3f100e.css   ← ĐÃ có hash
│   ├── app-eeea1b66.css     ← ĐÃ có hash
│   └── screens-12be4dc0.css ← ĐÃ có hash
└── js/
    ├── icons-0e53767f.js    ← ĐÃ có hash
    ├── api-6d1bf93f.js      ← ĐÃ có hash
    ├── auth-0a3442bc.js     ← ĐÃ có hash
    ├── app-c994974c.js      ← ĐÃ có hash
    └── ... (các file khác)
```

---

## Checklist trước khi Deploy

- [ ] Chạy `node temp/generate-versions.js` để update hashes
- [ ] Chạy `node temp/apply-versions.js` để apply vào HTML
- [ ] Kiểm tra HTML có đúng hash patterns
- [ ] Chạy Playwright test: `npx playwright test .playwright-mcp/tests/encoding.spec.ts`
- [ ] Hard refresh browser, xác nhận assets load đúng
- [ ] Commit thay đổi vào git

---

## Troubleshooting

### Vấn đề: Hash không thay đổi sau khi sửa code

**Nguyên nhân:** File không được update đúng cách

**Giải pháp:**
1. Chạy lại `generate-versions.js`
2. Chạy lại `apply-versions.js`
3. Hard refresh browser (Ctrl+F5)

### Vấn đề: 404 Not Found sau khi deploy

**Nguyên nhân:** File vật lý chưa được rename theo hash

**Giải pháp:** Rename các file JS/CSS theo version hash

**Ví dụ:**
```bash
mv js/app.js js/app-c994974c.js
mv css/app.css css/app-eeea1b66.css
```

### Vấn đề: Browser vẫn cache file cũ

**Nguyên nhân:** Browser cache chưa được clear

**Giải pháp:**
1. Hard refresh: Ctrl+F5 (Windows) / Cmd+Shift+R (Mac)
2. Clear cache: DevTools → Application → Clear storage → Clear site data
3. Disable cache: DevTools → Network → Disable cache (☑)

---

## References

- [MDN — Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
- [Google Developers — Cache Busting](https://web.dev/caches-video-course-en/#cache-busting)
- [Webpack — Output Filenames](https://webpack.js.org/configuration/output/#outputfilename)
