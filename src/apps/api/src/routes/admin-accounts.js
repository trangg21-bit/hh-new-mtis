const express = require('express');
const db = require('../db');
const bcrypt = require('bcryptjs');

const router = express.Router();

// GET /api/admin-accounts — list all admin accounts (system-level)
router.get('/', (req, res) => {
  const accounts = db.prepare(
    "SELECT u.*, ug.name as group_name FROM users u LEFT JOIN user_groups ug ON u.role = ug.name ORDER BY u.full_name"
  ).all();
  res.json({ accounts });
});

// POST /api/admin-accounts — create admin account
router.post('/', (req, res) => {
  const { username, password, full_name, email, phone, role, org_unit } = req.body;
  if (!username || !password || !full_name) {
    return res.status(400).json({ error: 'Thiếu username, password, full_name' });
  }
  const exists = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email || '');
  if (exists) return res.status(409).json({ error: 'Username hoặc email đã tồn tại' });
  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare(
    'INSERT INTO users (username, password, full_name, email, phone, role, org_unit) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(username, hash, full_name, email, phone, role || 'Chuyên viên', org_unit);
  console.log(JSON.stringify({ event: 'created', entity: 'admin_account', id: info.lastInsertRowid }));
  res.status(201).json({ id: info.lastInsertRowid });
});

// PUT /api/admin-accounts/:id — update admin account
router.put('/:id', (req, res) => {
  const { username, full_name, email, phone, role, org_unit, status } = req.body;
  const adminId = Number(req.params.id);
  const admin = db.prepare('SELECT * FROM users WHERE id = ?').get(adminId);
  if (!admin) return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
  if (username && username !== admin.username) {
    const exists = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, adminId);
    if (exists) return res.status(409).json({ error: 'Username đã tồn tại' });
  }
  db.prepare(
    "UPDATE users SET username=COALESCE(?,username), full_name=COALESCE(?,full_name), email=COALESCE(?,email), phone=COALESCE(?,phone), role=COALESCE(?,role), org_unit=COALESCE(?,org_unit), status=COALESCE(?,status), updated_at=datetime('now','localtime') WHERE id=?"
  ).run(username, full_name, email, phone, role, org_unit, status, adminId);
  console.log(JSON.stringify({ event: 'updated', entity: 'admin_account', id: adminId }));
  res.json({ ok: true });
});

// PUT /api/admin-accounts/:id/reset-password — reset password
router.put('/:id/reset-password', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Thiếu password mới' });
  const adminId = Number(req.params.id);
  const admin = db.prepare('SELECT * FROM users WHERE id = ?').get(adminId);
  if (!admin) return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
  const hash = bcrypt.hashSync(password, 10);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, adminId);
  console.log(JSON.stringify({ event: 'reset_password', entity: 'admin_account', id: adminId }));
  res.json({ ok: true });
});

// DELETE /api/admin-accounts/:id — disable admin account
router.delete('/:id', (req, res) => {
  const adminId = Number(req.params.id);
  const admin = db.prepare('SELECT * FROM users WHERE id = ?').get(adminId);
  if (!admin) return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
  if (admin.role === 'system-admin') return res.status(403).json({ error: 'Không thể xóa tài khoản hệ thống' });
  db.prepare("UPDATE users SET status = 0, updated_at = datetime('now','localtime') WHERE id = ?").run(adminId);
  console.log(JSON.stringify({ event: 'disabled', entity: 'admin_account', id: adminId }));
  res.json({ ok: true });
});

module.exports = router;
