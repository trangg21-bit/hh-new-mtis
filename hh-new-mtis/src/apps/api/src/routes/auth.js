const express = require('express');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const { getUserPermissions } = require('../middleware/permissionMiddleware');
const { validatePassword, hashPassword, verifyPassword, checkPasswordHistory, savePasswordHistory, prunePasswordHistory } = require('../services/passwordService');
const { sendForgotPasswordEmail } = require('../services/emailService');
const { signToken, signTotpTempToken, verifyToken } = require('../utils/jwt');
const { parsePagination } = require('../utils/validation');
const { generateSecret, generateQrCode, verifyToken: verifyTotp, encrypt: encryptTotpSecret } = require('../services/totpService');
const { isRateLimited: totpRateLimited, recordAttempt: totpRecord, reset: totpReset } = require('../services/rateLimiter');
const { alertAccountLockout } = require('../services/alertService');

const router = express.Router();

// Rate limiters â€” disable for E2E tests
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: process.env.ENABLE_E2E_TEST_HOOKS ? Infinity : 50, standardHeaders: true, legacyHeaders: false, message: { error: 'QuÃ¡ nhiá»u yÃªu cáº§u, vui lÃ²ng thá»­ láº¡i sau 15 phÃºt' } });
const passwordChangeLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: process.env.ENABLE_E2E_TEST_HOOKS ? Infinity : 5, standardHeaders: true, legacyHeaders: false, message: { error: 'QuÃ¡ nhiá»u yÃªu cáº§u Ä‘á»•i máº­t kháº©u, thá»­ láº¡i sau 15 phÃºt' } });
const passwordResetLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: process.env.ENABLE_E2E_TEST_HOOKS ? Infinity : 3, standardHeaders: true, legacyHeaders: false, message: { error: 'QuÃ¡ nhiá»u yÃªu cáº§u Ä‘áº·t láº¡i máº­t kháº©u, thá»­ láº¡i sau 15 phÃºt' } });

// â”€â”€â”€ POST /api/auth/reset-rate-limit (E2E test only) â”€â”€â”€
router.post('/reset-rate-limit', (req, res) => {
  if (process.env.ENABLE_E2E_TEST_HOOKS) {
    process.env.__RATE_LIMIT_RESET = 'true';
    return res.json({ ok: true });
  }
  res.status(403).json({ error: 'Forbidden' });
});



// â”€â”€â”€ POST /api/auth/login â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.post('/login', loginLimiter, (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Thiáº¿u tÃªn Ä‘Äƒng nháº­p hoáº·c máº­t kháº©u' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!user) {
    db.prepare('INSERT INTO login_log (username, ip, device, status) VALUES (?, ?, ?, ?)').run(username, req.ip || '', req.headers['user-agent'] || '', 'failed');
    return res.status(401).json({ error: 'Sai tÃªn Ä‘Äƒng nháº­p hoáº·c máº­t kháº©u' });
  }

  if (user.status === 2) {
    return res.status(423).json({ error: 'TÃ i khoáº£n Ä‘Ã£ bá»‹ khÃ³a. Vui lÃ²ng liÃªn há»‡ quáº£n trá»‹ há»‡ thá»‘ng' });
  }
  if (user.status === 0) {
    return res.status(401).json({ error: 'TÃ i khoáº£n khÃ´ng tá»“n táº¡i hoáº·c Ä‘Ã£ bá»‹ vÃ´ hiá»‡u' });
  }

  if (!verifyPassword(password, user.password)) {
    db.prepare('INSERT INTO login_log (username, ip, device, status) VALUES (?, ?, ?, ?)').run(username, req.ip || '', req.headers['user-agent'] || '', 'failed');

    const recentFails = db.prepare(
      "SELECT COUNT(*) as c FROM login_log WHERE username = ? AND status = 'failed' AND logged_at > datetime('now','-15 minutes','localtime')"
    ).get(username).c;

    if (recentFails >= 5) {
      db.prepare("UPDATE users SET status = 2, updated_at = datetime('now','localtime') WHERE id = ?").run(user.id);
      db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);
      // SRE-07: Alert on account lockout
      alertAccountLockout(username);
      return res.status(423).json({ error: 'TÃ i khoáº£n Ä‘Ã£ bá»‹ khÃ³a do Ä‘Äƒng nháº­p sai quÃ¡ nhiá»u láº§n' });
    }

    return res.status(401).json({ error: 'Sai tÃªn Ä‘Äƒng nháº­p hoáº·c máº­t kháº©u' });
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

  // RR-01: Atomic session cap + insert to prevent race condition (CR-04)
  const sessionTxn = db.transaction(() => {
    const activeSessions = db.prepare('SELECT COUNT(*) as c FROM sessions WHERE user_id = ?').get(user.id).c;
    if (activeSessions >= 5) {
      db.prepare('DELETE FROM sessions WHERE id = (SELECT id FROM sessions WHERE user_id = ? ORDER BY created_at ASC LIMIT 1)').run(user.id);
    }
    db.prepare(
      'INSERT INTO sessions (user_id, token_jti, device, ip, expires_at) VALUES (?, ?, ?, ?, ?)'
    ).run(user.id, jti, req.headers['user-agent'] || '', req.ip || '', expiresAt);
    db.prepare('INSERT INTO login_log (username, ip, device, status) VALUES (?, ?, ?, ?)')
      .run(username, req.ip || '', req.headers['user-agent'] || '', 'success');
  });
  try {
    sessionTxn();
  } catch {}

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

