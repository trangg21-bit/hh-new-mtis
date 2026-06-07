const express = require('express');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const { getUserPermissions } = require('../middleware/permissionMiddleware');
const { validatePassword, hashPassword, verifyPassword, checkPasswordHistory, savePasswordHistory, prunePasswordHistory } = require('../services/passwordService');
const { sendForgotPasswordEmail } = require('../services/emailService');
const { signToken, signTotpTempToken, verifyToken } = require('../utils/jwt');
const { generateSecret, generateQrCode, verifyToken: verifyTotp } = require('../services/totpService');

const router = express.Router();

// Rate limiter: 5 attempts per 15 min — applied only to login + forgot-password
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Quá nhiều yêu cầu, vui lòng thử lại sau 15 phút' }
});

// ─── POST /api/auth/login ─────────────────────────────
router.post('/login', loginLimiter, (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Thiếu tên đăng nhập hoặc mật khẩu' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!user) {
    db.prepare('INSERT INTO login_log (username, status) VALUES (?, ?)').run(username, 'failed');
    return res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu' });
  }

  if (user.status === 2) {
    return res.status(423).json({ error: 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị hệ thống' });
  }
  if (user.status === 0) {
    return res.status(401).json({ error: 'Tài khoản không tồn tại hoặc đã bị vô hiệu' });
  }

  if (!verifyPassword(password, user.password)) {
    db.prepare('INSERT INTO login_log (username, status) VALUES (?, ?)').run(username, 'failed');

    const recentFails = db.prepare(
      "SELECT COUNT(*) as c FROM login_log WHERE username = ? AND status = 'failed' AND logged_at > datetime('now','-15 minutes','localtime')"
    ).get(username).c;

    if (recentFails >= 5) {
      db.prepare("UPDATE users SET status = 2, updated_at = datetime('now','localtime') WHERE id = ?").run(user.id);
      return res.status(423).json({ error: 'Tài khoản đã bị khóa do đăng nhập sai quá nhiều lần' });
    }

    return res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu' });
  }

  if (user.totp_enabled) {
    const tempToken = signTotpTempToken({
      id: user.id, username: user.username, role: user.role, totp_pending: true
    });

    db.prepare('INSERT INTO login_log (username, ip, device, status) VALUES (?, ?, ?, ?)')
      .run(username, req.ip || '', req.headers['user-agent'] || '', 'totp_pending');

    return res.json({
      totp_required: true,
      temp_token: tempToken,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        org_unit: user.org_unit
      }
    });
  }

  const jti = crypto.randomUUID();
  const token = signToken({ id: user.id, username: user.username, role: user.role, jti });

  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();

  const activeSessions = db.prepare('SELECT COUNT(*) as c FROM sessions WHERE user_id = ?').get(user.id).c;
  if (activeSessions >= 5) {
    db.prepare('DELETE FROM sessions WHERE id = (SELECT id FROM sessions WHERE user_id = ? ORDER BY created_at ASC LIMIT 1)').run(user.id);
  }

  db.prepare(
    'INSERT INTO sessions (user_id, token_jti, device, ip, expires_at) VALUES (?, ?, ?, ?, ?)'
  ).run(user.id, jti, req.headers['user-agent'] || '', req.ip || '', expiresAt);

  db.prepare('INSERT INTO login_log (username, ip, device, status) VALUES (?, ?, ?, ?)')
    .run(username, req.ip || '', req.headers['user-agent'] || '', 'success');

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      org_unit: user.org_unit
    }
  });
});

// ─── GET /api/auth/me ─────────────────────────────────
router.get('/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Chưa đăng nhập' });
  try {
    const decoded = verifyToken(auth.replace('Bearer ', ''));
    const user = db.prepare(
      'SELECT id, username, full_name, email, phone, org_unit, role, org_id, totp_enabled FROM users WHERE id = ?'
    ).get(decoded.id);
    if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng' });

    const permissions = user.role === 'system-admin'
      ? []
      : getUserPermissions(user.id);

    const groups = db.prepare(`
      SELECT ug.id, ug.name, ug.description
      FROM group_members gm
      JOIN user_groups ug ON gm.group_id = ug.id
      WHERE gm.user_id = ?
    `).all(user.id);

    res.json({ user, groups, permissions });
  } catch {
    res.status(401).json({ error: 'Token không hợp lệ' });
  }
});

