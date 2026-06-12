---
id: F-M01-009
name: "TOTP Two-Factor Auth"
slug: "totp-two-factor-auth"
module: M01
priority: P2
type: Config
status: implemented
created: "2026-06-09"
last-updated: "2026-06-09"
---

# F-M01-009: TOTP Two-Factor Auth

## Description
Quản lý xác thực hai yếu tố TOTP (Time-based One-Time Password). Admin kích hoạt TOTP cho user. User quét mã QR code để thiết lập. Xác thực mã 6 chữ số khi đăng nhập. Vô hiệu hóa TOTP yêu cầu mật khẩu admin.

## Acceptance Criteria
- AC-F-M01-009-01: Admin kích hoạt TOTP cho user
- AC-F-M01-009-02: User quét mã QR code để thiết lập TOTP
- AC-F-M01-009-03: Hệ thống xác thực mã 6 chữ số TOTP
- AC-F-M01-009-04: Vô hiệu hóa TOTP yêu cầu mật khẩu admin
- AC-F-M01-009-05: TOTP được yêu cầu khi đăng nhập nếu được kích hoạt
- AC-F-M01-009-06: Rate limit cho TOTP verify: 5 lần sai trong 5 phút

## Business Rules Referenced
- BR-M01-016: TOTP secret per user

## API Contract
- POST /api/auth/totp/setup — generate TOTP secret and QR code
- POST /api/auth/totp/verify — verify 6-digit TOTP code
- POST /api/auth/totp/verify-login — verify TOTP during login
- POST /api/auth/totp/disable — disable TOTP (requires admin password)
- Response: 200 (success), 400 (invalid input/code)

## UI Screen
TOTP config screen (S-M01-08)

## Pipeline Verdicts
- BA: Approved (2026-06-09)
- SA: Approved (2026-06-09)
- Security: Approved (2026-06-09)
- Tech-Lead: Approved (2026-06-09)
- Dev: Approved (2026-06-09)
- QA: Approved (2026-06-09)
- Reviewer: Approved (2026-06-09)
