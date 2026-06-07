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
  let sql = 'SELECT id, username, full_name, email, phone, org_unit, org_id, role, status, totp_enabled, created_at FROM users WHERE 1=1';
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
    const orgs = [];
    let current = db.prepare('SELECT id, name, parent_id FROM organizations WHERE id = ?').get(user.org_id);
    while (current) {
      orgs.unshift({ id: current.id, name: current.name });
      current = current.parent_id ? db.prepare('SELECT id, name, parent_id FROM organizations WHERE id = ?').get(current.parent_id) : null;
    }
    orgPath = orgs.map(o => o.name).join(' › ');
  }

  res.json({ user, groups, org_path: orgPath });
});

// POST /api/users — create (admin only) — uses passwordService
router.post('/', (req, res) => {
  const { username, password, full_name, email, phone, org_unit, org_id, role } = req.body;
  if (!username || !password || !full_name) return res.status(400).json({ error: 'Thiếu trường bắt buộc' });
  const passwordErrors = validatePassword(password);
  if (passwordErrors.length > 0) return res.status(400).json({ error: passwordErrors.join('; ') });
  const hash = hashPassword(password);
  try {
    const info = db.prepare(
      'INSERT INTO users (username, password, full_name, email, phone, org_unit, org_id, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(username, hash, full_name, email, phone, org_unit || 'Cảng vụ Hàng hải Hải Phòng', org_id || null, role || 'Chuyên viên');
    res.status(201).json({ id: info.lastInsertRowid });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Tên đăng nhập đã tồn tại' });
    res.status(500).json({ error: e.message });
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
  if (status !== undefined) { updates.push('status = ?'); params.push(status); }
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
  db.prepare("UPDATE users SET status = 0, updated_at = datetime('now','localtime') WHERE id = ?").run(targetId);
  res.json({ ok: true });
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

// ========== GROUPS (inline groups list for convenience) ==========
router.get('/groups/list', (req, res) => {
  const groups = db.prepare(`
    SELECT g.*, 
      (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) as member_count
    FROM user_groups g ORDER BY g.name
  `).all();
  res.json({ groups });
});

router.post('/groups', (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Thiếu tên nhóm' });
  try {
    const info = db.prepare('INSERT INTO user_groups (name, description) VALUES (?, ?)').run(name, description);
    res.status(201).json({ id: info.lastInsertRowid });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Tên nhóm đã tồn tại' });
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
