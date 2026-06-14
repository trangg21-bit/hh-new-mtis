---
feature-id: F-M01-004
stage: design-review
agent: engineering-ui-ux-designer
verdict: Pass
last-updated: "2026-06-14"
---

# Designer Report: F-M01-004 — Layout Redesign: Search Bar + Add Button Row

## Scope

Redesign the **"Thêm người dùng vào nhóm" modal header area** in `showMembersModal()` (`groups.js`). The PO has identified two layout issues:

1. **Label text truncation:** The label "Thêm người dùng — nhóm {groupName}" is being cut off on the screen.
2. **Button placement:** The "Thêm vào nhóm" button sits in a separate row below the selected tags area, creating unnecessary whitespace on the right side.

**Goal:** Place the search input and "Thêm" button on the **same horizontal row** (button right-aligned). Ensure the label displays fully without truncation.

---

## Design Findings

### Finding 1: Label "Thêm người dùng — nhóm X" bị cụt (truncated)
- **Severity: High**
- **UX Impact:** The label "Thêm người dùng — nhóm {groupName}" is displayed on line 196 of `groups.js`. The label uses `font-size:var(--font-size-xs)` (12px) and `color:var(--color-muted)`. While no explicit `white-space: nowrap` or `max-width` constraint exists on the label itself, the parent container `<div style="margin-bottom:16px;position:relative">` provides no width constraint either. The truncation is likely caused by **the modal body overflow behavior** — the `.modal-body` has `overflow-y: auto` (screens.css line 281) but no explicit horizontal overflow handling. When the modal is narrow and the group name is long, the label text wraps and may appear visually truncated or misaligned.
- **Evidence:** `groups.js` line 196:
  ```html
  <label for="member-autocomplete" style="font-size:var(--font-size-xs);color:var(--color-muted);margin-bottom:4px;display:block">Thêm người dùng — nhóm ${esc(name)}</label>
  ```
  No `word-wrap: break-word`, no `overflow-wrap: break-word`, no `max-width` constraint. The label is a `display:block` element inside a `position:relative` container with no width specified.
- **Recommendation:** 
  - Add `overflow-wrap: break-word` and `word-break: break-word` to the label inline style (or define a CSS class).
  - Alternatively, restructure so the label is a separate section above the search+button row, giving it independent width constraints.

### Finding 2: Button "Thêm vào nhóm" in separate row below search area
- **Severity: High**
- **UX Impact:** Lines 205-209 of `groups.js` place the add button in a **separate `<div>`** that sits after the selected tags area (`#selected-users`). This creates a 3-row layout:
  1. Search input
  2. Selected tags
  3. Add button (right-aligned, separate row)
  
  The PO wants the button to be **on the same row as the search input, right-aligned**, creating a compact 2-row layout:
  1. Search input (left) + Add button (right)
  2. Selected tags (below)
  
  This eliminates the whitespace gap between tags and button, making the modal more compact and visually balanced.
- **Evidence:** `groups.js` lines 195-209:
  ```html
  <!-- Row 1: Label + Search -->
  <div style="margin-bottom:16px;position:relative">
    <label ...>Thêm người dùng — nhóm ${esc(name)}</label>
    <input ... placeholder="Tìm kiếm..." style="width:100%">
  </div>
  <!-- Row 2: Selected tags -->
  <div id="selected-users" ... style="margin-bottom:16px">...</div>
  <!-- Row 3: Add button (separate row!) -->
  <div style="display:flex;justify-content:flex-end;align-items:center;gap:8px">
    <span id="add-members-label">...</span>
    <button class="btn btn-primary" id="add-members-btn" ...>Thêm vào nhóm</button>
  </div>
  ```
- **Recommendation:** Restructure to place search input and add button on the **same flex row**, with the search input taking remaining space (`flex:1`) and the button fixed-width on the right.

---

## Flow Issues

### Dead-end: No visual connection between selection and action
- **Issue:** The current 3-row layout (search → tags → button) visually disconnects the user's selection action from the final submit action. The user selects tags, then their eye must travel down past another section to find the "Thêm vào nhóm" button.
- **Recommendation:** By placing the button on the same row as the search input, the user's eye path is shortened: search/select → button, with tags serving as the visual feedback between them.

