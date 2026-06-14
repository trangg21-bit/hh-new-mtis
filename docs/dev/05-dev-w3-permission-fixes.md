---
feature-id: F-M01-005
stage: implementation
agent: engineering-backend-developer
wave: 3
task: Fix 5 lỗi permission trong hệ thống phân quyền
verdict: Pass
last-updated: 2026-06-13
---

# Wave 3 — Fix 5 Lỗi Permission (F-M01-005)

## Requirement Mapping

| # | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| 1 | **Missing endpoint** — `GET /api/permissions/role/:roleId` trả về danh sách `feature_ids` đã phân quyền | **Implemented** | `permissions.js:76-98` — query `group_permissions` cho group_id, chỉ trả về feature có ít nhất 1 action = 1 |
| 2 | **API format mismatch** — `PUT /api/permissions` nhận cả 2 format `{ group_id, feature_ids }` và `{ permissions: [...] }` | **Implemented** | `permissions.js:100-179` — structural check: `body.group_id` + `body.feature_ids` trước, fallback `body.permissions` |
| 3 | **Permission logic** — `{ group_id, feature_ids }` auto-map tất cả actions = 1 | **Implemented** | `permissions.js:130-134` — `const bit = 1; upsert.run(groupId, fc, bit, bit, bit, bit)` |
| 4 | **Data consistency** — Join path `group_members → group_permissions` đúng, FK constraint đúng | **Implemented** | `permissionMiddleware.js:18-22` — JOIN `gm.group_id = gp.group_id`, FK `group_permissions.group_id → user_groups.id` |
| 5 | **Default permissions** — Tạo default matrix khi group mới được tạo | **Implemented** | `groups.js:9-24` — `createDefaultPermissions()` gọi trong `POST /api/users/groups` |

## Files Changed

| File | Purpose |
|------|---------|
| `src/apps/api/src/routes/permissions.js` | Added `GET /api/permissions/role/:roleId` endpoint; refactored `PUT /api/permissions` dual-format; added `createDefaultPermissions()` helper |
| `src/apps/api/src/middleware/permissionMiddleware.js` | Fixed `getUserPermissions()` — `Math.max()` thay `||` cho proper union across multiple groups |
| `src/apps/api/src/routes/groups.js` | Added `createDefaultPermissions()` + `DEFAULT_FEATURE_CODES`; called in `POST /api/users/groups` |
| `src/apps/api/src/app.js` | Added default permissions row for group 2 trong reset-db seed hook |
| `src/apps/api/test-permissions-w3.js` | New integration test suite (9 test scenarios) |

## Key Technical Decisions

### Decision 1: Dual-format PUT endpoint
- **Decision:** `PUT /api/permissions` nhận cả 2 format
- **Reason:** Frontend tree-view gửi `{ group_id, feature_ids }`, backend consumers gửi `{ permissions: [...] }`
- **Trade-off:** Tăng complexity handler nhưng giữ backward compatibility; phân biệt bằng structural check

### Decision 2: Auto-map all actions = 1 cho new format
- **Decision:** Khi frontend chọn feature → tất cả actions = 1
- **Reason:** Frontend tree-view không expose action checkboxes — chỉ có checkbox per feature
- **Trade-off:** Less granular, đúng với UX tree-view. Admin fine-tune qua `permission-policies` nếu cần

### Decision 3: Math.max thay vì `||` cho permission union
- **Decision:** `getUserPermissions()` dùng `Math.max()` thay `||`
- **Reason:** `||` functionally equivalent cho 0/1, nhưng `Math.max()` thể hiện rõ intent "union of permissions across groups"
- **Trade-off:** Không ảnh hưởng existing behavior, rõ intent hơn

### Decision 4: Default permissions = 0 (least privilege)
- **Decision:** Group mới → tất cả permissions = 0
- **Reason:** Principle of least privilege. Admin phải chủ động cấp quyền
- **Trade-off:** Group mới không có quyền nào ban đầu

### Decision 5: Default permissions không block group creation
- **Decision:** `createDefaultPermissions()` được wrap trong try/catch riêng — group creation vẫn thành công nếu default perms fail
- **Reason:** Nhóm phải tồn tại trước khi có quyền; quyền là secondary concern
- **Trade-off:** Nếu default perms fail, nhóm tồn tại nhưng không có rows trong `group_permissions` — admin phải cấp quyền thủ công

### Decision 6: GET /api/permissions/role/:roleId filter
- **Decision:** Chỉ trả về feature có ít nhất 1 action = 1
- **Reason:** Frontend tree-view checkbox phản ánh feature đã được chọn
- **Trade-off:** Không thể fetch full permission matrix qua endpoint này — dùng `GET /api/permissions` nếu cần

