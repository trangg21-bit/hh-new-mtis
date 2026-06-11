---
id: F-M01-002
name: "User Login"
slug: "user-login"
module: M01
priority: P0
type: CRUD
status: implemented
created: "2026-06-09"
last-updated: "2026-06-09"
---

# F-M01-002: User Login

## Description
Xác thực người dùng bằng username và password. Kiểm tra trạng thái tài khoản (chỉ cho phép đăng nhập khi status = 1). Áp dụng rate limiting: tối đa 5 lần sai liên tiếp trong 15 phút. Tự động khóa tài khoản sau 5 lần sai. Ghi nhật ký mỗi lần đăng nhập vào login_log. Trả về JWT token có thời hạn 8 giờ.

## Acceptance Criteria
- AC-F-M01-002-01: Username và password là bắt buộc
- AC-F-M01-002-02: System trả về 200 + JWT token + thông tin user nếu đăng nhập đúng
- AC-F-M01-002-03: System trả về 401 nếu sai username hoặc password
- AC-F-M01-002-04: System trả về 423 nếu tài khoản bị khóa (status = 2) hoặc vô hiệu (status = 0)
- AC-F-M01-002-05: Rate limit: tối đa 5 lần đăng nhập sai trong 15 phút; nếu vượt quá, chặn login 15 phút
- AC-F-M01-002-06: Tự động khóa tài khoản (status = 2) sau 5 lần đăng nhập sai liên tiếp
- AC-F-M01-002-07: Mỗi lần đăng nhập đều được ghi vào login_log (username, IP, device, status, logged_at)
- AC-F-M01-002-08: JWT token có thời hạn 8 giờ (expiresIn: '8h')
- AC-F-M01-002-09: GET /api/auth/me trả về thông tin user hiện tại dựa trên token hợp lệ

## Business Rules Referenced
- BR-M01-004: Login attempt rate limit
- BR-M01-005: Account lock on failed attempts
- BR-M01-006: JWT expiry
- BR-M01-007: Login audit
- BR-M01-018: Account status check on login

## API Contract
- POST /api/auth/login — authenticate user
- GET /api/auth/me — get current user info
- Response: 200 (success + JWT), 401 (wrong creds), 423 (locked/disabled)

## UI Screen
login.html (S-M01-11)

## Pipeline Verdicts
- BA: Approved (2026-06-09)
- SA: Approved (2026-06-09)
- Security: Approved (2026-06-09)
- Tech-Lead: Approved (2026-06-09)
- Dev: Approved (2026-06-09)
- QA: Approved (2026-06-09)
- Reviewer: Approved (2026-06-09)
