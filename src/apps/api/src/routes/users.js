const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');

const router = express.Router();

// GET /api/users — list all users
router.get('/', (req, res) => {
  const { search, role, status, page = 1, limit = 20 } = req.query;
  let sql = 'SELECT id, username, full_name, email, phone, org_unit, role, status, created_at FROM users WHERE 1=1';
  const params = [];
  if (search) { sql += ' AND (full_name LIKE ? OR username LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (role) { sql += ' AND role = ?'; params.push(role); }
  if (status) { sql += ' AND status = ?'; params.push(Number(status)); }
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  const offset = (Number(page) - 1) * Number(limit);
  params.push(Number(limit), offset);
  const users = db.prepare(sql).all(...params);
  const total = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  res.json({ users, total, page: Number(page), limit: Number(limit) });
});

// GET /api/users/:id
router.get('/:id', (req, res) => {
  const user = db.prepare('SELECT id, username, full_name, email, phone, org_unit, role, status, created_at, updated_at FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Không tìm thấy' });
  res.json({ user });
});

// POST /api/users — create
router.post('/', (req, res) => {
  const { username, password, full_name, email, phone, org_unit, role } = req.body;
  if (!username || !password || !full_name) return res.status(400).json({ error: 'Thiếu trường bắt buộc' });
  const hash = bcrypt.hashSync(password, 10);
  try {
    const info = db.prepare('INSERT INTO users (username, password, full_name, email, phone, org_unit, role) VALUES (?, ?, ?, ?, ?, ?, ?)').run(username, hash, full_name, email, phone, org_unit || 'Cảng vụ Hàng hải Hải Phòng', role || 'Chuyên viên');
    res.status(201).json({ id: info.lastInsertRowid });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Tên đăng nhập đã tồn tại' });
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/users/:id — update
router.put('/:id', (req, res) => {
  const { full_name, email, phone, org_unit, role, status } = req.body;
  db.prepare('UPDATE users SET full_name = ?, email = ?, phone = ?, org_unit = ?, role = ?, status = ?, updated_at = datetime(\'now\',\'localtime\') WHERE id = ?')
    .run(full_name, email, phone, org_unit, role, status ?? 1, req.params.id);
  res.json({ ok: true });
});

// DELETE /api/users/:id — soft delete (set status = 0)
router.delete('/:id', (req, res) => {
  db.prepare('UPDATE users SET status = 0, updated_at = datetime(\'now\',\'localtime\') WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ========== GROUPS ==========
router.get('/groups/list', (req, res) => {
  const groups = db.prepare('SELECT * FROM user_groups ORDER BY name').all();
  res.json({ groups });
});

router.post('/groups', (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Thiếu tên nhóm' });
  const info = db.prepare('INSERT INTO user_groups (name, description) VALUES (?, ?)').run(name, description);
  res.status(201).json({ id: info.lastInsertRowid });
});

module.exports = router;
