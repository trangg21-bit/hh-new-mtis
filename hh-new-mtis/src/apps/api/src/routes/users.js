// -*- coding: utf-8 -*-
const express = require('express');
const db = require('../db');
const { validatePassword, hashPassword, verifyPassword } = require('../services/passwordService');
const { parsePagination } = require('../utils/validation');

const router = express.Router();

// GET /api/users/roles
router.get('/roles', (req, res) => {
  res.json({ roles: ['system-admin', 'director', 'port-authority-leader', 'infrastructure-officer'] });
});

// GET /api/users — list all users with pagination, search, filter by org_id
// status: single value (e.g. "1") or comma-separated (e.g. "0,1,2")
// show_deleted: "1" → include deleted (status=0) alongside selected status values
router.get('/', (req, res) => {
  const { search, role, status, org_id, full_name, show_deleted } = req.query;
  const { page, limit, offset } = parsePagination(req.query);

  let countSql = 'SELECT COUNT(*) as c FROM users WHERE 1=1';
  let sql = 'SELECT id, username, full_name, email, org_unit, org_id, role, status, totp_enabled, created_at FROM users WHERE 1=1';
  const params = [];
  const countParams = [];

  // Multi-status + show_deleted: build final status list
  if (status !== undefined && status !== '') {
    let statuses = status.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
    if (show_deleted === '1') {
      statuses = [...new Set([...statuses, 0])];
    }
    if (statuses.length === 1) {
      sql += ' AND status = ?';
      countSql += ' AND status = ?';
      params.push(statuses[0]);
      countParams.push(statuses[0]);
    } else if (statuses.length > 1) {
      const placeholders = statuses.map(() => '?').join(',');
      sql += ` AND status IN (${placeholders})`;
      countSql += ` AND status IN (${placeholders})`;
      params.push(...statuses);
      countParams.push(...statuses);
    }
  }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const total = db.prepare(countSql).get(...countParams).c;
  const users = db.prepare(sql).all(...params);
  res.json({ users, total, page, limit });
});

// GET /api/users/:id — includes groups and org path
router.get('/:id', (req, res) => {
  const user = db.prepare(
    'SELECT id, username, full_name, email, phone, org_unit, org_id, role, status, totp_enabled, created_at, updated_at FROM users WHERE id = ?'
  ).get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Không tìm thấy' });

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
    orgPath = orgs.map(o => o.name).join(' › ');
  }

  res.json({ user, groups, org_path: orgPath });
});

// POST /api/users — create (admin only) — uses passwordService
router.post('/', (req, res) => {
  const { username, password, full_name, email, phone, org_unit, org_id, role } = req.body;
  const safe = (v) => typeof v === 'string' ? v.trim().slice(0, 255) : v;
  const u = safe(username), p = password, fn = safe(full_name), e = safe(email), ph = safe(phone);
  const validRoles = ['system-admin', 'Chuyên viên', 'Lãnh đạo Cảng vụ', 'infrastructure-officer', 'port-authority-leader', 'director'];
  if (!u || !p || !fn) return res.status(400).json({ error: 'Thiếu trường bắt buộc' });
  if (u.length > 10) return res.status(400).json({ error: 'Tên đăng nhập tối đa 10 ký tự' });
  if (e && e.length > 254) return res.status(400).json({ error: 'Email tối đa 254 ký tự' });
  if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return res.status(400).json({ error: 'Email không hợp lệ' });
  if (role && !validRoles.includes(role)) return res.status(400).json({ error: 'Role không hợp lệ' });
  if (org_id && isNaN(Number(org_id))) return res.status(400).json({ error: 'org_id phải là số' });
  const passwordErrors = validatePassword(p);
  if (passwordErrors.length > 0) return res.status(400).json({ error: passwordErrors.join('; ') });
  const hash = hashPassword(p);
  try {
    const info = db.prepare(
      'INSERT INTO users (username, password, full_name, email, phone, org_unit, org_id, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(u, hash, fn, e || null, ph || null, org_unit || null, org_id || null, role || 'infrastructure-officer');
    res.status(201).json({ id: info.lastInsertRowid });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Tên đăng nhập đã tồn tại' });
    console.error(JSON.stringify({ event: 'error', route: 'POST /api/users', error: e.message }));
    res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
  }
});

// PUT /api/users/:id — update (admin only)
router.put('/:id', (req, res) => {
  const { username, password, full_name, email, phone, org_unit, org_id, status, role } = req.body;
  const updates = [];
  const params = [];
  if (username !== undefined) { updates.push('username = ?'); params.push(username); }
  if (full_name !== undefined) { updates.push('full_name = ?'); params.push(full_name); }
  if (email !== undefined) { updates.push('email = ?'); params.push(email); }
  if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
  if (org_unit !== undefined) { updates.push('org_unit = ?'); params.push(org_unit); }
  if (org_id !== undefined) { updates.push('org_id = ?'); params.push(org_id); }
  if (role !== undefined) { updates.push('role = ?'); params.push(role); }
  if (password !== undefined) {
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) return res.status(400).json({ error: passwordErrors.join('; ') });
    const hash = hashPassword(password);
    updates.push('password = ?'); params.push(hash);
  }
  if (status !== undefined) {
    if (![0,1,2].includes(Number(status))) return res.status(400).json({ error: 'status không hợp lệ (0/1/2)' });
    updates.push('status = ?'); params.push(Number(status));
  }
  if (email !== undefined && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Email không hợp lệ' });
  if (updates.length === 0) return res.status(400).json({ error: 'Không có trường nào để cập nhật' });
  params.push(req.params.id);
  db.prepare(`UPDATE users SET ${updates.join(', ')}, updated_at = datetime('now','localtime') WHERE id = ?`)
    .run(...params);
  res.json({ ok: true });
});

// DELETE /api/users/:id — soft delete (admin only), cannot self-delete
router.delete('/:id', (req, res) => {
  const targetId = Number(req.params.id);
  if (targetId === req.user.id) {
    return res.status(400).json({ error: 'Không thể tự xóa tài khoản của chính mình' });
  }
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(targetId);
  if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng' });
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
    res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
  }
});

