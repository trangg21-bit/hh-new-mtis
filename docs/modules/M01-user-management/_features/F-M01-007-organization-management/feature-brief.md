---
id: F-M01-007
name: "Organization Management"
slug: "organization-management"
module: M01
priority: P1
type: CRUD
status: implemented
created: "2026-06-09"
last-updated: "2026-06-09"
---

# F-M01-007: Organization Management

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

## API Contract
- GET /api/organizations — list org tree
- POST /api/organizations — create org
- PUT /api/organizations/:id — update org
- DELETE /api/organizations/:id — delete org (with cascade check)
- Response: 200/201 (success), 409 (constraint violation)

## UI Screen
Organization tree screen (S-M01-07)

## Pipeline Verdicts
- BA: Approved (2026-06-09)
- SA: Approved (2026-06-09)
- Security: Approved (2026-06-09)
- Tech-Lead: Approved (2026-06-09)
- Dev: Approved (2026-06-09)
- QA: Approved (2026-06-09)
- Reviewer: Approved (2026-06-09)
