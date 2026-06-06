const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'mtis-dev-secret-key-2026';

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Thiếu tên đăng nhập hoặc mật khẩu' });
  }
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND status = 1').get(username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    db.prepare('INSERT INTO login_log (username, status) VALUES (?, ?)').run(username, 'failed');
    return res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu' });
  }
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
  db.prepare('INSERT INTO login_log (username, ip, device, status) VALUES (?, ?, ?, ?)').run(username, req.ip || '', req.headers['user-agent'] || '', 'success');
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

// GET /api/auth/me
router.get('/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Chưa đăng nhập' });
  try {
    const decoded = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET);
    const user = db.prepare('SELECT id, username, full_name, email, phone, org_unit, role FROM users WHERE id = ?').get(decoded.id);
    if (!user) return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    res.json({ user });
  } catch {
    res.status(401).json({ error: 'Token không hợp lệ' });
  }
});

module.exports = router;
