---
id: F-M01-004
name: "User Group Management"
type: CRUD
priority: P1
module: M01
status: specified
---
# User Group Management

## Description
Quản lý nhóm người dùng: tạo, sửa, xóa nhóm. Tên nhóm phải là duy nhất. Gán và gỡ người dùng khỏi nhóm. Xem danh sách thành viên trong nhóm. Không thể xóa nhóm nếu còn thành viên. Người dùng kế thừa quyền từ các nhóm được gán và có thể thuộc nhiều nhóm.

## Acceptance Criteria
- AC-F-M01-004-01: Tên nhóm người dùng phải là duy nhất
- AC-F-M01-004-02: System trả về 201 khi tạo nhóm thành công
- AC-F-M01-004-03: System trả về 409 nếu tên nhóm đã tồn tại
- AC-F-M01-004-04: Có thể sửa thông tin nhóm (tên, mô tả)
- AC-F-M01-004-05: Không thể xóa nhóm nếu còn thành viên trong nhóm
- AC-F-M01-004-06: Có thể gán người dùng vào nhóm
- AC-F-M01-004-07: Có thể gỡ người dùng khỏi nhóm
- AC-F-M01-004-08: Xem danh sách thành viên của một nhóm
- AC-F-M01-004-09: Người dùng kế thừa quyền từ tất cả nhóm được gán
- AC-F-M01-004-10: Một người dùng có thể thuộc nhiều nhóm

## Business Rules Referenced
- BR-M01-010: Group name uniqueness
- BR-M01-011: Permission inheritance
