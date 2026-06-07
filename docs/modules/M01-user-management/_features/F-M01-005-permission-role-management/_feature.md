---
id: F-M01-005
name: "Permission Role Management"
type: Config
priority: P1
module: M01
status: specified
---
# Permission Role Management

## Description
Quản lý ma trận phân quyền dạng Group x Function. Admin có thể cấu hình quyền CRUD (Create, Read, Update, Delete) cho từng nhóm trên từng chức năng của hệ thống. Quyền được lưu trong bảng AUTH_GROUP_PERMISSION (hoặc group_permissions). Người dùng không phải admin chỉ xem được, không sửa được. Người dùng kế thừa quyền từ các nhóm được gán.

## Acceptance Criteria
- AC-F-M01-005-01: Giao diện hiển thị ma trận Group (hàng) x Function (cột) với các ô checkbox CRUD
- AC-F-M01-005-02: Admin có thể chọn/bỏ chọn quyền cho từng nhóm trên từng chức năng
- AC-F-M01-005-03: Quyền được lưu vào bảng group_permissions
- AC-F-M01-005-04: System trả về 200 khi lưu quyền thành công
- AC-F-M01-005-05: Người dùng không phải admin chỉ xem được ma trận, không thể chỉnh sửa
- AC-F-M01-005-06: Quyền của người dùng là tổng hợp quyền từ tất cả các nhóm mà họ thuộc về
- AC-F-M01-005-07: Có thể xuất/nhập ma trận quyền (tùy chọn)

## Business Rules Referenced
- BR-M01-011: Permission inheritance
