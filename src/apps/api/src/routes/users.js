const express = require('express');
const db = require('../db');
const { validatePassword, hashPassword } = require('../services/passwordService');
const { parsePagination } = require('../utils/validation');

const router = express.Router();

// GET /api/users — list all users with pagination, search, filter by org_id
router.get('/', (req, res) => {
  const { search, role, status, org_id } = req.query;
  const { page, limit, offset } = parsePagination(req.query);

  let countSql = 'SELECT COUNT(*) as c FROM users WHERE 1=1';
  let sql = 'SELECT id, username, full_name, org_unit, org_id, role, status, totp_enabled, created_at FROM users WHERE 1=1';
  const params = [];
  const countParams = [];

  if (search) {
    const clause = ' AND (full_name LIKE ? OR username LIKE ?)';
    sql += clause;
    countSql += clause;
    params.push(`%${search}%`, `%${search}%`);
    countParams.push(`%${search}%`, `%${search}%`);
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
  if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return res.status(400).json({ error: 'Email không hợp lệ' });
  if (role && !validRoles.includes(role)) return res.status(400).json({ error: 'Role không hợp lệ' });
  if (org_id && isNaN(Number(org_id))) return res.status(400).json({ error: 'org_id phải là số' });
  const passwordErrors = validatePassword(p);
  if (passwordErrors.length > 0) return res.status(400).json({ error: passwordErrors.join('; ') });
  const hash = hashPassword(p);
  try {
    const info = db.prepare(
      'INSERT INTO users (username, password, full_name, email, phone, org_unit, org_id, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(u, hash, fn, e || null, ph || null, org_unit || 'Cảng vụ Hàng hải Hải Phòng', org_id || null, role || 'Chuyên viên');
    res.status(201).json({ id: info.lastInsertRowid });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Tên đăng nhập đã tồn tại' });
    console.error(JSON.stringify({ event: 'error', route: 'POST /api/users', error: e.message }));
    res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
  }
});

// PUT /api/users/:id — update (admin only)
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
  const tx = db.transaction(() => {
    db.prepare("UPDATE users SET status = 0, updated_at = datetime('now','localtime') WHERE id = ?").run(targetId);
    db.prepare('DELETE FROM group_members WHERE user_id = ?').run(targetId);
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(targetId);
  });
  try {
    tx();
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

// DELETE /api/auth/me — user self-delete (PDPD Art 9)
router.delete('/self', (req, res) => {
  const tx = db.transaction(() => {
    db.prepare("UPDATE users SET status = 0, updated_at = datetime('now','localtime') WHERE id = ?").run(req.user.id);
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

module.exports = router;