// ========== LOCK / UNLOCK (F-M01-008) ==========

// PUT /api/users/:id/lock — lock account (status=2), cannot self-lock
router.put('/:id/lock', (req, res) => {
  const targetId = Number(req.params.id);
  if (targetId === req.user.id) {
    return res.status(400).json({ error: 'Không thể tự khóa tài khoản của chính mình' });
  }
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(targetId);
  if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng' });
  db.prepare("UPDATE users SET status = 2, updated_at = datetime('now','localtime') WHERE id = ?").run(targetId);
  res.json({ ok: true, message: 'Đã khóa tài khoản' });
});

// PUT /api/users/:id/unlock — unlock account (status=1)
router.put('/:id/unlock', (req, res) => {
  const targetId = Number(req.params.id);
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(targetId);
  if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng' });
  db.prepare("UPDATE users SET status = 1, updated_at = datetime('now','localtime') WHERE id = ?").run(targetId);
  res.json({ ok: true, message: 'Đã mở khóa tài khoản' });
});

// DELETE /api/users/self — user self-delete (PDPD Art 9)
// CR-V3-02: Password confirmation required (same pattern as TOTP disable at auth.js:383-404)
router.delete('/self', (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Thiếu mật khẩu xác nhận' });
  }

  // CR-V3-02: Verify current password before allowing destructive action
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng' });
  if (!verifyPassword(password, user.password)) {
    return res.status(400).json({ error: 'Mật khẩu xác nhận không đúng' });
  }

  const tx = db.transaction(() => {
    // PII scrubbing on self-delete
    db.prepare("UPDATE users SET status = 0, full_name = ?, email = ?, phone = ?, totp_secret = NULL, updated_at = datetime('now','localtime') WHERE id = ?").run(`user_${req.user.id}`, null, null, req.user.id);
    db.prepare('DELETE FROM group_members WHERE user_id = ?').run(req.user.id);
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(req.user.id);
  });
  try {
    tx();
    res.json({ ok: true, message: 'Tài khoản đã được xóa' });
  } catch(e) {
    console.error(JSON.stringify({ event: 'error', route: 'DELETE /api/auth/me', error: e?.message }));
    res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
  }
});

// DG-12: Data export/portability endpoint (PDPD Art 10, GDPR Art 20)
// NOTE: authMiddleware is applied in app.js router stack
router.get('/export', (req, res) => {
  const user = db.prepare('SELECT id, username, full_name, email, phone, org_unit, role, status, totp_enabled, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng' });
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
