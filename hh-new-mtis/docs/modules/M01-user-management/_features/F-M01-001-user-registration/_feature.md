---
id: F-M01-001
name: "User Registration"
type: Workflow
priority: P0
module: M01
status: specified
---
# User Registration

## Description
Đăng ký tài khoản người dùng mới. Người dùng được tạo bởi Quản trị hệ thống (admin). Khi tạo cần nhập username, password, full_name. Hệ thống kiểm tra password strength và đảm bảo username là duy nhất. Mật khẩu được băm bằng bcrypt trước khi lưu.

## Acceptance Criteria
- AC-F-M01-001-01: Chỉ Quản trị hệ thống mới có quyền tạo người dùng mới
- AC-F-M01-001-02: System trả về 201 khi tạo thành công
- AC-F-M01-001-03: System trả về 400 nếu thiếu username, password hoặc full_name
- AC-F-M01-001-04: System trả về 409 nếu username đã tồn tại
- AC-F-M01-001-05: System trả về 403 nếu người dùng không phải admin
- AC-F-M01-001-06: Password phải đáp ứng yêu cầu độ mạnh (tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số, ký tự đặc biệt)
- AC-F-M01-001-07: Password được băm bằng bcrypt (salt rounds = 10) trước khi lưu
- AC-F-M01-001-08: Khi xóa người dùng là xóa mềm (set status = 0), dữ liệu vẫn còn trong DB

## Business Rules Referenced
- BR-M01-001: Username uniqueness
- BR-M01-002: Password strength
- BR-M01-003: Password hashing
- BR-M01-009: Admin-only user management