// â”€â”€â”€ GET /api/auth/me â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare(
    'SELECT id, username, full_name, email, phone, org_unit, role, org_id, totp_enabled, status FROM users WHERE id = ?'
  ).get(req.user.id);
  if (!user) return res.status(404).json({ error: 'KhÃ´ng tÃ¬m tháº¥y ngÆ°á»i dÃ¹ng' });
  if (user.status === 0) return res.status(401).json({ error: 'TÃ i khoáº£n khÃ´ng tá»“n táº¡i hoáº·c Ä‘Ã£ bá»‹ vÃ´ hiá»‡u' });
  if (user.status === 2) return res.status(423).json({ error: 'TÃ i khoáº£n Ä‘Ã£ bá»‹ khÃ³a. Vui lÃ²ng liÃªn há»‡ quáº£n trá»‹ há»‡ thá»‘ng' });

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
});

// â”€â”€â”€ POST /api/auth/logout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.post('/logout', authMiddleware, (req, res) => {
  const jti = req.user.jti;
  if (jti) {
    db.prepare('DELETE FROM sessions WHERE token_jti = ?').run(jti);
  }
  db.prepare('INSERT INTO login_log (username, ip, device, status) VALUES (?, ?, ?, ?)')
    .run(req.user.username, req.ip || '', req.headers['user-agent'] || '', 'success');

  res.json({ success: true });
});

// â”€â”€â”€ PUT /api/auth/change-password â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// CR-V3-03: Adds login_log entry with status='password_changed' on success
router.put('/change-password', authMiddleware, passwordChangeLimiter, (req, res) => {
  const { old_password, new_password } = req.body;
  if (!old_password || !new_password) {
    return res.status(400).json({ error: 'Thiáº¿u máº­t kháº©u cÅ© hoáº·c máº­t kháº©u má»›i' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'KhÃ´ng tÃ¬m tháº¥y ngÆ°á»i dÃ¹ng' });

  if (!verifyPassword(old_password, user.password)) {
    return res.status(400).json({ error: 'Máº­t kháº©u cÅ© khÃ´ng Ä‘Ãºng' });
  }

  const pwErrors = validatePassword(new_password);
  if (pwErrors.length > 0) {
    return res.status(400).json({ error: pwErrors.join('; ') });
  }

  if (old_password === new_password) {
    return res.status(400).json({ error: 'Máº­t kháº©u má»›i pháº£i khÃ¡c máº­t kháº©u cÅ©' });
  }

  const newHash = hashPassword(new_password);

  if (checkPasswordHistory(user.id, new_password, 3)) {
    return res.status(400).json({ error: 'Máº­t kháº©u má»›i khÃ´ng Ä‘Æ°á»£c trÃ¹ng vá»›i 3 máº­t kháº©u gáº§n nháº¥t' });
  }

  db.prepare("UPDATE users SET password = ?, updated_at = datetime('now','localtime') WHERE id = ?")
    .run(newHash, user.id);

  savePasswordHistory(user.id, user.password);
  prunePasswordHistory(user.id, 3);

  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);

  // CR-V3-03: Audit log â€” record password change as a critical security event
  db.prepare('INSERT INTO login_log (username, ip, device, status) VALUES (?, ?, ?, ?)')
    .run(user.username, req.ip || '', req.headers['user-agent'] || '', 'password_changed');

  res.json({ ok: true, message: 'Äá»•i máº­t kháº©u thÃ nh cÃ´ng' });
});

