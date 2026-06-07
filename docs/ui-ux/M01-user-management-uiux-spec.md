# M01 — User Management: UI/UX Screen Composition Spec

## 1. Screen Map

| ID | Screen Name | Feature ID | In Prototype? | Gaps / Issues |
|----|-------------|------------|---------------|---------------|
| S-M01-01 | **Dashboard — Quản lý người dùng** (Dashboard) | F-M01-001, F-M01-006 | Y | No loading state for stats; no error handling for API fail; stat "locked accounts" list is hardcoded |
| S-M01-02 | **Danh sách người dùng** (User List) | F-M01-001, F-M01-008 | Y | Table columns inconsistent (prototype has "Vai trò" + "Trạng thái" but mock rows add "Đơn vị" + "Ngày tạo" that don't match API); search debounce missing; no delete action; no confirmation dialog for lock/unlock |
| S-M01-03 | **Chi tiết người dùng / Chỉnh sửa** (User Detail / Edit) | F-M01-001, F-M01-008 | Y | "Lưu" and "Chỉnh sửa" buttons both always visible — missing view/edit mode toggle; no field validation (empty name, invalid email); no password change field here; no "Xóa người dùng" action |
| S-M01-04 | **Nhóm người dùng** (User Groups) | F-M01-004 | Y | No "Xem thành viên" button on each row; delete button has no confirmation; no empty state; no modal for creating/editing group; member count is hardcoded |
| S-M01-05 | **Phân quyền** (Permission Matrix) | F-M01-005 | Y | Checkboxes are represented as emoji ✅/—, not actual `<input type="checkbox">` elements; no "expand functions" drill-down; no save API flow; no loading state |
| S-M01-06 | **Nhật ký đăng nhập** (Login Log) | F-M01-006 | Y | No pagination controls; no export button; filters exist but no JS to wire them; empty state missing |
| S-M01-07 | **Cây đơn vị** (Organization Tree) | F-M01-007 | Y | Flat ASCII tree, not interactive; no drag-drop or expand/collapse; no add/edit/delete modals; no search |
| S-M01-08 | **Cấu hình TOTP** (TOTP Config) | F-M01-009 | Y | QR code is a placeholder icon, not a real QR; no "disable 2FA" flow with admin password; no error state for invalid code |
| S-M01-09 | **Đăng ký tài khoản** (User Registration) | F-M01-001 | Y | No inline password strength indicator; no username uniqueness check; no email format validation; unit/role selects are hardcoded |
| S-M01-10 | **Đổi mật khẩu** (Password Management) | F-M01-003 | Y | No old password validation against server; no confirmation dialog; password history table has no pagination |
| **S-M01-11** | **Đăng nhập** (Login) *(missing)* | F-M01-002 | **N** | Referenced as `/login.html` but not included; needs login form, CAPTCHA, rate-limit feedback, locked-account error |
| **S-M01-12** | **Quên mật khẩu** (Forgot Password) *(missing)* | F-M01-003 | **N** | No screen at all; needs email input, success message, error handling |
| **S-M01-13** | **Đặt lại mật khẩu** (Reset Password) *(missing)* | F-M01-003 | **N** | No screen; needs token validation, new password fields, confirmation |
| **S-M01-14** | **Phiên đăng nhập** (Active Sessions) *(missing)* | F-M01-010 | **N** | Not prototyped; needs list of active sessions, revoke button per session |
| **S-M01-15** | **Nhật ký hoạt động** (Activity Log) *(missing)* | — | **N** | Referenced in sidebar but no screen built |

---

## 2. Screen Flow (Text-based User Journey)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AUTH FLOW                                    │
│                                                                     │
│  [S-M01-11] Login ──────────────────────────────────────────────┐  │
│    ├── Success ──→ Redirect to [S-M01-01] Dashboard            │  │
│    ├── Wrong password ──→ Show error, increment counter        │  │
│    ├── Account locked ──→ Show 423 error message               │  │
│    └── Forgot password ──→ [S-M01-12] Forgot Password          │  │
│                              └── Email sent ──→ [S-M01-13] Reset│  │
│                                                    Password     │  │
│                                                                     │
│  [S-M01-13] Reset Password                                         │
│    ├── Token valid ──→ Show new password form                     │
│    ├── Token expired ──→ Show "link expired" error                │
│    └── Success ──→ Redirect to [S-M01-11] Login                   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                       ADMIN FLOW (post-login)                       │
│                                                                     │
│  [S-M01-01] Dashboard                                               │
│    ├── Click "Danh sách người dùng" ──→ [S-M01-02] User List      │
│    │     ├── Click "Thêm mới" ──→ [S-M01-09] Registration Form    │
│    │     ├── Click ✎ on row ──→ [S-M01-03] User Detail/Edit       │
│    │     │     └── After save ←─ Back to [S-M01-02]               │
│    │     ├── Click 🔒/🔓 on row ──→ Confirm dialog ──→ API        │
│    │     └── Search/filter rows ──→ Table updates                  │
│    ├── Click "Nhóm người dùng" ──→ [S-M01-04] User Groups         │
│    │     ├── Click "Thêm nhóm" ──→ Modal: create group            │
│    │     ├── Click ✎ on row ──→ Modal: edit group                 │
│    │     ├── Click 🗑 on row ──→ Confirm dialog ──→ Delete       │
│    │     └── Click group row ──→ Member list (modal or inline)    │
│    ├── Click "Phân quyền" ──→ [S-M01-05] Permission Matrix        │
│    │     └── Toggle checkboxes ──→ Click "Lưu" ──→ Save API       │
│    ├── Click "Nhật ký đăng nhập" ──→ [S-M01-06] Login Log         │
│    │     └── Filter + paginate                                     │
│    ├── Click "Đơn vị" ──→ [S-M01-07] Organization Tree            │
│    │     ├── Click "+ Thêm đơn vị" ──→ Modal: create org node     │
│    │     ├── Click node ──→ Edit/delete modal                      │
│    │     └── Drag node ──→ Reparent confirmation                   │
│    ├── Click "TOTP" ──→ [S-M01-08] TOTP Config                    │
│    │     ├── Enable 2FA ──→ QR code → verify 6-digit code         │
│    │     └── Disable 2FA ──→ Enter admin password                  │
│    └── Click Header avatar ──→ Dropdown: Đổi mật khẩu / Đăng xuất│
│          ├── Đổi mật khẩu ──→ [S-M01-10] Password Management      │
│          └── Đăng xuất ──→ Confirm ──→ Redirect to [S-M01-11]     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Per-Screen Analysis

### S-M01-01: Dashboard

| Aspect | Detail |
|--------|--------|
| **Normal** | 4 stat cards + 2 grid cards (recent logins + unit distribution) |
| **Loading** | ❌ Missing — stats show hardcoded values until API resolves; should show skeleton/spinner |
| **Empty** | N/A (stats always have values) |
| **Error** | ❌ Missing — if `/api/users?limit=200` fails, stats silently keep hardcoded values; no toast/alert |
| **Edge cases** | API returns 0 users → stats show 0; API returns 401 → redirect to login (handled in apiGet wrapper) |
| **Validation** | N/A |
| **Accessibility** | Stat cards are plain divs, not `<article>`/`<section>`; no `aria-label` on stat values |
| **Responsive** | `auto-fit` grid works; on <768px sidebar hidden but no hamburger menu toggle |

### S-M01-02: User List

| Aspect | Detail |
|--------|--------|
| **Normal** | Table with 6 columns (STT, Tên đăng nhập, Họ tên, Email, Vai trò, Trạng thái, Thao tác); search + filter + pagination |
| **Loading** | ⚠️ Partial — shows "Đang tải..." in tbody but no spinner animation on page load |
| **Empty** | ⚠️ Implemented in JS (`Không có dữ liệu`) but not tested against empty API response |
| **Error** | ❌ Missing — if `apiGet` fails, nothing shows; no error row |
| **Edge cases** | Table column mismatch: mock HTML rows (lines 677-733) have columns: STT, Tên đăng nhập, Email, Đơn vị, Vai trò, Trạng thái, Ngày tạo, Thao tác — but `<thead>` header only defines 7 columns. JS-generated rows use different column count. |
| **Validation** | N/A |
| **Accessibility** | No `aria-sort` on sortable columns; no `role="table"`; emoji-only buttons lack `aria-label` (some have `title`, some don't) |
| **Responsive** | `table-wrap` overflow auto works but no horizontal scroll indicators |

### S-M01-03: User Detail / Edit

| Aspect | Detail |
|--------|--------|
| **Normal** | Back button + breadcrumb; 2-column grid form with personal info, unit, group, status, timestamps |
| **Loading** | ❌ Missing — no loading state when fetching user data |
| **Empty** | N/A |
| **Error** | ❌ Missing — no error state if user ID invalid or API fails |
| **Edge cases** | "Lưu" and "Chỉnh sửa" both always enabled — no view/edit mode distinction; no "Xóa người dùng" button; no "reset password" action in detail view; disabled fields are unstyled |
| **Validation** | ❌ Missing — no client-side validation on fields; email field accepts any string; phone number accepts any format |
| **Accessibility** | No `fieldset`/`legend` grouping; no `aria-required` on required fields; error messages not connected via `aria-describedby` |

### S-M01-04: User Groups

| Aspect | Detail |
|--------|--------|
| **Normal** | Table with 5 columns (STT, Tên nhóm, Mô tả, Số thành viên, Thao tác) |
| **Loading** | ❌ Missing — no loading state |
| **Empty** | ❌ Missing — no "Không có nhóm nào" row |
| **Error** | ❌ Missing |
| **Edge cases** | Delete button 🗑 on every row has no confirmation; can't delete group with members (AC from BA spec) but no check is shown; member count has no drill-down to see who the members are |
| **Validation** | No modal form for create/edit — validation rules unknown |
| **Accessibility** | Same emoji-only accessibility issues |

### S-M01-05: Permission Matrix

| Aspect | Detail |
|--------|--------|
| **Normal** | Matrix of 5 groups × 7 functions with ✅/— indicators |
| **Loading** | ❌ Missing |
| **Empty** | N/A (always has rows) |
| **Error** | ❌ Missing — "Lưu thay đổi" has no error feedback |
| **Edge cases** | ✅ are emoji, not `<input type="checkbox">` — no keyboard toggle, no form submission; "Lưu thay đổi" has no JS handler; matrix is hardcoded, not generated from API data |
| **Validation** | N/A |
| **Accessibility** | No `role="grid"`; no keyboard navigation between cells; no `aria-checked` states |

### S-M01-06: Login Log

| Aspect | Detail |
|--------|--------|
| **Normal** | Filters (username, date range, status) + table with 5 columns |
| **Loading** | ❌ Missing |
| **Empty** | ❌ Missing — no "Không có bản ghi" state |
| **Error** | ❌ Missing |
| **Edge cases** | Date range is just two `<input type="date">` with no validation (end date < start date); no pagination controls on this screen (prototype shows only 6 rows); filters not wired to JS |
| **Validation** | Date range validation missing |
| **Accessibility** | No `aria-live` region for filter results; date inputs lack labels |

### S-M01-07: Organization Tree

| Aspect | Detail |
|--------|--------|
| **Normal** | ASCII tree rendered with `├──` and `└──` characters; monospace font |
| **Loading** | ❌ Missing |
| **Empty** | ❌ Missing — if no orgs exist, shows nothing |
| **Error** | ❌ Missing |
| **Edge cases** | Entirely static HTML — no interactive expand/collapse; no drag-drop to reparent; no inline edit; "Thêm đơn vị" button has no handler; tree depth is flat (4 levels hardcoded) |
| **Validation** | N/A |
| **Accessibility** | Monospace ASCII tree is not accessible to screen readers; no `role="tree"`/`role="treeitem"`; colors convey hierarchy but no structural markup |

### S-M01-08: TOTP Config

| Aspect | Detail |
|--------|--------|
| **Normal** | 2-column layout: instruction card + QR placeholder + 6-digit code input |
| **Loading** | ❌ Missing — no spinner while generating QR |
| **Empty** | State: "Chưa kích hoạt" badge — OK |
| **Error** | ❌ Missing — invalid 6-digit code has no error feedback |
| **Edge cases** | QR code is an emoji placeholder, not a real QR; no "disable 2FA" flow (requires admin password per spec); no recovery codes display; maxlength=6 but no validation for non-numeric input |
| **Validation** | Code must be exactly 6 digits; no check on input type="text" (should be `inputmode="numeric" pattern="[0-9]{6}"`) |
| **Accessibility** | No `aria-label` on input; no `role="alert"` for error messages |

### S-M01-09: User Registration

| Aspect | Detail |
|--------|--------|
| **Normal** | Single card form: họ tên, email, phone, unit, role, username, password, confirm password |
| **Loading** | ❌ Missing — "Gửi đăng ký" has no spinner/disabled state during submission |
| **Empty** | N/A |
| **Error** | ❌ Missing — duplicate username (409), missing fields (400), non-admin (403) all have no display |
| **Edge cases** | No password strength indicator (BR-M01-002 requires it); no client-side password match check; no debounced username uniqueness check; no email format validation |
| **Validation** | ❌ All fields required but no HTML5 `required` attribute; password: no minlength, no pattern for strength; email: type="email" present but insufficient; confirm password: no match validation |
| **Accessibility** | No `aria-describedby` linking fields to errors; no `aria-invalid` on error state |

### S-M01-10: Password Management

| Aspect | Detail |
|--------|--------|
| **Normal** | Change password form (old, new, confirm) + password history table |
| **Loading** | ❌ Missing |
| **Empty** | Password history: if empty, shows nothing |
| **Error** | ❌ Missing — wrong old password, weak new password, reused password all have no feedback |
| **Edge cases** | Password strength requirements listed in plain text but no visual indicator (progress bar); no "cannot reuse last 3 passwords" check visible; history table has no pagination |
| **Validation** | ❌ No client-side validation on any field; no minlength="8" |
| **Accessibility** | Password strength note uses `background: #fffbeb` alone to convey meaning — no icon/text alternative |

### S-M01-11 to S-M01-15: Missing screens (see Section 5)

---

## 4. Gap Analysis

### 4.1 Missing screens

| Screen | Priority | Reason |
|--------|----------|--------|
| **S-M01-11: Login** | P0 (blocking) | Entry point for all users; referenced in `login.html` — file must exist |
| **S-M01-12: Forgot Password** | P0 | Required by F-M01-003; no way for users to recover accounts |
| **S-M01-13: Reset Password** | P0 | Required by F-M01-003; token-based reset flow |
| **S-M01-14: Active Sessions** | P2 | F-M01-010; admin can view/revoke user sessions |
| **S-M01-15: Activity Log (system-wide)** | P1 | Referenced in sidebar ("Nhật ký hoạt động") but not built |

### 4.2 Missing states

| State | Where Missing |
|-------|---------------|
| **Loading spinners/skeletons** | All 10 screens — none have visual loading indicators |
| **Empty state ("Không có dữ liệu")** | User groups (S-M01-04), Login log (S-M01-06), Org tree (S-M01-07), Password history (S-M01-10) |
| **Error state (API failure)** | All screens — no error toast, alert, or inline error row |
| **Success feedback** | All forms — after save/create, no toast or success message |
| **Confirmation dialogs** | Lock/unlock (S-M01-02), delete group (S-M01-04), delete org (S-M01-07), disable 2FA (S-M01-08), delete user (S-M01-03) |
| **Form validation errors** | S-M01-03, S-M01-08, S-M01-09, S-M01-10 — no inline field errors |

### 4.3 Missing interactions

| Interaction | Where |
|-------------|-------|
| **View/Edit mode toggle** | S-M01-03 (detail/edit) — currently shows both buttons always |
| **Debounced search** | S-M01-02 — triggers on every `input` event, no debounce |
| **Pagination** | S-M01-06 (login log) — has no pagination controls |
| **Expand/collapse tree** | S-M01-07 — flat text, not interactive |
| **Modal for create/edit** | S-M01-04 (group), S-M01-07 (org) — no modal dialogs |
| **Password strength meter** | S-M01-09, S-M01-10 — only static text hint |
| **Auto-suggest / typeahead** | S-M01-02 (search) — basic input only |
| **Dropdown menu (user)** | Header avatar — no dropdown for "Đổi mật khẩu" / "Đăng xuất" |

### 4.4 Missing edge-case handling

| Edge Case | Where |
|-----------|-------|
| Column count mismatch between `<thead>` and mock rows | S-M01-02 (lines 666 vs 677-733) |
| API returns null/undefined data | All JS-driven screens — no `.filter(Boolean)` or null checks |
| Session expiry (401) | Handled globally but no "Phiên hết hạn" toast — just silent redirect |
| Concurrent edit conflicts | S-M01-03 — no optimistic locking or stale-data warning |
| Network offline | No offline detection or "Không có kết nối mạng" message |
| Rate-limited login | S-M01-11 — no "Thử lại sau X phút" feedback |

---

## 5. Screen Composition (New Screens)

### S-M01-11: Login Screen

```
┌─────────────────────────────────────────────┐
│  [MTIS Logo]                                │
│                                             │
│  MTIS — Hệ thống quản lý KCHT Hàng hải      │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  ĐĂNG NHẬP                          │    │
│  │                                     │    │
│  │  Tên đăng nhập  [________________]  │    │
│  │                                     │    │
│  │  Mật khẩu       [________________]  │    │
│  │                                     │    │
│  │  [ ] Ghi nhớ đăng nhập             │    │
│  │                                     │    │
│  │  [⚠️] Sai tên đăng nhập hoặc        │    │
│  │       mật khẩu (còn 3 lần thử)     │    │
│  │                                     │    │
│  │  ┌─────────────────────────────┐    │    │
│  │  │       ĐĂNG NHẬP             │    │    │
│  │  └─────────────────────────────┘    │    │
│  │                                     │    │
│  │  Quên mật khẩu?                     │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  © Cục Hàng hải Việt Nam                    │
└─────────────────────────────────────────────┘
```

**Fields:**
- Tên đăng nhập: `<input type="text" required autocomplete="username">`
- Mật khẩu: `<input type="password" required autocomplete="current-password">`
- Ghi nhớ đăng nhập: `<input type="checkbox">` (persist refresh token)

**Validation:**
- Both fields required (HTML5 validation)
- Max 5 attempts / 15min — after 5, button disabled with countdown timer

**States:**
- **Normal:** Empty fields, button enabled
- **Error (invalid credentials):** Red inline error message + remaining attempts counter
- **Error (locked account):** Red box: "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên."
- **Error (rate-limited):** "Quá nhiều lần thử. Vui lòng thử lại sau 12:34 phút."
- **Loading:** Button shows spinner, inputs disabled
- **Success:** Redirect to dashboard

**Accessibility:**
- `aria-describedby` on error message
- `aria-invalid` on error fields
- `aria-live="polite"` on error container
- Focus auto-trap on error field

---

### S-M01-12: Forgot Password Screen

```
┌─────────────────────────────────────────────┐
│  QUÊN MẬT KHẨU                             │
│                                             │
│  Nhập email đã đăng ký để nhận link         │
│  đặt lại mật khẩu.                          │
│                                             │
│  Email         [_________________________]  │
│                                             │
│  [✔️] Link đặt lại mật khẩu đã được gửi     │
│       đến email của bạn.                    │
│                                             │
│  ┌─────────────────────────────┐            │
│  │     GỬI YÊU CẦU            │            │
│  └─────────────────────────────┘            │
│                                             │
│  ← Quay lại đăng nhập                       │
└─────────────────────────────────────────────┘
```

**Fields:**
- Email: `<input type="email" required>`

**Validation:**
- Valid email format
- Email exists in system (check on blur with debounce)

**States:**
- **Normal:** Email input, button enabled
- **Loading:** Button spinner, inputs disabled
- **Success:** Success message shown (no indication if email exists — security best practice)
- **Error (invalid email):** "Email không hợp lệ"
- **Error (network):** "Không thể gửi yêu cầu. Vui lòng thử lại."

---

### S-M01-13: Reset Password Screen

```
┌─────────────────────────────────────────────┐
│  ĐẶT LẠI MẬT KHẨU                          │
│                                             │
│  [Token from URL]                           │
│                                             │
│  Mật khẩu mới     [______________________]  │
│  ████████████░░░░░░ 6/8                     │
│                                             │
│  Xác nhận mật khẩu [______________________] │
│                                             │
│  Yêu cầu: ≥ 8 ký tự, chữ hoa, chữ thường,  │
│  số và ký tự đặc biệt                       │
│                                             │
│  ❌ Mật khẩu không khớp                     │
│                                             │
│  ┌─────────────────────────────┐            │
│  │     ĐẶT LẠI MẬT KHẨU       │            │
│  └─────────────────────────────┘            │
│                                             │
│  ← Quay lại đăng nhập                       │
└─────────────────────────────────────────────┘
```

**Fields:**
- Mật khẩu mới: `<input type="password" required minlength="8" pattern="...">`
- Xác nhận mật khẩu: `<input type="password" required>`

**Validation:**
- Password strength (min 8 chars, upper, lower, digit, special)
- Password confirmation match
- Token not expired (checked on page load)
- Cannot reuse last 3 passwords (checked on submit)

**States:**
- **Loading (token check):** Full-page spinner while validating token
- **Token invalid/expired:** "Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu lại."
- **Normal:** Form active
- **Error:** Inline field errors
- **Success:** "Mật khẩu đã được đặt lại thành công. Chuyển hướng đến đăng nhập..."
- **Loading (submit):** Button spinner

---

### S-M01-14: Active Sessions

```
┌─────────────────────────────────────────────┐
│  Quản lý phiên đăng nhập                    │
│  > M01 / Phiên đăng nhập                    │
│                                             │
│  ┌─── Current session ──────────────────┐   │
│  │  Thiết bị hiện tại                    │   │
│  │  Chrome trên macOS                    │   │
│  │  IP: 192.168.1.45                     │   │
│  │  Đăng nhập: 08:32 — hôm nay           │   │
│  │  [Đang hoạt động]                     │   │
│  └────────────────────────────────────────┘  │
│                                             │
│  ┌─── Other sessions ───────────────────┐   │
│  │  Firefox trên Windows                 │   │
│  │  IP: 118.70.x.x  |  15/05/2026       │   │
│  │  [Thu hồi]                            │   │
│  ├────────────────────────────────────────┤  │
│  │  Safari trên iOS                       │   │
│  │  IP: 118.70.x.x  |  10/05/2026       │   │
│  │  [Thu hồi]                            │   │
│  └────────────────────────────────────────┘  │
│                                             │
│  Giới hạn: tối đa 5 phiên đồng thời         │
└─────────────────────────────────────────────┘
```

**Features:**
- Current session highlighted (cannot be revoked)
- List of other active sessions with device, IP, last active time
- "Thu hồi" button with confirmation dialog per session
- Warning when approaching limit (4/5 sessions)

---

### S-M01-15: System Activity Log (wireframe placeholder)

```
┌─────────────────────────────────────────────┐
│  Nhật ký hoạt động hệ thống                 │
│                                             │
│  [Từ ngày] [Đến ngày] [Hành động ▼] [Lọc]  │
│                                             │
│  ┌─── Table ────────────────────────────┐   │
│  │ Thời gian | Người dùng | Hành động   │   │
│  │           |            | Chi tiết    │   │
│  │━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│   │
│  │ 08:32 ... | Nguyễn Văn A | Đăng     │   │
│  │           |             | nhập      │   │
│  │ 08:30 ... | Nguyễn Văn A | Sửa user │   │
│  │           |             | ID=12     │   │
│  └────────────────────────────────────────┘  │
│  [Pagination: 1 2 3 ... 15]                  │
└─────────────────────────────────────────────┘
```

---

## 6. Accessibility Audit (Existing HTML)

### Critical Issues (Must Fix)

| # | Issue | Location | Screen |
|---|-------|----------|--------|
| A1 | Emoji-only buttons without `aria-label` | All `✎`, `🔒`, `🔓`, `🗑`, `🚪` buttons | S01-02 through S01-10 |
| A2 | No `<label>` for search inputs | Search bars use placeholder only | S-M01-02, S-M01-06 |
| A3 | ASCII tree not accessible to screen readers | Monospace text with `├──` characters | S-M01-07 |
| A4 | Color-only status indicators | Badge classes use background+color without icon or text equivalent | All screens |
| A5 | No `role="table"` or `aria-label` on data tables | All `<table>` elements | All screens |
| A6 | No `aria-live` region for dynamically loaded content | User table loaded via JS, no announcement | S-M01-02 |
| A7 | No skip-to-content link | Entire page | All screens |
| A8 | Modal overlay not focus-trapped | No `aria-modal="true"`, no keyboard trap | S-M01-03 (future) |

### Medium Issues

| # | Issue | Location |
|---|-------|----------|
| B1 | No `aria-current="page"` on active sidebar menu item | Sidebar |
| B2 | Breadcrumb `<a>` tags have no `href` — they're not navigable | All breadcrumbs |
| B3 | No `fieldset`/`legend` on forms | S-M01-03, S-M01-09, S-M01-10 |
| B4 | Required fields indicated by red `*` only — no `aria-required` | All forms |
| B5 | No `aria-describedby` linking inputs to their error messages | All forms |
| B6 | Tab order not verified — static inline elements may break flow | Throughout |
| B7 | No `prefers-reduced-motion` support | CSS transitions on hover |

### Recommendations

1. **Replace all emoji buttons** with `<button aria-label="Chỉnh sửa">✎</button>`
2. **Add `<label>` elements** with `for` attribute to all inputs
3. **Wrap data tables** in `<div role="region" aria-label="...">` and add `role="table"` with `aria-colcount`
4. **Add `aria-live="polite"`** to tbody containers that are updated dynamically
5. **Replace ASCII tree** with `<ul role="tree">` + `<li role="treeitem">` structure
6. **Add skip link** as first focusable element: `<a href="#main-content" class="skip-link">Bỏ qua điều hướng</a>`
7. **Add `aria-modal="true"` and focus trapping** to any modal overlay
8. **Add `aria-hidden="true"`** to decorative icons in menu items
9. **Increase color contrast** on stat-card border-left colors against card white background (warning #d97706 on white = 2.7:1, fails WCAG AA)

---

## 7. Recommendations for SA & Developer

### UI Architecture Decisions Needed

1. **Design system extraction:** The prototype uses inline CSS in a single file. For production, extract into a shared `design-system.css` (CSS vars already exist — `--color-*`, `--radius-*`, etc.).

2. **SPA routing:** Current prototype stacks all screens vertically. Use hash-based routing (`#user-list`, `#detail/123`) or a simple JS router to show one screen at a time.

3. **State management:** Current JS uses `window.mtisUser` and `window.apiGet` globals. Add a simple tri-state store (loading / error / data) per screen.

### Implementation Priority

| Priority | Items |
|----------|-------|
| **P0 — Must ship** | S-M01-11 Login, S-M01-12 Forgot Password, S-M01-13 Reset Password; Form validation on all screens; Loading/empty/error states on S-M01-02; Confirmation dialogs for destructive actions |
| **P1 — High value** | Debounced search (S-M01-02); Interactive org tree (S-M01-07); TOTP QR code (S-M01-08); Password strength meter (S-M01-09, S-M01-10); Accessibility fixes A1-A4 |
| **P2 — Polish** | All empty states; Toast notifications; Responsive hamburger menu; Multi-session management (S-M01-14); Activity log (S-M01-15) |

### Key Changes to the HTML Prototype

1. **Fix column mismatch in user table** — `<thead>` has 7 columns but mock `<tbody>` rows have 8 columns (extra "Đơn vị" + "Ngày tạo")
2. **Replace emoji checkmarks with real checkboxes** in permission matrix
3. **Add `inputmode="numeric" pattern="[0-9]{6}"`** to TOTP code input
4. **Convert static tree to interactive `<ul>` tree** with JS expand/collapse
5. **Add `disabled` state to submit buttons** during API calls to prevent double-submit
6. **Extract all hardcoded data** into JS variables so it can be swapped for real API calls
