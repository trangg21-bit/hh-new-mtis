---
id: F-M01-003
name: "Password Management"
slug: "password-management"
module: M01
priority: P0
type: CRUD
status: implemented
created: "2026-06-09"
last-updated: "2026-06-09"
---

# F-M01-003: Password Management

## Description
Quản lý mật khẩu người dùng bao gồm: đổi mật khẩu (yêu cầu nhập mật khẩu cũ), quên mật khẩu (gửi link reset), reset mật khẩu (token có thời hạn 15 phút). Mật khẩu mới phải đáp ứng yêu cầu độ mạnh và không được trùng với 3 mật khẩu gần nhất. Tất cả mật khẩu được băm bằng bcrypt trước khi lưu.

## Acceptance Criteria
- AC-F-M01-003-01: Đổi mật khẩu yêu cầu nhập old_password
- AC-F-M01-003-02: System trả về 400 nếu old_password không đúng
- AC-F-M01-003-03: Mật khẩu mới phải đáp ứng yêu cầu độ mạnh (tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số, ký tự đặc biệt)
- AC-F-M01-003-04: Mật khẩu mới không được trùng với 3 mật khẩu gần nhất (kiểm tra bảng password_history)
- AC-F-M01-003-05: Mật khẩu mới được băm bằng bcrypt (salt rounds = 10) trước khi lưu
- AC-F-M01-003-06: Forgot password gửi email reset link chứa token
- AC-F-M01-003-07: Reset token có thời hạn 15 phút
- AC-F-M01-003-08: System trả về 200 khi đổi/reset mật khẩu thành công
- AC-F-M01-003-09: Mật khẩu cũ được lưu vào bảng password_history sau khi đổi

## Business Rules Referenced
- BR-M01-002: Password strength
- BR-M01-003: Password hashing
- BR-M01-013: Password change requires old password
- BR-M01-014: Password history

## API Contract
- PUT /api/auth/change-password — change password
- POST /api/auth/forgot-password — send reset link
- POST /api/auth/reset-password — reset with token
- Response: 200 (success), 400 (invalid input)

## UI Screen
Password management screen (S-M01-10), Forgot password (S-M01-12), Reset password (S-M01-13)

## Pipeline Verdicts
- BA: Approved (2026-06-09)
- SA: Approved (2026-06-09)
- Security: Approved (2026-06-09)
- Tech-Lead: Approved (2026-06-09)
- Dev: Approved (2026-06-09)
- QA: Approved (2026-06-09)
- Reviewer: Approved (2026-06-09)
