---
id: F-M01-009
name: "TOTP Two-Factor Auth"
type: Config
priority: P2
module: M01
status: specified
---
# TOTP Two-Factor Auth

## Description
Xác thực 2 yếu tố sử dụng TOTP (Time-based One-Time Password). Admin kích hoạt TOTP cho người dùng. Người dùng quét mã QR để cài đặt ứng dụng xác thực (Google Authenticator, Authy...). Nhập mã 6 số để xác minh. Tắt TOTP yêu cầu admin xác nhận mật khẩu. Mỗi người dùng có một TOTP secret riêng.

## Acceptance Criteria
- AC-F-M01-009-01: Admin có thể kích hoạt TOTP cho người dùng
- AC-F-M01-009-02: System sinh TOTP secret riêng cho mỗi người dùng
- AC-F-M01-009-03: Hiển thị mã QR để người dùng quét bằng ứng dụng xác thực
- AC-F-M01-009-04: Người dùng nhập mã 6 số để xác minh TOTP
- AC-F-M01-009-05: System trả về 400 nếu mã TOTP không đúng
- AC-F-M01-009-06: Tắt TOTP yêu cầu admin nhập mật khẩu để xác nhận
- AC-F-M01-009-07: TOTP được lưu với các trường totp_secret và totp_enabled trong bảng users
- AC-F-M01-009-08: Khi TOTP được kích hoạt, login yêu cầu thêm bước nhập mã TOTP

## Business Rules Referenced
- BR-M01-016: TOTP secret per user