### Missing: Quick-add interaction
- **Issue:** When a user selects a user from the dropdown, the tag appears, but the button stays on a separate row. There is no quick-add visual cue that the selection is complete and ready to submit.
- **Recommendation:** The new layout (search+button same row) creates a visual "action bar" at the top, making it clear that clicking the button will act on the currently selected tags.

---

## Consistency Issues

### Issue 1: Add button label length vs. other modals
- **Current:** "Thêm vào nhóm" (3 words, long)
- **Other modals:** `groups.js` line 107 uses "Lưu" (save), "Cập nhật" (update); line 27 uses "Thêm nhóm" (add group).
- **Recommendation:** Shorten to **"Thêm"** (as in the original design) to match the concise button naming used throughout the codebase. The context is already clear — the user is in the "members" modal for a specific group.

### Issue 2: Label font size vs. standard form labels
- **Current:** `font-size:var(--font-size-xs)` (12px) on line 196
- **Standard (theme-tokens.css line 399):** `font-size:var(--font-size-sm)` (13px) for `.form-group label`
- **Recommendation:** Use `var(--font-size-sm)` (13px) and `var(--color-heading)` for the search area label to match standard form label styling. This also helps with the truncation issue — a slightly larger font with proper word-break will render more predictably.

### Issue 3: Inconsistent gap spacing
- **Current:** `gap:8px` on the add button row (line 206), `gap:6px` on tags container (line 204)
- **Design system (theme-tokens.css line 523-528):** `.gap-2` = 8px, `.gap-3` = 12px, `.gap-4` = 16px
- **Recommendation:** Standardize to use `gap: 8px` (`.gap-2` equivalent) for the search+button row to maintain visual consistency.

---

## Accessibility / Basic Usability Notes

| # | Issue | Severity |
|---|-------|----------|
| **A1** | Search label text may be truncated for long group names (e.g., "Nhóm quản trị viên cấp cao hệ thống MTIS"). Screen reader may not announce the full group context. | **High** |
| **A2** | The label is for `member-autocomplete` but uses `display:block` which makes it a standalone block. If the label text wraps, the search input will not be visually associated with the label. | **Medium** |
| **A3** | Add button disabled state (`disabled` attribute) has no visible CSS styling defined for the `disabled` state. On some browsers, the button retains its blue color but becomes unclickable. | **Medium** |

---

## Suggested Improvements

### Quick Wins (CSS-only or minimal inline style changes)
1. **Restructure search+button into a flex row** — moves button to the same row as search input (PO requirement).
2. **Add `overflow-wrap: break-word` to the label** — prevents text truncation for long group names.
3. **Shorten button text to "Thêm"** — matches codebase conventions, reduces horizontal space needed.
4. **Add `:disabled` CSS for `.btn-primary`** — `opacity: 0.5; cursor: not-allowed`.

### Planned (JS logic changes)
1. **Update button text dynamically:** Show "Thêm (N)" when N users selected (e.g., "Thêm (3)").
2. **Auto-focus the search input** on modal open (already done via `autofocus`, but ensure it works after the new layout).
3. **Clear search input on tag selection** — already implemented on line 313, verify it still works with new layout.

---

## Screen Composition Spec (Updated)

### Screen: Members Modal — Search + Button Row (New Layout)

| Property | Value |
|----------|-------|
| **Type** | Modal dialog (non-scrolling, fixed overlay) |
| **Parent screen** | S-M01-04 User Groups (click "Thành viên" on any group row) |
| **Size** | `modal-card modal-lg` → `max-width: 760px` |
| **Close methods** | ✕ button, overlay click |

#### New Layout Structure (top-to-bottom)

```
┌──────────────────────────────────────────────────────┐
│  Người dùng — Admin                                ✕ │  ← Modal header
├──────────────────────────────────────────────────────┤
│                                                      │
│  Thêm người dùng — nhóm Admin                        │  ← Full label, word-wrap
│  ┌───────────────────────────┬──────────────┐       │  ← ROW 1: Search + Button
│  │ 🔍 Tìm kiếm họ tên...     │  [Thêm (3)]  │       │  ← flex row, search flex:1
│  └───────────────────────────┴──────────────┘       │
│                                                      │  ← ROW 2: Selected tags
│  [Nguyễn Văn A ×] [Trịnh Thị B ×] [Lê Thị C ×]      │
│                                                      │
├──────────────────────────────────────────────────────┤
│  ID  │ Username │ Họ tên │ Email │ Vai trò │ Thao tác│  ← Members table
│  ────┼──────────┼────────┼───────┼─────────┼─────────│
│  1   │ admin    │ ...    │ ...   │ Admin   │ 🗑       │
└──────────────────────────────────────────────────────┘
```