// ─── POST /api/auth/logout ────────────────────────────
router.post('/logout', authMiddleware, (req, res) => {
  const jti = req.user.jti;
  if (jti) {
    db.prepare('DELETE FROM sessions WHERE token_jti = ?').run(jti);
  }
  res.json({ ok: true });
});

// ─── PUT /api/auth/change-password ─────────────────────
router.put('/change-password', authMiddleware, (req, res) => {
  const { old_password, new_password } = req.body;
  if (!old_password || !new_password) {
    return res.status(400).json({ error: 'Thiếu mật khẩu cũ hoặc mật khẩu mới' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng' });

  if (!verifyPassword(old_password, user.password)) {
    return res.status(400).json({ error: 'Mật khẩu cũ không đúng' });
  }

  const pwErrors = validatePassword(new_password);
  if (pwErrors.length > 0) {
    return res.status(400).json({ error: pwErrors.join('; ') });
  }

  if (old_password === new_password) {
    return res.status(400).json({ error: 'Mật khẩu mới phải khác mật khẩu cũ' });
  }

  const newHash = hashPassword(new_password);

  if (checkPasswordHistory(user.id, newHash, 3)) {
    return res.status(400).json({ error: 'Mật khẩu mới không được trùng với 3 mật khẩu gần nhất' });
  }

  db.prepare("UPDATE users SET password = ?, updated_at = datetime('now','localtime') WHERE id = ?")
    .run(newHash, user.id);

  savePasswordHistory(user.id, user.password);
  prunePasswordHistory(user.id, 3);

  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);

  res.json({ ok: true, message: 'Đổi mật khẩu thành công' });
});

// ─── POST /api/auth/forgot-password ────────────────────
router.post('/forgot-password', loginLimiter, (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Thiếu email' });

  const user = db.prepare('SELECT id, email FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.json({ ok: true, message: 'Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu' });
  }

  const recentTokens = db.prepare(
    "SELECT COUNT(*) as c FROM reset_tokens WHERE user_id = ? AND created_at > datetime('now','-15 minutes','localtime')"
  ).get(user.id).c;
  if (recentTokens >= 3) {
    return res.status(429).json({ error: 'Quá nhiều yêu cầu, vui lòng thử lại sau 15 phút' });
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  db.prepare('INSERT INTO reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)')
    .run(user.id, hashedToken, expiresAt);

  sendForgotPasswordEmail(email, rawToken);

  res.json({ ok: true, message: 'Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu' });
});

// ─── GET /api/auth/login-log ──────────────────────────
router.get('/login-log', authMiddleware, (req, res) => {
  const { page = 1, limit = 20, from_date, to_date, username, status } = req.query;
  const isAdmin = req.user.role === 'system-admin';

  let sql = 'SELECT id, username, ip, device, status, logged_at FROM login_log WHERE 1=1';
  const params = [];

  if (!isAdmin) {
    sql += ' AND username = ?';
    params.push(req.user.username);
  }

  if (username && isAdmin) {
    sql += ' AND username LIKE ?';
    params.push(`%${username}%`);
  }
  if (from_date) {
    sql += ' AND logged_at >= ?';
    params.push(from_date);
  }
  if (to_date) {
    sql += ' AND logged_at <= ?';
    params.push(to_date);
  }
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  const countSql = sql.replace(/SELECT .*? FROM/, 'SELECT COUNT(*) as c FROM');
  const total = db.prepare(countSql).get(...params).c;

  const offset = (Number(page) - 1) * Number(limit);
  sql += ' ORDER BY logged_at DESC LIMIT ? OFFSET ?';
  const logs = db.prepare(sql).all(...params, Number(limit), offset);

  res.json({ logs, total, page: Number(page), limit: Number(limit) });
});

// ─── POST /api/auth/reset-password ─────────────────────
router.post('/reset-password', (req, res) => {
  const { token, new_password } = req.body;
  if (!token || !new_password) {
    return res.status(400).json({ error: 'Thiếu token hoặc mật khẩu mới' });
  }

  const pwErrors = validatePassword(new_password);
  if (pwErrors.length > 0) {
    return res.status(400).json({ error: pwErrors.join('; ') });
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const resetToken = db.prepare(
    'SELECT * FROM reset_tokens WHERE token = ? AND used = 0 AND expires_at > datetime(\'now\')'
  ).get(hashedToken);

  if (!resetToken) {
    return res.status(400).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(resetToken.user_id);
  if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng' });

  const newHash = hashPassword(new_password);

  if (checkPasswordHistory(user.id, newHash, 3)) {
    return res.status(400).json({ error: 'Mật khẩu mới không được trùng với 3 mật khẩu gần nhất' });
  }

  db.prepare("UPDATE users SET password = ?, updated_at = datetime('now','localtime') WHERE id = ?")
    .run(newHash, user.id);

  db.prepare('UPDATE reset_tokens SET used = 1 WHERE id = ?').run(resetToken.id);

  savePasswordHistory(user.id, user.password);
  prunePasswordHistory(user.id, 3);

  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);

  res.json({ ok: true, message: 'Đặt lại mật khẩu thành công' });
});

// ─── TOTP — F-M01-009 ─────────────────────────────────────

// POST /api/auth/totp/setup — generate TOTP secret + QR code (admin or self)
router.post('/totp/setup', authMiddleware, (req, res) => {
  const { userId } = req.body;
  if (req.user.role !== 'system-admin' && req.user.id !== userId) {
    return res.status(403).json({ error: 'Từ chối quyền truy cập' });
  }

  const user = db.prepare('SELECT id, username FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng' });

  const secret = generateSecret();

  db.prepare('UPDATE users SET totp_secret = ?, updated_at = datetime(\'now\',\'localtime\') WHERE id = ?')
    .run(secret, userId);

  generateQrCode(user.username, secret).then(dataUrl => {
    res.json({ secret, qrcode: dataUrl });
  }).catch(err => {
    res.status(500).json({ error: 'Không thể tạo mã QR' });
  });
});

// POST /api/auth/totp/verify — verify 6-digit code to enable TOTP
router.post('/totp/verify', authMiddleware, (req, res) => {
  const { userId, code } = req.body;
  if (!userId || !code) {
    return res.status(400).json({ error: 'Thiếu userId hoặc mã xác thực' });
  }
  if (req.user.role !== 'system-admin' && req.user.id !== userId) {
    return res.status(403).json({ error: 'Từ chối quyền truy cập' });
  }

  if (!/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: 'Mã xác thực phải gồm 6 chữ số' });
  }

  const user = db.prepare('SELECT id, totp_secret FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng' });
  if (!user.totp_secret) return res.status(400).json({ error: 'Chưa thiết lập TOTP. Vui lòng tạo secret trước' });

  const isValid = verifyTotp(code, user.totp_secret);
  if (!isValid) {
    return res.status(400).json({ error: 'Mã xác thực không đúng' });
  }

  db.prepare('UPDATE users SET totp_enabled = 1, updated_at = datetime(\'now\',\'localtime\') WHERE id = ?')
    .run(userId);

  res.json({ ok: true, message: 'Xác thực hai yếu tố đã được kích hoạt' });
});

