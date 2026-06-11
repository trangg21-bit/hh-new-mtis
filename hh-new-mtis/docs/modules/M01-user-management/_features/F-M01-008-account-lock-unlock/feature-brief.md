---
id: F-M01-008
name: "Account Lock/Unlock"
slug: "account-lock-unlock"
module: M01
priority: P1
type: Config
status: implemented
created: "2026-06-09"
last-updated: "2026-06-09"
---

# F-M01-008: Account Lock/Unlock

## Description
Quản lý khóa/mở khóa tài khoản người dùng. Admin có thể khóa (status = 2) hoặc mở khóa (status = 1) tài khoản. Tài khoản tự động bị khóa sau 5 lần đăng nhập sai liên tiếp. Admin không thể tự khóa tài khoản của chính mình. Tài khoản bị khóa không thể đăng nhập (trả về 423). Xóa người dùng là xóa mềm (status = 0).

## Acceptance Criteria
- AC-F-M01-008-01: Admin khóa tài khoản → chuyển status = 2 (locked)
- AC-F-M01-008-02: Admin mở khóa tài khoản → chuyển status = 1 (active)
- AC-F-M01-008-03: Tự động khóa tài khoản sau 5 lần đăng nhập sai liên tiếp
- AC-F-M01-008-04: Admin không thể tự khóa tài khoản của chính mình (trả về 400)
- AC-F-M01-008-05: Tài khoản bị khóa (status = 2) nhận mã 423 khi đăng nhập
- AC-F-M01-008-06: Tài khoản bị vô hiệu (status = 0, soft delete) nhận mã 423 khi đăng nhập
- AC-F-M01-008-07: Xóa người dùng là xóa mềm: UPDATE status = 0, dữ liệu vẫn còn trong DB
- AC-F-M01-008-08: Chỉ admin mới có quyền khóa/mở khóa tài khoản

## Business Rules Referenced
- BR-M01-004: Login attempt rate limit
- BR-M01-005: Account lock on failed attempts
- BR-M01-008: Soft delete
- BR-M01-012: Cannot self-lock
- BR-M01-018: Account status check on login

## API Contract
- PUT /api/users/:id — update user status (lock/unlock/soft-delete)
- Response: 200 (success), 400 (self-lock attempt), 403 (non-admin)

## UI Screen
User list/detail screens (S-M01-02, S-M01-03)

## Pipeline Verdicts
- BA: Approved (2026-06-09)
- SA: Approved (2026-06-09)
- Security: Approved (2026-06-09)
- Tech-Lead: Approved (2026-06-09)
- Dev: Approved (2026-06-09)
- QA: Approved (2026-06-09)
- Reviewer: Approved (2026-06-09)
