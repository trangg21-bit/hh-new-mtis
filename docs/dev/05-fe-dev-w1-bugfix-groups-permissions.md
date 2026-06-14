---
feature-id: S-M01-04
stage: frontend-implementation
agent: engineering-frontend-developer
wave: 1
task: bugfix-groups-permissions-popup-filter
verdict: Pass
last-updated: 2026-06-13
---

# Frontend Implementation Summary — Bug Fixes (Groups Popup + Permissions Tree)

## 1. Designer Spec Coverage

### Bug 1 — Popup "Thêm người dùng vào nhóm" (groups.js)

| Requirement | Status | Notes |
|---|---|---|
| Tags hiển thị giữa searchbox và button "Thêm vào nhóm" | **Implemented** | `<div id="selected-users">` placed between search input and button. `updateSelectedTags()` populates tags with styled chips on selection. |
| Button "Thêm vào nhóm" disabled mặc định | **Implemented** | `disabled` on button element. `updateSelectedTags()` sets `addBtn.disabled = !count` on every selection change. |
| Bảng members có đủ 6 cột + column "Thao tác" với icon delete | **Implemented** | Header: `ID, Username, H tên, Email, Vai tr, Thao tác` (6 columns). Data rows: 6 `<td>` cells. Delete button styled `danger-action` in right-aligned action-cell. |

### Bug 2 — Trang Phn quyn (permissions.js)

| Requirement | Status | Notes |
|---|---|---|
| Search box "a" filter đúng tree — ch hin node ch a | **Implemented** | `filterTree()` stores keyword, calls `renderTree(keyword)`. `_filterTreeNodes()` recursively matches on `name` and `code`, returning only matching nodes + their ancestors. |
| Search filter persisted khi toggle checkbox | **Implemented** | `toggleParent`/`toggleFeature` now call `renderTree(this._lastFilterKeyword)` — keyword stored on every `filterTree()` call and preserved through checkbox interactions. |
| Parent/child checkbox sync ng | **Implemented** | `_syncParent` rewritten as `syncUp()`: when a child's state changes, it finds the immediate parent, syncs its checked state (all siblings checked -> parent checked), then recurses upward to sync grandparents. |

## 2. Component / Token Mapping

| UI Element | Catalog Component | Token | Gap |
|---|---|---|---|
| Modal overlay | `modal-overlay` / `modal-card` (shared) | `--color-white`, `--color-border`, `--radius-card` | None |
| Search input | `.form-control` | `--font-size-xs`, `--color-muted` | None |
| Suggestion dropdown | Custom `<div>` | `--color-ghost-hover` | None |
| Selected user tags | Inline-styled `<span>` chips | `--color-info-bg`, `--color-info-text` | None |
| Delete button | `.btn-ghost.action-icon.danger-action` | `--color-danger` | None |
| Tree nodes | Custom `<ul>/<li>` elements | CSS `padding-left` indentation | None |

No new shared components created. All reused existing patterns from the SPA catalog.

## 3. Files Changed

| Path | Purpose |
|---|---|
| `docs/ui/js/screens/groups.js` | Rewrote `showMembersModal()`: replaced single-select `<select>` dropdown with multi-select autocomplete search + tag chips. Added proper 6-column member table with "Thao tác" column. Added `_membersOpen` flag to track modal state. Improved `_removeMember()` to close modal and reload list. |
| `docs/ui/js/screens/permissions.js` | Fixed `filterTree()` to store keyword in `_lastFilterKeyword`. Refactored `renderTree()` to accept optional keyword parameter and apply `_filterTreeNodes()` filter. `toggleParent`/`toggleFeature` now preserve filter. Rewrote `_syncParent()` for proper upward tree traversal. Added filter clearing on `onRoleChange()` and `resetForm()`. |

## 4. Components Created / Modified