#### Component Mapping

| # | Component | Design System Source | Changes Required |
|---|-----------|---------------------|-----------------|
| 1 | Modal overlay | screens.css `.modal-overlay` | None |
| 2 | Modal card (modal-lg) | screens.css `.modal-card.modal-lg` | None |
| 3 | Modal header | screens.css `.modal-header` + `.modal-close` | None |
| 4 | Search label | **New inline styling** (see CSS spec below) | Added `overflow-wrap: break-word` |
| 5 | Search wrapper div | **New flex row** | Replaces individual search div + button div |
| 6 | Search input | theme-tokens.css `.form-control` | `flex:1` added |
| 7 | Add button | app.css `.btn.btn-primary` | Reduced to "Thêm", width auto |
| 8 | Selected tags container | theme-tokens.css utilities (`flex`, `gap-2`) | Moved above button row |
| 9 | Members table | screens.css `.ant-table` | None |
| 10 | Toast | screens.css `.toast-*` | None |
| 11 | Spinner | app.css `.spinner` | Reused for button loading |

#### Gap Analysis

| Gap | Justification |
|-----|---------------|
| **Search+button flex row** | No existing "inline search + action button" row pattern in the catalog. The existing `.search-bar` (theme-tokens.css line 451) uses `gap:12px` but doesn't have the input taking full remaining space with a fixed-width action button. A new `.search-action-row` pattern is needed. |
| **Dynamic button label "Thêm (N)"** | No existing counter pattern for button labels. Requires JS logic update to show selection count. |

---

## Suggested CSS Component Definitions (for implementation)

```css
/* === NEW: SEARCH + ACTION ROW (replaces separate search + button sections) === */

.search-action-row {
  display: flex;
  align-items: flex-start;    /* flex-start to allow label above to sit independently */
  gap: 8px;
  margin-bottom: 12px;
}

.search-action-row .search-wrapper {
  flex: 1;                     /* Search takes remaining space */
  min-width: 0;                /* Prevent flex overflow */
}

.search-action-row .search-label {
  display: block;
  font-size: var(--font-size-sm);  /* 13px — matches standard form labels */
  color: var(--color-heading);
  margin-bottom: 4px;
  /* Prevent text truncation — allow wrapping for long group names */
  overflow-wrap: break-word;
  word-break: break-word;
  hyphens: auto;
}

.search-action-row .search-input-wrapper {
  position: relative;
}

.search-action-row .search-input-wrapper .search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: var(--color-muted-light);
  pointer-events: none;
  z-index: 1;
}

.search-action-row .search-input-wrapper .form-control {
  padding-left: 32px;
  height: 36px;                /* Match button height */
}

/* === ADD BUTTON (right side of search row) === */

.search-action-row .add-action-btn {
  flex-shrink: 0;              /* Never shrink below content width */
  height: 36px;
  padding: 0 20px;
  font-size: var(--font-size-sm);
  white-space: nowrap;
  min-width: 70px;             /* Ensure button is always visible */
}

/* Disabled state for primary button */
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* === SELECTED TAGS ROW === */

.selected-tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  min-height: 32px;
  margin-bottom: 16px;
}

/* === BUTTON LOADING STATE === */

.btn-loading {
  pointer-events: none;
  opacity: 0.8;
}

.btn-loading .spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  margin-right: 6px;
  vertical-align: middle;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

## HTML Structure Changes (for implementation)

### Current (3 rows)
```html
<!-- Row 1: Label + Search -->
<div style="margin-bottom:16px;position:relative">
  <label for="member-autocomplete" style="font-size:var(--font-size-xs);...">
    Thêm người dùng — nhóm ${esc(name)}
  </label>
  <input type="text" class="form-control" id="member-autocomplete" ... style="width:100%">
</div>
<!-- Row 2: Tags -->
<div id="selected-users" style="margin-bottom:16px">...</div>
<!-- Row 3: Button (separate!) -->
<div style="display:flex;justify-content:flex-end">
  <button class="btn btn-primary" id="add-members-btn" disabled>Thêm vào nhóm</button>
