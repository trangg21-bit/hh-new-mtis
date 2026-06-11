---
id: F-M01-008
name: "Account Lock/Unlock"
type: Config
priority: P1
module: M01
status: specified
---
# Account Lock/Unlock

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
