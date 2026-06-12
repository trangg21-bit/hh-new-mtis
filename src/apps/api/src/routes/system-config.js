const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/system-config — list all configs with filter
router.get('/', (req, res) => {
  const { category, key } = req.query;
  let query = 'SELECT * FROM system_config WHERE 1=1';
  const params = [];
  if (category) { query += ' AND category = ?'; params.push(category); }
  if (key) { query += ' AND key LIKE ?'; params.push(`%${key}%`); }
  query += ' ORDER BY category, key';
  const configs = db.prepare(query).all(...params);
  res.json({ configs });
});

// GET /api/system-config/:key — get single config
router.get('/:key', (req, res) => {
  const config = db.prepare('SELECT * FROM system_config WHERE key = ?').get(req.params.key);
  if (!config) return res.status(404).json({ error: 'Không tìm thấy cấu hình hệ thống' });
  res.json({ config });
});

// POST /api/system-config — create/update config
router.post('/', (req, res) => {
  const { key, value, description, category } = req.body;
  if (!key) return res.status(400).json({ error: 'Thiếu key' });
  const exists = db.prepare('SELECT id FROM system_config WHERE key = ?').get(key);
  if (exists) {
    db.prepare(
      "UPDATE system_config SET value=?, description=COALESCE(?,description), category=COALESCE(?,category), updated_at=datetime('now','localtime') WHERE key=?"
    ).run(value, description, category, key);
    console.log(JSON.stringify({ event: 'updated', entity: 'system_config', key }));
  } else {
    db.prepare(
      'INSERT INTO system_config (key, value, description, category) VALUES (?, ?, ?, ?)'
    ).run(key, value, description, category || 'general');
    console.log(JSON.stringify({ event: 'created', entity: 'system_config', key }));
  }
  res.json({ ok: true });
});

// DELETE /api/system-config/:key — delete config
router.delete('/:key', (req, res) => {
  const config = db.prepare('SELECT * FROM system_config WHERE key = ?').get(req.params.key);
  if (!config) return res.status(404).json({ error: 'Không tìm thấy cấu hình hệ thống' });
  db.prepare('DELETE FROM system_config WHERE key = ?').run(req.params.key);
  console.log(JSON.stringify({ event: 'deleted', entity: 'system_config', key: req.params.key }));
  res.json({ ok: true });
});

module.exports = router;