// â”€â”€â”€ POST /api/auth/forgot-password â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.post('/forgot-password', loginLimiter, (req, res) => {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Email khÃ´ng há»£p lá»‡' });

  const user = db.prepare('SELECT id, email FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.json({ ok: true, message: 'Náº¿u email tá»“n táº¡i, báº¡n sáº½ nháº­n Ä‘Æ°á»£c hÆ°á»›ng dáº«n Ä‘áº·t láº¡i máº­t kháº©u' });
  }

  const recentTokens = db.prepare(
    "SELECT COUNT(*) as c FROM reset_tokens WHERE user_id = ? AND created_at > datetime('now','-15 minutes','localtime')"
  ).get(user.id).c;
  if (recentTokens >= 3) {
    return res.status(429).json({ error: 'QuÃ¡ nhiá»u yÃªu cáº§u, vui lÃ²ng thá»­ láº¡i sau 15 phÃºt' });
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  db.prepare('INSERT INTO reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)')
    .run(user.id, hashedToken, expiresAt);

  sendForgotPasswordEmail(email, rawToken);

  const response = { ok: true, message: 'Náº¿u email tá»“n táº¡i, báº¡n sáº½ nháº­n Ä‘Æ°á»£c hÆ°á»›ng dáº«n Ä‘áº·t láº¡i máº­t kháº©u' };
  if (process.env.ENABLE_E2E_TEST_HOOKS === 'true') {
    response._debug_raw_token = rawToken;
  }
  res.json(response);
});



// â”€â”€â”€ GET /api/auth/login-log â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/login-log', authMiddleware, (req, res) => {
  const { from_date, to_date, username, status } = req.query;
  const { page, limit, offset } = parsePagination(req.query);
  const isAdmin = req.user.role === 'system-admin';

  let countSql = 'SELECT COUNT(*) as c FROM login_log WHERE 1=1';
  let sql = 'SELECT id, username, ip, device, status, logged_at FROM login_log WHERE 1=1';
  const params = [];
  const countParams = [];

  if (!isAdmin) {
    const clause = ' AND username = ?';
    sql += clause; countSql += clause;
    params.push(req.user.username); countParams.push(req.user.username);
  }

  if (username && isAdmin) {
    const clause = ' AND username LIKE ?';
    sql += clause; countSql += clause;
    params.push(`%${username}%`); countParams.push(`%${username}%`);
  }
  if (from_date) {
    const clause = ' AND logged_at >= ?';
    sql += clause; countSql += clause;
    params.push(from_date); countParams.push(from_date);
  }
  if (to_date) {
    const clause = ' AND logged_at <= ?';
    sql += clause; countSql += clause;
    params.push(to_date); countParams.push(to_date);
  }
  if (status) {
    const clause = ' AND status = ?';
    sql += clause; countSql += clause;
    params.push(status); countParams.push(status);
  }

  sql += ' ORDER BY logged_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const total = db.prepare(countSql).get(...countParams).c;
  const logs = db.prepare(sql).all(...params);

  res.json({ logs, total, page, limit });
});

// â”€â”€â”€ POST /api/auth/reset-password â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.post('/reset-password', passwordResetLimiter, (req, res) => {
  const { token, new_password } = req.body;
  if (!token || !new_password) {
    return res.status(400).json({ error: 'Thiáº¿u token hoáº·c máº­t kháº©u má»›i' });
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
    return res.status(400).json({ error: 'Token khÃ´ng há»£p lá»‡ hoáº·c Ä‘Ã£ háº¿t háº¡n' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(resetToken.user_id);
  if (!user) return res.status(404).json({ error: 'KhÃ´ng tÃ¬m tháº¥y ngÆ°á»i dÃ¹ng' });

  const newHash = hashPassword(new_password);

  if (checkPasswordHistory(user.id, new_password, 3)) {
    return res.status(400).json({ error: 'Máº­t kháº©u má»›i khÃ´ng Ä‘Æ°á»£c trÃ¹ng vá»›i 3 máº­t kháº©u gáº§n nháº¥t' });
  }

  db.prepare("UPDATE users SET password = ?, updated_at = datetime('now','localtime') WHERE id = ?")
    .run(newHash, user.id);

  db.prepare('UPDATE reset_tokens SET used = 1 WHERE id = ?').run(resetToken.id);

  savePasswordHistory(user.id, user.password);
  prunePasswordHistory(user.id, 3);

  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);

  res.json({ ok: true, message: 'Äáº·t láº¡i máº­t kháº©u thÃ nh cÃ´ng' });
});