</div>
```

### New (2 rows)
```html
<!-- ROW 1: Search + Button (same row, flex) -->
<div class="search-action-row">
  <div class="search-wrapper">
    <label for="member-autocomplete" class="search-label">
      Thêm người dùng — nhóm ${esc(name)}
    </label>
    <div class="search-input-wrapper">
      <span class="search-icon" aria-hidden="true">🔍</span>
      <input type="text" class="form-control" id="member-autocomplete"
             autocomplete="off" placeholder="Tìm kiếm họ tên, username, email..."
             aria-expanded="false" aria-controls="member-suggestions">
    </div>
  </div>
  <button class="btn btn-primary add-action-btn" id="add-members-btn"
          disabled aria-label="Thêm người dùng đã chọn vào nhóm">
    Thêm
  </button>
</div>

<!-- ROW 2: Selected tags -->
<div id="selected-users" class="selected-tags-row" aria-live="polite">...</div>
```

---

## Screen Fidelity Spec

### Screen 1: Members Modal — Layout Overview (New Design)

**Source:** `groups.js` `showMembersModal()` function (line 146)

**Layout type:** Centered modal, `modal-lg` (760px max-width)

```
┌──────────────────────────────────────────────────────────────┐
│  Người dùng — Nhóm Quản Trị Viên Cấp Cao MTIS              ✕ │
│                                                          ✕   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Thêm người dùng — Nhóm Quản Trị Viên Cấp Cao MTIS          │
│  ┌─────────────────────────────────┬──────────────┐        │
│  │ 🔍 Tìm kiếm họ tên, username.. │  [Thêm]     │ ← ROW 1 │
│  └─────────────────────────────────┴──────────────┘        │
│                                                              │
│  [Nguyễn Văn A ×] [Trịnh Thị B ×]                          │ ← ROW 2
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ ID │ Username   │ Họ tên        │ Email        │ Vai trò │  │
│    │            │               │              │         │  │
│ 1  │ admin      │ Admin System  │ admin@mtis   │ Admin   │  │
│ 2  │ ntb        │ Nguyễn Thị B  │ ntb@mtis     │ Viewer  │  │
│    │            │               │              │         │  │
└──────────────────────────────────────────────────────────────┘
```

**Fields:**

| Label | Type | Required | Placeholder | Validation |
|-------|------|----------|-------------|------------|
| "Thêm người dùng — nhóm {X}" | `<label>` text | Yes | N/A | `overflow-wrap: break-word` |
| Search input | `<input type="text">` | No | "Tìm kiếm họ tên, username, email..." | Filters from loaded user list |
| "Thêm" button | `<button class="btn btn-primary">` | Conditional | N/A | `disabled` when no users selected |

**Actions:**

| Label | Type | Position | Visibility |
|-------|------|----------|------------|
| "Thêm" button | Submit | Right side of ROW 1 | Always present; disabled when `selectedUsers.size === 0` |
| Tag × remove | Deselect | Inside each tag | Only when tags exist |
| ✕ close | Cancel | Top-right header | Always visible |

**Visual notes:**
- Row 1 uses `display: flex; gap: 8px; align-items: flex-start;`
- Search wrapper has `flex: 1; min-width: 0` to prevent overflow
- Search input height: `36px` to match button height
- Button: `flex-shrink: 0; min-width: 70px; white-space: nowrap`
- Label: `font-size: 13px; color: #374151 (var(--color-heading)); overflow-wrap: break-word`
- Tags row: `flex-wrap: wrap; gap: 6px; min-height: 32px`

**States visible in image:** Default layout (empty search, no tags, disabled button).
**States NOT visible:** Search results dropdown, selected tags, button loading, success/error toasts.

### Screen 2: Members Modal — With Selections

**Layout:** Same as Screen 1, but with populated tags and enabled button

```
┌──────────────────────────────────────────────────────────────┐
│  Người dùng — Nhóm Quản Trị Viên Cấp Cao MTIS              ✕ │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Thêm người dùng — Nhóm Quản Trị Viên Cấp Cao MTIS          │
│  ┌─────────────────────────────────┬────────────────┐       │
│  │ 🔍 (empty, input cleared)      │  [Thêm (3)]   │ ← Enabled │
│  └─────────────────────────────────┴────────────────┘       │
│                                                              │
│  [Nguyễn Văn A ×] [Trịnh Thị B ×] [Lê Thị C ×]              │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ (members table with 2 existing members)                      │
└──────────────────────────────────────────────────────────────┘
```