// POST /api/auth/totp/disable — disable TOTP (requires admin password confirmation)
router.post('/totp/disable', authMiddleware, (req, res) => {
  const { userId, password } = req.body;
  if (!userId || !password) {
    return res.status(400).json({ error: 'Thiếu userId hoặc mật khẩu xác nhận' });
  }
  if (req.user.role !== 'system-admin') {
    return res.status(403).json({ error: 'Chỉ quản trị hệ thống mới có thể vô hiệu hóa TOTP' });
  }

  const admin = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!verifyPassword(password, admin.password)) {
    return res.status(400).json({ error: 'Mật khẩu xác nhận không đúng' });
  }

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng' });

  db.prepare("UPDATE users SET totp_enabled = 0, totp_secret = NULL, updated_at = datetime('now','localtime') WHERE id = ?")
    .run(userId);

  res.json({ ok: true, message: 'Đã vô hiệu hóa xác thực hai yếu tố' });
});

// ─── TOTP Login Flow (step 2) ─────────────────────────────

// POST /api/auth/totp/verify-login — verify TOTP code during login (public, rate-limited)
router.post('/totp/verify-login', loginLimiter, (req, res) => {
  const { temp_token, code } = req.body;
  if (!temp_token || !code) {
    return res.status(400).json({ error: 'Thiếu temp_token hoặc mã xác thực' });
  }

  if (!/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: 'Mã xác thực phải gồm 6 chữ số' });
  }

  let payload;
  try {
    payload = verifyToken(temp_token);
  } catch {
    return res.status(401).json({ error: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại' });
  }

  if (!payload.totp_pending) {
    return res.status(400).json({ error: 'Token không hợp lệ' });
  }

  const user = db.prepare('SELECT id, username, role, full_name, email, org_unit, totp_secret, totp_enabled FROM users WHERE id = ?').get(payload.id);
  if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng' });

  if (!user.totp_enabled || !user.totp_secret) {
    return res.status(400).json({ error: 'TOTP chưa được kích hoạt cho tài khoản này' });
  }

  const isValid = verifyTotp(code, user.totp_secret);
  if (!isValid) {
    return res.status(400).json({ error: 'Mã xác thực không đúng' });
  }

  const jti = crypto.randomUUID();
  const token = signToken({ id: user.id, username: user.username, role: user.role, jti });

  const activeSessions = db.prepare('SELECT COUNT(*) as c FROM sessions WHERE user_id = ?').get(user.id).c;
  if (activeSessions >= 5) {
    db.prepare('DELETE FROM sessions WHERE id = (SELECT id FROM sessions WHERE user_id = ? ORDER BY created_at ASC LIMIT 1)').run(user.id);
  }

  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
  db.prepare(
    'INSERT INTO sessions (user_id, token_jti, device, ip, expires_at) VALUES (?, ?, ?, ?, ?)'
  ).run(user.id, jti, req.headers['user-agent'] || '', req.ip || '', expiresAt);

  db.prepare('INSERT INTO login_log (username, ip, device, status) VALUES (?, ?, ?, ?)')
    .run(user.username, req.ip || '', req.headers['user-agent'] || '', 'success');

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      org_unit: user.org_unit
    }
  });
});

