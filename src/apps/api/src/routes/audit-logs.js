const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/audit-logs — list audit logs with pagination
router.get('/', (req, res) => {
  const { user_id, action, entity_type, from, to, page = 1, limit = 50 } = req.query;
  let query = `
    SELECT al.*, u.full_name as actor_name
    FROM audit_log al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE 1=1
  `;
  const params = [];
  if (user_id) { query += ' AND al.user_id = ?'; params.push(Number(user_id)); }
  if (action) { query += ' AND al.action LIKE ?'; params.push(`%${action}%`); }
  if (entity_type) { query += ' AND al.entity_type = ?'; params.push(entity_type); }
  if (from) { query += ' AND al.created_at >= ?'; params.push(from); }
  if (to) { query += ' AND al.created_at <= ?'; params.push(to); }
  query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), (Number(page) - 1) * Number(limit));
  const logs = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as c FROM audit_log').all()[0].c;
  res.json({ logs, total, page: Number(page), limit: Number(limit) });
});

// GET /api/audit-logs/export — export logs as CSV (simulated)
router.get('/export', (req, res) => {
  res.json({ format: 'csv', message: 'Export endpoint (CSV download)' });
});

module.exports = router;