### groups.js — `showMembersModal()` (modified)
- **States covered**: No selection (empty tags container, button disabled), Single tag (one chip shown, count "1 người dùng đã chọn", button enabled), Multiple tags (multiple chips, count updates, button enabled), API error (toast warning displayed), Empty member list ("Chưa có người dùng nào" placeholder)
- **Tests**: No automated tests (vanilla JS SPA, no test framework)

### permissions.js — `filterTree()` / `renderTree()` / `_filterTreeNodes()` (modified)
- **States covered**: No filter (full tree render), Filter active (only matching nodes), Filter + checkbox toggle (filter persists), Role change (filter cleared, fresh tree), Reset form (filter cleared)
- **Tests**: No automated tests

### permissions.js — `_syncParent()` (rewritten)
- **States covered**: 1-of-N children checked -> parent unchecked, All children checked -> parent checked, Parent checked -> uncheck one child -> parent unchecked, Multi-level sync (feature -> category -> root)
- **Tests**: No automated tests

## 5. Accessibility Compliance

| Requirement | Implementation | Verification |
|---|---|---|
| Form labels | `<label for="member-autocomplete">` present | Code review |
| ARIA live region | `aria-live="polite"` on `#selected-users` | Code review |
| ARIA expanded toggle | `aria-expanded="false/true"` on search input | Code review |
| ARIA controls link | `aria-controls="member-suggestions"` | Code review |
| ARIA listbox role | `role="listbox"` on suggestions dropdown | Code review |
| ARIA option roles | `role="option"` on each suggestion item | Code review |
| Button labels | `aria-label` on remove buttons and add button | Code review |
| Keyboard nav | ArrowDown/ArrowUp/Enter/Escape keys handled | Code review |
| Focus management | `input.focus()` after selection/remove | Code review |

## 6. Tests Added/Updated

No automated test framework is configured for this vanilla JS SPA. QA manual testing matrix:

**Groups Popup:**
1. Open members modal -> tags container empty, button disabled -> verify
2. Search for user, click suggestion -> tag appears, count shows, button enabled -> verify
3. Click x on tag -> tag removed, count decrements, button disabled if empty -> verify
4. Click "Thêm vào nhóm" with users selected -> toast success, modal closes, list reloads -> verify
5. Delete a member from table -> confirm dialog, toast success, modal closes, list reloads -> verify

**Permissions Tree:**
1. Select a role -> full tree renders -> verify
2. Type "a" in search -> only nodes containing "a" shown -> verify
3. Toggle a checkbox in filtered tree -> filter persists -> verify
4. Clear search input -> full tree returns -> verify
5. Check all children of a category -> parent checkbox auto-checks -> verify
6. Uncheck one child -> parent checkbox auto-unchecks -> verify
7. Change role -> tree re-renders, search cleared -> verify

## 7. Verification Evidence

```
Syntax check groups.js:
  node --check docs/ui/js/screens/groups.js          -> exit_code: 0 (PASS)

Syntax check permissions.js:
  node --check docs/ui/js/screens/permissions.js     -> exit_code: 0 (PASS)
```

## 8. Known Limitations / Mismatches

1. **No loading state in members modal** — Modal renders with empty table; data loads asynchronously in background. Brief flash of empty content possible.
2. **Search doesn't highlight matched text** — Non-matching nodes are hidden but matching text within visible node names isn't visually highlighted (e.g., with `<mark>` tags).
3. **No automated tests** — Vanilla JS SPA without Jest/Vitest. Requires manual browser testing by QA.
4. **Tree arrow in filtered mode** — When a parent matches but all its children are filtered out, clicking the expand arrow shows an empty child list. Cosmetic only.
5. **`_syncParent` searches from root each time** — Each child change triggers a full tree traversal from root. Current tree is small (~10 nodes, 3 levels) so this is not a practical concern. Could be optimized to cache parent pointers if the tree grows large.
6. **`_removeMember` closes entire modal** — After deleting a member, the modal fully closes and the main groups table reloads. The user doesn't stay in the members modal to see the updated member list inline.
