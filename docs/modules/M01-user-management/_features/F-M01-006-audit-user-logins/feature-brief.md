---
id: F-M01-006
name: "Audit User Logins"
slug: "audit-user-logins"
module: M01
priority: P1
type: Monitor
status: implemented
created: "2026-06-09"
last-updated: "2026-06-09"
---

# F-M01-006: Audit User Logins

## Description
Xem nhật ký đăng nhập của người dùng. Hỗ trợ phân trang, lọc theo khoảng thời gian, username, trạng thái. Hiển thị thông tin chi tiết: username, địa chỉ IP, thiết bị, thời gian đăng nhập, trạng thái (thành công/thất bại). Dữ liệu được lấy từ bảng login_log.

## Acceptance Criteria
- AC-F-M01-006-01: Danh sách login_log hiển thị với phân trang
- AC-F-M01-006-02: Có thể lọc theo khoảng thời gian (từ ngày - đến ngày)
- AC-F-M01-006-03: Có thể lọc theo username
- AC-F-M01-006-04: Có thể lọc theo trạng thái (thành công/thất bại)
- AC-F-M01-006-05: Mỗi dòng log hiển thị: username, IP, device, thời gian, trạng thái
- AC-F-M01-006-06: Người dùng thường chỉ xem được log của chính mình
- AC-F-M01-006-07: Admin xem được log của tất cả người dùng
- AC-F-M01-006-08: Có thể xuất log ra file Excel (tùy chọn)

## Business Rules Referenced
- BR-M01-007: Login audit

## API Contract
- GET /api/auth/login-log — list login log with pagination and filters
- Response: 200 (success with pagination), 401 (unauthorized)

## UI Screen
Login log screen (S-M01-06)

## Pipeline Verdicts
- BA: Approved (2026-06-09)
- SA: Approved (2026-06-09)
- Security: Approved (2026-06-09)
- Tech-Lead: Approved (2026-06-09)
- Dev: Approved (2026-06-09)
- QA: Approved (2026-06-09)
- Reviewer: Approved (2026-06-09)