## Validation / Authorization / Error Handling

| Endpoint | Auth | Validation | Error Responses |
|----------|------|------------|-----------------|
| `GET /api/permissions/role/:roleId` | `authMiddleware` | `roleId` là số, group tồn tại | 400 invalid roleId, 404 group not found |
| `PUT /api/permissions` (new) | `authMiddleware` | `group_id` là số, group tồn tại | 400 invalid group_id, 404 group not found |
| `PUT /api/permissions` (legacy) | `authMiddleware` | `body.permissions` là array | 400 invalid format, 500 DB error |
| `POST /api/users/groups` | `authMiddleware` + `adminMiddleware` | `name` required | 400 missing name, 409 duplicate name, 500 DB error |

## Tests Added / Updated

| Test | File | Coverage |
|------|------|----------|
| `GET /api/permissions/role/1` | `test-permissions-w3.js:78-86` | Returns 200, `feature_ids` array, non-empty for admin |
| `GET /api/permissions/role/9999` | `test-permissions-w3.js:89` | Returns 404 |
| `PUT /api/permissions { group_id, feature_ids }` | `test-permissions-w3.js:96-100` | Returns 200 |
| Verify saved features via role endpoint | `test-permissions-w3.js:104-112` | `feature_ids` includes `user`, `group`, `permission` |
| Verify actions = 1 in full matrix | `test-permissions-w3.js:116-126` | All 4 actions = 1 |
| `PUT /api/permissions { permissions: [...] }` legacy | `test-permissions-w3.js:136-142` | Returns 200 |
| Verify selective actions (legacy fine-tuning) | `test-permissions-w3.js:145-158` | `session` can_read=1 only, `totp` can_update=1 |
| `POST /api/users/groups` default permissions | `test-permissions-w3.js:166-183` | 201, empty `feature_ids` (all defaults=0) |
| Math.max union code review | `test-permissions-w3.js:191` | Verified in code |

## Verification Evidence

| Check | Command | Exit Code | Scope |
|-------|---------|-----------|-------|
| Syntax: permissions.js | `node -c src/apps/api/src/routes/permissions.js` | 0 | Module syntax |
| Syntax: permissionMiddleware.js | `node -c src/apps/api/src/middleware/permissionMiddleware.js` | 0 | Module syntax |
| Syntax: groups.js | `node -c src/apps/api/src/routes/groups.js` | 0 | Module syntax |
| Syntax: app.js | `node -c src/apps/api/src/app.js` | 0 | Module syntax |
| Require: permissions.js | `node -e "require('./src/routes/permissions.js')"` | 0 | Module loads |
| Require: permissionMiddleware.js | `node -e "require('./src/middleware/permissionMiddleware.js')"` | 0 | Module loads |
| Require: groups.js | `node -e "require('./src/routes/groups.js')"` | 0 | Module loads |
| Require: app.js syntax | `node -c src/app.js` | 0 | Full app syntax |

## Deployment / Migration Notes

- **No schema changes** — all changes are application logic only
- **No env vars** required beyond existing (`JWT_SECRET`, `DB_PATH`, `ENABLE_E2E_TEST_HOOKS`)
- **No database migration** needed — existing `group_permissions` table already has all required columns
- **Existing behavior preserved:** `PUT /api/permissions` với format `{ permissions: [...] }` hoạt động như cũ

## Known Limitations and Risks

1. **Hard-coded feature codes:** `DEFAULT_FEATURE_CODES` trong `groups.js` hard-coded thành `['user','group','permission','org','login_log','totp','session']`. Nếu catalog thay đổi, cần update 3 nơi: `groups.js`, `db.js` seed, `app.js` reset-hook.
2. **GET /api/permissions/role/:roleId không trả về permission detail:** Chỉ trả về `feature_ids` (không trả về `can_*` values). Dùng `GET /api/permissions` nếu cần chi tiết.
3. **Default permissions không block group creation:** Nếu `createDefaultPermissions()` fail, group vẫn được tạo nhưng không có permission rows. Admin phải cấp quyền thủ công.
4. **Existing seed — nhóm 3 (Lãnh đạo):** Chỉ có `login_log` read-only. Sau reset-db, nhóm 2 có default=0, nhóm 3 giữ `login_log` read-only. Không thay đổi behavior hiện tại.

## intel-drift: true

- New endpoint `GET /api/permissions/role/:roleId` — route mới chưa có trong existing documentation
- `permissionMiddleware.getUserPermissions()` logic change — có thể ảnh hưởng existing permission checks nếu user thuộc nhiều group