// â”€â”€â”€ TOTP â€” F-M01-009 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// POST /api/auth/totp/setup â€” generate TOTP secret + QR code (admin or self)
router.post('/totp/setup', authMiddleware, (req, res) => {
  const { userId } = req.body;
  if (req.user.role !== 'system-admin' && req.user.id !== userId) {
    return res.status(403).json({ error: 'Tá»« chá»‘i quyá»n truy cáº­p' });
  }

  const user = db.prepare('SELECT id, username FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'KhÃ´ng tÃ¬m tháº¥y ngÆ°á»i dÃ¹ng' });

  const secret = generateSecret();

  db.prepare('UPDATE users SET totp_secret = ?, updated_at = datetime(\'now\',\'localtime\') WHERE id = ?')
    .run(encryptTotpSecret(secret), userId);

  generateQrCode(user.username, secret).then(dataUrl => {
    // A3-M01: Do NOT return raw secret in API response
    res.json({ qrcode: dataUrl });
  }).catch(err => {
    res.status(500).json({ error: 'KhÃ´ng thá»ƒ táº¡o mÃ£ QR' });
  });
});

// POST /api/auth/totp/verify â€” verify 6-digit code to enable TOTP
router.post('/totp/verify', authMiddleware, (req, res) => {
  const { userId, code } = req.body;
  if (!userId || !code) {
    return res.status(400).json({ error: 'Thiáº¿u userId hoáº·c mÃ£ xÃ¡c thá»±c' });
  }
  if (req.user.role !== 'system-admin' && req.user.id !== userId) {
    return res.status(403).json({ error: 'Tá»« chá»‘i quyá»n truy cáº­p' });
  }

  if (!/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: 'MÃ£ xÃ¡c thá»±c pháº£i gá»“m 6 chá»¯ sá»‘' });
  }

  const user = db.prepare('SELECT id, totp_secret FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'KhÃ´ng tÃ¬m tháº¥y ngÆ°á»i dÃ¹ng' });
  if (!user.totp_secret) return res.status(400).json({ error: 'ChÆ°a thiáº¿t láº­p TOTP. Vui lÃ²ng táº¡o secret trÆ°á»›c' });

  const isValid = verifyTotp(code, user.totp_secret);
  if (!isValid) {
    return res.status(400).json({ error: 'MÃ£ xÃ¡c thá»±c khÃ´ng Ä‘Ãºng' });
  }

  db.prepare('UPDATE users SET totp_enabled = 1, updated_at = datetime(\'now\',\'localtime\') WHERE id = ?')
    .run(userId);

  res.json({ ok: true, message: 'XÃ¡c thá»±c hai yáº¿u tá»‘ Ä‘Ã£ Ä‘Æ°á»£c kÃ­ch hoáº¡t' });
});

// POST /api/auth/totp/disable â€” disable TOTP (requires admin password confirmation)
router.post('/totp/disable', authMiddleware, (req, res) => {
  const { userId, password } = req.body;
  if (!userId || !password) {
    return res.status(400).json({ error: 'Thiáº¿u userId hoáº·c máº­t kháº©u xÃ¡c nháº­n' });
  }
  if (req.user.role !== 'system-admin') {
    return res.status(403).json({ error: 'Chá»‰ quáº£n trá»‹ há»‡ thá»‘ng má»›i cÃ³ thá»ƒ vÃ´ hiá»‡u hÃ³a TOTP' });
  }

  const admin = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!verifyPassword(password, admin.password)) {
    return res.status(400).json({ error: 'Máº­t kháº©u xÃ¡c nháº­n khÃ´ng Ä‘Ãºng' });
  }

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'KhÃ´ng tÃ¬m tháº¥y ngÆ°á»i dÃ¹ng' });

  db.prepare("UPDATE users SET totp_enabled = 0, totp_secret = NULL, updated_at = datetime('now','localtime') WHERE id = ?")
    .run(userId);

  res.json({ ok: true, message: 'ÄÃ£ vÃ´ hiá»‡u hÃ³a xÃ¡c thá»±c hai yáº¿u tá»‘' });
});

