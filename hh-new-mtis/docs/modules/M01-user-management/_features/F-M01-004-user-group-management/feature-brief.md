---
id: F-M01-004
name: "User Group Management"
slug: "user-group-management"
module: M01
priority: P1
type: CRUD
status: implemented
created: "2026-06-09"
last-updated: "2026-06-09"
---

# F-M01-004: User Group Management

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

## API Contract
- POST /api/users/groups — create group
- GET /api/users/groups/:id/members — list members
- PUT /api/users/groups/:id — update group
- DELETE /api/users/groups/:id — delete group
- POST/DELETE /api/users/groups/:id/members/:userId — add/remove member

## UI Screen
User groups screen (S-M01-04)

## Pipeline Verdicts
- BA: Approved (2026-06-09)
- SA: Approved (2026-06-09)
- Security: Approved (2026-06-09)
- Tech-Lead: Approved (2026-06-09)
- Dev: Approved (2026-06-09)
- QA: Approved (2026-06-09)
- Reviewer: Approved (2026-06-09)
