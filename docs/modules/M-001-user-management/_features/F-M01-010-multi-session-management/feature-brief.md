---
id: F-M01-010
name: "Multi-Session Management"
slug: "multi-session-management"
module: M01
priority: P2
type: Monitor
status: implemented
created: "2026-06-09"
last-updated: "2026-06-09"
---

# F-M01-010: Multi-Session Management

## Description
Quản lý phiên đăng nhập đa thiết bị. Tối đa 5 phiên đăng nhập đồng thời cho mỗi user. Hiển thị danh sách phiên đang hoạt động. Admin có thể thu hồi bất kỳ phiên nào. User có thể xem phiên của chính mình. Tự động thu phiên cũ nhất khi vượt quá giới hạn.

## Acceptance Criteria
- AC-F-M01-010-01: Tối đa 5 phiên đăng nhập đồng thời cho mỗi user
- AC-F-M01-010-02: Hiển thị danh sách các phiên đang hoạt động
- AC-F-M01-010-03: Admin có thể thu hồi bất kỳ phiên nào của user
- AC-F-M01-010-04: User có thể xem danh sách phiên của chính mình
- AC-F-M01-010-05: Khi vượt quá giới hạn, phiên cũ nhất bị vô hiệu
- AC-F-M01-010-06: Logout thu hồi phiên tương ứng
- AC-F-M01-010-07: Token không hợp lệ sau khi thu hồi (kiểm tra qua sessions table)

## Business Rules Referenced
- BR-M01-017: Session limit

## API Contract
- GET /api/auth/sessions — list active sessions
- DELETE /api/auth/sessions/:id — revoke session
- POST /api/auth/logout — logout (revoke current session)
- Response: 200 (success), 401 (unauthorized)

## UI Screen
Active sessions screen (S-M01-14)

## Pipeline Verdicts
- BA: Approved (2026-06-09)
- SA: Approved (2026-06-09)
- Security: Approved (2026-06-09)
- Tech-Lead: Approved (2026-06-09)
- Dev: Approved (2026-06-09)
- QA: Approved (2026-06-09)
- Reviewer: Approved (2026-06-09)
