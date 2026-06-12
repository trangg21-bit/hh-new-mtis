---
id: F-M01-010
name: "Multi-Session Management"
type: Monitor
priority: P2
module: M01
status: specified
---
# Multi-Session Management

## Description
Quản lý nhiều phiên đăng nhập đồng thời của người dùng. Mỗi người dùng được tối đa 5 phiên đăng nhập đồng thời. Liệt kê các phiên đang hoạt động. Admin có thể thu hồi bất kỳ phiên nào. Người dùng có thể xem danh sách phiên của chính mình. Khi vượt quá giới hạn, token cũ nhất bị vô hiệu hóa.

## Acceptance Criteria
- AC-F-M01-010-01: Mỗi người dùng tối đa 5 phiên đăng nhập đồng thời
- AC-F-M01-010-02: Khi vượt quá 5 phiên, token cũ nhất bị vô hiệu hóa tự động
- AC-F-M01-010-03: Liệt kê các phiên đang hoạt động (token, thời gian tạo, thời gian hết hạn, IP, device)
- AC-F-M01-010-04: Admin có thể thu hồi (xóa) bất kỳ phiên nào
- AC-F-M01-010-05: Người dùng có thể xem danh sách phiên của chính mình
- AC-F-M01-010-06: Khi một phiên bị thu hồi, token tương ứng không còn hiệu lực
- AC-F-M01-010-07: Sử dụng bảng sessions để lưu thông tin phiên (hoặc track qua JWT jti + expiry)

## Business Rules Referenced
- BR-M01-017: Session limit
