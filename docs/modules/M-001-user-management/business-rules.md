# Business Rules — M01 User Management

| BR-ID | Name | Description | Validation Logic | Related Features |
|-------|------|-------------|------------------|------------------|
| BR-M01-001 | Username uniqueness | Tên đăng nhập phải là duy nhất trong toàn hệ thống | UNIQUE constraint trên username column | F-M01-001 |
| BR-M01-002 | Password strength | Mật khẩu tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt | Regex: `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$` | F-M01-001, F-M01-003 |
| BR-M01-003 | Password hashing | Mật khẩu phải được băm bằng bcrypt trước khi lưu | bcrypt hash với salt rounds = 10 | F-M01-001, F-M01-003 |
| BR-M01-004 | Login attempt rate limit | Tối đa 5 lần đăng nhập sai liên tiếp trong 15 phút | Đếm login_log status=failed trong 15 phút; nếu >=5 thì chặn 15 phút | F-M01-002, F-M01-008 |
| BR-M01-005 | Account lock on failed attempts | Tự động khóa tài khoản sau 5 lần đăng nhập sai liên tiếp | Set status=2 (locked) khi vượt ngưỡng | F-M01-002, F-M01-008 |
| BR-M01-006 | JWT expiry | Token JWT có thời hạn 8 giờ | expiresIn: '8h' | F-M01-002 |
| BR-M01-007 | Login audit | Mọi lần đăng nhập đều được ghi vào login_log | Ghi username, IP, device, status, logged_at | F-M01-002, F-M01-006 |
| BR-M01-008 | Soft delete | Xóa người dùng là xóa mềm (set status=0) | UPDATE status = 0; dữ liệu vẫn còn trong DB | F-M01-001, F-M01-008 |
| BR-M01-009 | Admin-only user management | Chỉ Quản trị hệ thống mới có quyền tạo/sửa/xóa người dùng | Middleware kiểm tra req.user.role | F-M01-001, F-M01-008 |
| BR-M01-010 | Group name uniqueness | Tên nhóm người dùng phải là duy nhất | UNIQUE constraint trên user_groups.name | F-M01-004 |
| BR-M01-011 | Permission inheritance | Người dùng kế thừa quyền từ nhóm được gán | User > Group > Permission; user có thể có nhiều group | F-M01-004, F-M01-005 |
| BR-M01-012 | Cannot self-lock | Admin không thể tự khóa tài khoản của chính mình | Kiểm tra req.user.id !== target user id | F-M01-008 |
| BR-M01-013 | Password change requires old password | Đổi mật khẩu phải nhập mật khẩu cũ | old_password required; verify bằng bcrypt.compareSync | F-M01-003 |
| BR-M01-014 | Password history | Không được dùng lại 3 mật khẩu gần nhất | Bảng password_history lưu hash cũ | F-M01-003 |
| BR-M01-015 | Organization hierarchy | Đơn vị tổ chức có cấu trúc cây (parent-child) | org_id, parent_id trong bảng organizations | F-M01-007 |
| BR-M01-016 | TOTP secret per user | Mỗi người dùng có một TOTP secret riêng | totp_secret và totp_enabled trong users | F-M01-009 |
| BR-M01-017 | Session limit | Mỗi người dùng tối đa 5 phiên đăng nhập đồng thời | Đếm số token hợp lệ; token cũ nhất bị vô hiệu | F-M01-010 |
| BR-M01-018 | Account status check on login | Tài khoản bị khóa (status=2) hoặc vô hiệu (status=0) không được đăng nhập | WHERE status = 1 trong query login | F-M01-002, F-M01-008 |
