---
id: F-M01-007
name: "Organization Management"
type: CRUD
priority: P1
module: M01
status: specified
---
# Organization Management

## Description
Quản lý cấu trúc tổ chức (đơn vị) của hệ thống dạng cây phân cấp (parent-child). Cho phép tạo, sửa, xóa đơn vị. Có thể di chuyển nút trong cây thứ bậc. Không thể xóa đơn vị nếu còn đơn vị con hoặc còn người dùng thuộc đơn vị đó. Mỗi người dùng được gán vào một đơn vị tổ chức.

## Acceptance Criteria
- AC-F-M01-007-01: Cấu trúc tổ chức hiển thị dạng cây (tree view) với các cấp parent-child
- AC-F-M01-007-02: Tạo đơn vị mới với thông tin: tên, mô tả, đơn vị cha (parent_id)
- AC-F-M01-007-03: Sửa thông tin đơn vị
- AC-F-M01-007-04: Không thể xóa đơn vị nếu còn đơn vị con
- AC-F-M01-007-05: Không thể xóa đơn vị nếu còn người dùng thuộc đơn vị đó
- AC-F-M01-007-06: Có thể di chuyển một đơn vị sang nút cha khác (thay đổi parent_id)
- AC-F-M01-007-07: System trả về 409 nếu vi phạm ràng buộc xóa
- AC-F-M01-007-08: Mỗi người dùng được gán vào một đơn vị (org_id trong bảng users)

## Business Rules Referenced
- BR-M01-015: Organization hierarchy