// ─── Session Management — F-M01-010 ────────────────────────

// GET /api/auth/sessions — list active sessions
router.get('/sessions', authMiddleware, (req, res) => {
  const isAdmin = req.user.role === 'system-admin';

  let sql = 'SELECT id, user_id, token_jti, device, ip, created_at, expires_at, last_active_at FROM sessions WHERE 1=1';
  const params = [];

  if (!isAdmin) {
    sql += ' AND user_id = ?';
    params.push(req.user.id);
  }

  sql += ' ORDER BY created_at DESC';

  const sessions = db.prepare(sql).all(...params);

  const result = sessions.map(s => ({
    id: s.id,
    user_id: s.user_id,
    device: s.device,
    ip: s.ip,
    created_at: s.created_at,
    expires_at: s.expires_at,
    last_active_at: s.last_active_at,
    is_current: s.token_jti === req.user.jti
  }));

  res.json({ sessions: result });
});

// DELETE /api/auth/sessions/:id — revoke a session
router.delete('/sessions/:id', authMiddleware, (req, res) => {
  const sessionId = Number(req.params.id);
  const isAdmin = req.user.role === 'system-admin';

  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
  if (!session) return res.status(404).json({ error: 'Không tìm thấy phiên đăng nhập' });

  if (!isAdmin && session.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Từ chối quyền truy cập' });
  }

  if (session.token_jti === req.user.jti) {
    return res.status(400).json({ error: 'Không thể xóa phiên đăng nhập hiện tại. Sử dụng đăng xuất thay thế' });
  }

  db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);

  res.json({ ok: true, message: 'Đã xóa phiên đăng nhập' });
});

module.exports = router;
