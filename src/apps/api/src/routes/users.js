const express = require('express');
const db = require('../db');
const { validatePassword, hashPassword, verifyPassword } = require('../services/passwordService');
const { parsePagination } = require('../utils/validation');

const router = express.Router();

// GET /api/users/roles
router.get('/roles', (req, res) => {
  res.json({ roles: ['system-admin', 'director', 'port-authority-leader', 'infrastructure-officer'] });
});

// GET /api/users â€” list all users with pagination, search, filter by org_id
router.get('/', (req, res) => {
  const { search, role, status, org_id, full_name } = req.query;
  const { page, limit, offset } = parsePagination(req.query);

  let countSql = 'SELECT COUNT(*) as c FROM users WHERE 1=1';
  let sql = 'SELECT id, username, full_name, email, org_unit, org_id, role, status, totp_enabled, created_at FROM users WHERE 1=1';
  const params = [];
  const countParams = [];

  if (search) {
    const clause = ' AND (full_name LIKE ? OR username LIKE ? OR email LIKE ?)';
    sql += clause;
    countSql += clause;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (full_name) {
    sql += ' AND full_name LIKE ?';
    countSql += ' AND full_name LIKE ?';
    params.push(`%${full_name}%`);
    countParams.push(`%${full_name}%`);
  }
  if (role) {
    sql += ' AND role = ?';
    countSql += ' AND role = ?';
    params.push(role);
    countParams.push(role);
  }
  if (status !== undefined && status !== '') {
    sql += ' AND status = ?';
    countSql += ' AND status = ?';
    params.push(Number(status));
    countParams.push(Number(status));
  }
  if (org_id) {
    sql += ' AND org_id = ?';
    countSql += ' AND org_id = ?';
    params.push(Number(org_id));
    countParams.push(Number(org_id));
  }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const total = db.prepare(countSql).get(...countParams).c;
  const users = db.prepare(sql).all(...params);
  res.json({ users, total, page, limit });
});

// GET /api/users/:id â€” includes groups and org path
router.get('/:id', (req, res) => {
  const user = db.prepare(
    'SELECT id, username, full_name, email, phone, org_unit, org_id, role, status, totp_enabled, created_at, updated_at FROM users WHERE id = ?'
  ).get(req.params.id);
  if (!user) return res.status(404).json({ error: 'KhÃ´ng tÃ¬m tháº¥y' });

  const groups = db.prepare(`
    SELECT ug.id, ug.name, ug.description
    FROM group_members gm
    JOIN user_groups ug ON gm.group_id = ug.id
    WHERE gm.user_id = ?
    ORDER BY ug.name
  `).all(user.id);

  let orgPath = null;
  if (user.org_id) {
    const allOrgs = db.prepare('SELECT id, name, parent_id FROM organizations').all();
    const orgMap = new Map(allOrgs.map(o => [o.id, o]));
    const orgs = [];
    let current = orgMap.get(user.org_id);
    while (current) {
      orgs.unshift({ id: current.id, name: current.name });
      current = current.parent_id ? orgMap.get(current.parent_id) : null;
    }
    orgPath = orgs.map(o => o.name).join(' â€º ');
  }

  res.json({ user, groups, org_path: orgPath });
});

// POST /api/users â€” create (admin only) â€” uses passwordService
router.post('/', (req, res) => {
  const { username, password, full_name, email, phone, org_unit, org_id, role } = req.body;
  const safe = (v) => typeof v === 'string' ? v.trim().slice(0, 255) : v;
  const u = safe(username), p = password, fn = safe(full_name), e = safe(email), ph = safe(phone);
  const validRoles = ['system-admin', 'ChuyÃªn viÃªn', 'LÃ£nh Ä‘áº¡o Cáº£ng vá»¥', 'infrastructure-officer', 'port-authority-leader', 'director'];
  if (!u || !p || !fn) return res.status(400).json({ error: 'Thiáº¿u trÆ°á»ng báº¯t buá»™c' });
  if (u.length > 10) return res.status(400).json({ error: 'TÃªn Ä‘Äƒng nháº­p tá»‘i Ä‘a 10 kÃ½ tá»±' });
  if (e && e.length > 254) return res.status(400).json({ error: 'Email tá»‘i Ä‘a 20 kÃ½ tá»±' });
  if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return res.status(400).json({ error: 'Email khÃ´ng há»£p lá»‡' });
  if (role && !validRoles.includes(role)) return res.status(400).json({ error: 'Role khÃ´ng há»£p lá»‡' });
  if (org_id && isNaN(Number(org_id))) return res.status(400).json({ error: 'org_id pháº£i lÃ  sá»‘' });
  const passwordErrors = validatePassword(p);
  if (passwordErrors.length > 0) return res.status(400).json({ error: passwordErrors.join('; ') });
  const hash = hashPassword(p);
  try {
    const info = db.prepare(
      'INSERT INTO users (username, password, full_name, email, phone, org_unit, org_id, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(u, hash, fn, e || null, ph || null, org_unit || 'Cáº£ng vá»¥ HÃ ng háº£i Háº£i PhÃ²ng', org_id || null, role || 'ChuyÃªn viÃªn');
    res.status(201).json({ id: info.lastInsertRowid });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'TÃªn Ä‘Äƒng nháº­p Ä‘Ã£ tá»“n táº¡i' });
    console.error(JSON.stringify({ event: 'error', route: 'POST /api/users', error: e.message }));
    res.status(500).json({ error: 'Lá»—i mÃ¡y chá»§ ná»™i bá»™' });
  }
});

