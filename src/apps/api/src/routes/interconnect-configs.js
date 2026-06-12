const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/interconnect-configs — list all configs
router.get('/', (req, res) => {
  const { system_code, status } = req.query;
  let query = 'SELECT * FROM interconnect_config WHERE 1=1';
  const params = [];
  if (system_code) { query += ' AND system_code = ?'; params.push(system_code); }
  if (status !== undefined) { query += ' AND status = ?'; params.push(Number(status)); }
  query += ' ORDER BY system_name';
  const configs = db.prepare(query).all(...params);
  res.json({ configs });
});

// GET /api/interconnect-configs/:id — get single config
router.get('/:id', (req, res) => {
  const config = db.prepare('SELECT * FROM interconnect_config WHERE id = ?').get(req.params.id);
  if (!config) return res.status(404).json({ error: 'Không tìm thấy cấu hình' });
  res.json({ config });
});

// POST /api/interconnect-configs — create config
router.post('/', (req, res) => {
  const { system_name, system_code, endpoint_url, auth_type, auth_config } = req.body;
  if (!system_name || !system_code || !endpoint_url) {
    return res.status(400).json({ error: 'Thiếu tên, mã hệ thống và endpoint' });
  }
  const exists = db.prepare('SELECT id FROM interconnect_config WHERE system_code = ?').get(system_code);
  if (exists) return res.status(409).json({ error: 'Mã hệ thống đã tồn tại' });
  const info = db.prepare(
    'INSERT INTO interconnect_config (system_name, system_code, endpoint_url, auth_type, auth_config) VALUES (?, ?, ?, ?, ?)'
  ).run(system_name, system_code, endpoint_url, auth_type || 'api_key', auth_config || '{}');
  console.log(JSON.stringify({ event: 'created', entity: 'interconnect_config', id: info.lastInsertRowid }));
  res.status(201).json({ id: info.lastInsertRowid });
});

// PUT /api/interconnect-configs/:id — update config
router.put('/:id', (req, res) => {
  const { system_name, system_code, endpoint_url, auth_type, auth_config, status } = req.body;
  const configId = Number(req.params.id);
  const config = db.prepare('SELECT * FROM interconnect_config WHERE id = ?').get(configId);
  if (!config) return res.status(404).json({ error: 'Không tìm thấy cấu hình' });
  if (system_code && system_code !== config.system_code) {
    const exists = db.prepare('SELECT id FROM interconnect_config WHERE system_code = ? AND id != ?').get(system_code, configId);
    if (exists) return res.status(409).json({ error: 'Mã hệ thống đã tồn tại' });
  }
  db.prepare(
    "UPDATE interconnect_config SET system_name=COALESCE(?,system_name), system_code=COALESCE(?,system_code), endpoint_url=COALESCE(?,endpoint_url), auth_type=COALESCE(?,auth_type), auth_config=COALESCE(?,auth_config), status=COALESCE(?,status), updated_at=datetime('now','localtime') WHERE id=?"
  ).run(system_name, system_code, endpoint_url, auth_type, auth_config, status, configId);
  console.log(JSON.stringify({ event: 'updated', entity: 'interconnect_config', id: configId }));
  res.json({ ok: true });
});

// DELETE /api/interconnect-configs/:id — delete config
router.delete('/:id', (req, res) => {
  const configId = Number(req.params.id);
  const config = db.prepare('SELECT * FROM interconnect_config WHERE id = ?').get(configId);
  if (!config) return res.status(404).json({ error: 'Không tìm thấy cấu hình' });
  db.prepare('DELETE FROM interconnect_config WHERE id = ?').run(configId);
  console.log(JSON.stringify({ event: 'deleted', entity: 'interconnect_config', id: configId }));
  res.json({ ok: true });
});

// POST /api/interconnect-configs/:id/ping — test connectivity
router.post('/:id/ping', (req, res) => {
  const config = db.prepare('SELECT * FROM interconnect_config WHERE id = ?').get(req.params.id);
  if (!config) return res.status(404).json({ error: 'Không tìm thấy cấu hình' });
  res.json({ ok: true, message: 'Ping successful (simulated)' });
});

module.exports = router;