**Visual notes:**
- Button text dynamically shows count: `"Thêm (${count})"` or `"Thêm"`
- Button color: `#2153aa` (primary blue)
- Tags: `background: #eff8ff; border: 1px solid rgba(33,83,170,0.12); color: #2153aa`
- Tags radius: `999px` (pill shape)

**States visible:** 3 selected users, enabled button with count, empty search input.

### Screen 3: Members Modal — Long Group Name (Truncation Test)

**Layout:** Same as Screen 1, testing label rendering with very long group name

```
┌──────────────────────────────────────────────────────────────┐
│  Người dùng — Nhóm Quản Trị Viên Cấp Cao                     │
│           Hệ Thống Quản Lý MTIS                              │
│                                                          ✕   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Thêm người dùng — Nhóm Quản Trị Viên Cấp Cao               │ ← Label wraps
│           Hệ Thống Quản Lý MTIS                              │
│  ┌─────────────────────────────────┬──────────────┐        │
│  │ 🔍 Tìm kiếm...                  │  [Thêm]     │          │
│  └─────────────────────────────────┴──────────────┘          │
│                                                              │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ (members table)                                              │
└──────────────────────────────────────────────────────────────┘
```

**Visual notes:**
- Label text wraps naturally with `overflow-wrap: break-word` and `word-break: break-word`
- Label height increases from 1 line to 2 lines
- Search+button row stays on a single line
- No text truncation or `...` ellipsis
- The label is still associated with the search input via `for="member-autocomplete"`

---

## Visual Notes

| Property | Value |
|----------|-------|
| **Search+button row gap** | `8px` |
| **Search input height** | `36px` (matches button) |
| **Button height** | `36px` |
| **Button min-width** | `70px` |
| **Button padding** | `0 20px` |
| **Button font-size** | `var(--font-size-sm)` (13px) |
| **Button border-radius** | `var(--radius-btn)` (6px) |
| **Label font-size** | `var(--font-size-sm)` (13px) |
| **Label color** | `var(--color-heading)` (#374151) |
| **Label word-wrap** | `break-word` |
| **Search icon position** | `left: 10px; top: 50%; transform: translateY(-50%)` |
| **Search input padding-left** | `32px` (for icon) |
| **Tags gap** | `6px` |
| **Tags padding** | `4px 10px` |
| **Tags border-radius** | `999px` |
| **Tags font-size** | `var(--font-size-sm)` (13px) |
| **Modal body top margin** | `16px` (after header) |
| **Modal body bottom margin** | `20px` (before table) |
| **Section margins** | `12px` between search-row and tags |

---

## Assumptions / Verification Needed

1. **Assumption:** The `modal-lg` width (760px) is sufficient to accommodate the search input + button on one row without wrapping. **Verify:** Test on smallest expected modal viewport (760px width).
2. **Assumption:** Button text "Thêm" is sufficient context for the user. The modal header already says "Người dùng — {groupName}" so the action is unambiguous. **Verify:** PO confirmation on shortened label.
3. **Assumption:** Dynamic button counter "Thêm (N)" is preferred over static "Thêm". **Verify:** PO preference.
4. **Assumption:** The label should wrap (not truncate with ellipsis) for long group names. **Verify:** PO preference — ellipsis could be cleaner for very long names.
5. **Assumption:** No additional CSS file is needed — all styling will use existing design system tokens (`--color-*`, `--font-size-*`, `--radius-*`). **Verified:** CSS spec provided above uses only existing tokens.

---

## Summary of Changes for Developer

| Change | Location | Type | Effort |
|--------|----------|------|--------|
| Restructure search + button into single flex row | `groups.js` line 195-209 | HTML | 15 min |
| Add `overflow-wrap: break-word` to label | `groups.js` inline style | CSS | 2 min |
| Shorten button text from "Thêm vào nhóm" to "Thêm" | `groups.js` line 208 | HTML/JS | 1 min |
| Add `:disabled` CSS for `.btn-primary` | `screens.css` | CSS | 3 min |
| Dynamic button label "Thêm (N)" | `updateSelectedTags()` JS function | JS | 5 min |
| Update suggestion box z-index to `10` (ensure above tags) | `groups.js` inline style | CSS | 1 min |
| Button loading state (spinner + "Đang thêm...") | `addBtn.addEventListener` | JS | 5 min |

Total estimated effort: **~32 minutes**