// PUT /api/users/:id â€” update (admin only)
router.put('/:id', (req, res) => {
  const { full_name, email, phone, org_unit, org_id, status } = req.body;
  const updates = [];
  const params = [];
  if (full_name !== undefined) { updates.push('full_name = ?'); params.push(full_name); }
  if (email !== undefined) { updates.push('email = ?'); params.push(email); }
  if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
  if (org_unit !== undefined) { updates.push('org_unit = ?'); params.push(org_unit); }
  if (org_id !== undefined) { updates.push('org_id = ?'); params.push(org_id); }
  if (status !== undefined) {
    if (![0,1,2].includes(Number(status))) return res.status(400).json({ error: 'status khÃ´ng há»£p lá»‡ (0/1/2)' });
    updates.push('status = ?'); params.push(Number(status));
  }
  if (email !== undefined && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Email khÃ´ng há»£p lá»‡' });
  if (updates.length === 0) return res.status(400).json({ error: 'KhÃ´ng cÃ³ trÆ°á»ng nÃ o Ä‘á»ƒ cáº­p nháº­t' });
  params.push(req.params.id);
  db.prepare(`UPDATE users SET ${updates.join(', ')}, updated_at = datetime('now','localtime') WHERE id = ?`)
    .run(...params);
  res.json({ ok: true });
});

// DELETE /api/users/:id â€” soft delete (admin only), cannot self-delete
router.delete('/:id', (req, res) => {
  const targetId = Number(req.params.id);
  if (targetId === req.user.id) {
    return res.status(400).json({ error: 'KhÃ´ng thá»ƒ tá»± xÃ³a tÃ i khoáº£n cá»§a chÃ­nh mÃ¬nh' });
  }
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(targetId);
  if (!user) return res.status(404).json({ error: 'KhÃ´ng tÃ¬m tháº¥y ngÆ°á»i dÃ¹ng' });
  try {
    // Clear foreign key references first to avoid FK constraint in transaction
    db.prepare('DELETE FROM group_members WHERE user_id = ?').run(targetId);
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(targetId);
    db.prepare('DELETE FROM password_history WHERE user_id = ?').run(targetId);
    db.prepare('DELETE FROM reset_tokens WHERE user_id = ?').run(targetId);
    // Soft delete + PII scrubbing for compliance (PDPD Art 9)
    db.prepare("UPDATE users SET status = 0, full_name = ?, email = ?, phone = ?, totp_secret = NULL, updated_at = datetime('now','localtime') WHERE id = ?").run(`user_${targetId}`, null, null, targetId);
    res.json({ ok: true });
  } catch(e) {
    console.error(JSON.stringify({ event: 'error', route: 'DELETE /api/users/:id', error: e?.message }));
    res.status(500).json({ error: 'Lá»—i mÃ¡y chá»§ ná»™i bá»™' });
  }
});

// ========== LOCK / UNLOCK (F-M01-008) ==========

// PUT /api/users/:id/lock â€” lock account (status=2), cannot self-lock
router.put('/:id/lock', (req, res) => {
  const targetId = Number(req.params.id);
  if (targetId === req.user.id) {
    return res.status(400).json({ error: 'KhÃ´ng thá»ƒ tá»± khÃ³a tÃ i khoáº£n cá»§a chÃ­nh mÃ¬nh' });
  }
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(targetId);
  if (!user) return res.status(404).json({ error: 'KhÃ´ng tÃ¬m tháº¥y ngÆ°á»i dÃ¹ng' });
  db.prepare("UPDATE users SET status = 2, updated_at = datetime('now','localtime') WHERE id = ?").run(targetId);
  res.json({ ok: true, message: 'ÄÃ£ khÃ³a tÃ i khoáº£n' });
});

// PUT /api/users/:id/unlock â€” unlock account (status=1)
router.put('/:id/unlock', (req, res) => {
  const targetId = Number(req.params.id);
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(targetId);
  if (!user) return res.status(404).json({ error: 'KhÃ´ng tÃ¬m tháº¥y ngÆ°á»i dÃ¹ng' });
  db.prepare("UPDATE users SET status = 1, updated_at = datetime('now','localtime') WHERE id = ?").run(targetId);
  res.json({ ok: true, message: 'ÄÃ£ má»Ÿ khÃ³a tÃ i khoáº£n' });
});

// DELETE /api/users/self â€” user self-delete (PDPD Art 9)
// CR-V3-02: Password confirmation required (same pattern as TOTP disable at auth.js:383-404)
router.delete('/self', (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Thiáº¿u máº­t kháº©u xÃ¡c nháº­n' });
  }

  // CR-V3-02: Verify current password before allowing destructive action
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'KhÃ´ng tÃ¬m tháº¥y ngÆ°á»i dÃ¹ng' });
  if (!verifyPassword(password, user.password)) {
    return res.status(400).json({ error: 'Máº­t kháº©u xÃ¡c nháº­n khÃ´ng Ä‘Ãºng' });
  }

  const tx = db.transaction(() => {
    // PII scrubbing on self-delete
    db.prepare("UPDATE users SET status = 0, full_name = ?, email = ?, phone = ?, totp_secret = NULL, updated_at = datetime('now','localtime') WHERE id = ?").run(`user_${req.user.id}`, null, null, req.user.id);
    db.prepare('DELETE FROM group_members WHERE user_id = ?').run(req.user.id);
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(req.user.id);
  });
  try {
    tx();
    res.json({ ok: true, message: 'TÃ i khoáº£n Ä‘Ã£ Ä‘Æ°á»£c xÃ³a' });
  } catch(e) {
    console.error(JSON.stringify({ event: 'error', route: 'DELETE /api/auth/me', error: e?.message }));
    res.status(500).json({ error: 'Lá»—i mÃ¡y chá»§ ná»™i bá»™' });
  }
});

// DG-12: Data export/portability endpoint (PDPD Art 10, GDPR Art 20)
// NOTE: authMiddleware is applied in app.js router stack
router.get('/export', (req, res) => {
  const user = db.prepare('SELECT id, username, full_name, email, phone, org_unit, role, status, totp_enabled, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'KhÃ´ng tÃ¬m tháº¥y ngÆ°á»i dÃ¹ng' });
  const groups = db.prepare(`
    SELECT ug.name FROM group_members gm JOIN user_groups ug ON gm.group_id = ug.id WHERE gm.user_id = ?
  `).all(req.user.id).map(g => g.name);
  const loginLog = db.prepare('SELECT username, status, logged_at FROM login_log WHERE username = ? ORDER BY logged_at DESC LIMIT 100').all(req.user.username);
  const sessions = db.prepare('SELECT device, ip, created_at, expires_at, last_active_at FROM sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 100').all(req.user.id);

  res.json({
    user,
    groups,
    login_log: loginLog,
    sessions: sessions.map(s => ({ ...s, ip: s.ip ? s.ip.slice(0, 3) + '***' : null })) // partial IP masking
  });
});

module.exports = router;