// â”€â”€â”€ TOTP Login Flow (step 2) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// POST /api/auth/totp/verify-login â€” verify TOTP code during login (public, rate-limited)
router.post('/totp/verify-login', loginLimiter, (req, res) => {
  const { temp_token, code } = req.body;
  if (!temp_token || !code) {
    return res.status(400).json({ error: 'Thiáº¿u temp_token hoáº·c mÃ£ xÃ¡c thá»±c' });
  }

  if (!/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: 'MÃ£ xÃ¡c thá»±c pháº£i gá»“m 6 chá»¯ sá»‘' });
  }

  let payload;
  try {
    payload = verifyToken(temp_token);
  } catch {
    return res.status(401).json({ error: 'PhiÃªn Ä‘Äƒng nháº­p háº¿t háº¡n. Vui lÃ²ng Ä‘Äƒng nháº­p láº¡i' });
  }

  if (!payload.totp_pending) {
    return res.status(400).json({ error: 'Token khÃ´ng há»£p lá»‡' });
  }

  const user = db.prepare('SELECT id, username, role, full_name, email, org_unit, totp_secret, totp_enabled FROM users WHERE id = ?').get(payload.id);
  if (!user) return res.status(404).json({ error: 'KhÃ´ng tÃ¬m tháº¥y ngÆ°á»i dÃ¹ng' });

  if (!user.totp_enabled || !user.totp_secret) {
    return res.status(400).json({ error: 'TOTP chÆ°a Ä‘Æ°á»£c kÃ­ch hoáº¡t cho tÃ i khoáº£n nÃ y' });
  }

  // RR-02: Ensure user.id is Number (type coercion fix)
  const userId = Number(user.id);
  if (totpRateLimited(userId, 5, 5 * 60 * 1000)) {
    return res.status(429).json({ error: 'QuÃ¡ nhiá»u láº§n thá»­ xÃ¡c thá»±c TOTP, vui lÃ²ng thá»­ láº¡i sau 5 phÃºt' });
  }

  const isValid = verifyTotp(code, user.totp_secret);
  if (!isValid) {
    totpRecord(userId);
    return res.status(400).json({ error: 'MÃ£ xÃ¡c thá»±c khÃ´ng Ä‘Ãºng' });
  }

  totpReset(userId);

  const jti = crypto.randomUUID();
  const token = signToken({ id: user.id, username: user.username, role: user.role, jti });

  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();

  // RR-01: Atomic session cap + insert to prevent race condition (CR-04)
  const totpSessionTxn = db.transaction(() => {
    const activeSessions = db.prepare('SELECT COUNT(*) as c FROM sessions WHERE user_id = ?').get(user.id).c;
    if (activeSessions >= 5) {
      db.prepare('DELETE FROM sessions WHERE id = (SELECT id FROM sessions WHERE user_id = ? ORDER BY created_at ASC LIMIT 1)').run(user.id);
    }
    db.prepare(
      'INSERT INTO sessions (user_id, token_jti, device, ip, expires_at) VALUES (?, ?, ?, ?, ?)'
    ).run(user.id, jti, req.headers['user-agent'] || '', req.ip || '', expiresAt);
    db.prepare('INSERT INTO login_log (username, ip, device, status) VALUES (?, ?, ?, ?)')
      .run(user.username, req.ip || '', req.headers['user-agent'] || '', 'success');
  });
  try {
    totpSessionTxn();
  } catch (err) {
    console.error(JSON.stringify({ event: 'error', route: 'TOTP verify-login', error: err.message }));
    return res.status(500).json({ error: 'Lá»—i Ä‘Äƒng nháº­p, vui lÃ²ng thá»­ láº¡i' });
  }

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

// â”€â”€â”€ Session Management â€” F-M01-010 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// GET /api/auth/sessions â€” list active sessions
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

// DELETE /api/auth/sessions/:id â€” revoke a session
router.delete('/sessions/:id', authMiddleware, (req, res) => {
  const sessionId = Number(req.params.id);
  const isAdmin = req.user.role === 'system-admin';

  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
  if (!session) return res.status(404).json({ error: 'KhÃ´ng tÃ¬m tháº¥y phiÃªn Ä‘Äƒng nháº­p' });

  if (!isAdmin && session.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Tá»« chá»‘i quyá»n truy cáº­p' });
  }

  if (session.token_jti === req.user.jti) {
    return res.status(400).json({ error: 'KhÃ´ng thá»ƒ xÃ³a phiÃªn Ä‘Äƒng nháº­p hiá»‡n táº¡i. Sá»­ dá»¥ng Ä‘Äƒng xuáº¥t thay tháº¿' });
  }

  db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);

  res.json({ ok: true, message: 'ÄÃ£ xÃ³a phiÃªn Ä‘Äƒng nháº­p' });
});

module.exports = router;
