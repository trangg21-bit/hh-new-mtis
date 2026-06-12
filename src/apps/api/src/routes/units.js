const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/units — list all units with tree structure
router.get('/', (req, res) => {
  const { parent_id, status, type } = req.query;
  let query = 'SELECT * FROM unit_management WHERE 1=1';
  const params = [];
  if (parent_id !== undefined) { query += ' AND parent_id = ?'; params.push(parent_id); }
  if (status !== undefined) { query += ' AND status = ?'; params.push(Number(status)); }
  if (type !== undefined) { query += ' AND type = ?'; params.push(type); }
  query += ' ORDER BY sort_order, name';
  const units = db.prepare(query).all(...params);
  res.json({ units });
});

// GET /api/units/tree — hierarchical tree view
router.get('/tree', (req, res) => {
  const all = db.prepare('SELECT * FROM unit_management WHERE status = 1 ORDER BY sort_order, name').all();
  const buildTree = (parentId = null) => {
    return all
      .filter(u => u.parent_id === parentId)
      .map(u => ({ ...u, children: buildTree(u.id) }));
  };
  res.json({ tree: buildTree() });
});

// GET /api/units/:id — get single unit
router.get('/:id', (req, res) => {
  const unit = db.prepare('SELECT * FROM unit_management WHERE id = ?').get(req.params.id);
  if (!unit) return res.status(404).json({ error: 'Không tìm thấy đơn vị' });
  res.json({ unit });
});

// POST /api/units — create unit
router.post('/', (req, res) => {
  const { name, code, parent_id, type, sort_order } = req.body;
  if (!name || !code) return res.status(400).json({ error: 'Thiếu tên và mã đơn vị' });
  if (parent_id) {
    const parent = db.prepare('SELECT id FROM unit_management WHERE id = ?').get(parent_id);
    if (!parent) return res.status(400).json({ error: 'Đơn vị cha không tồn tại' });
  }
  const exists = db.prepare('SELECT id FROM unit_management WHERE code = ?').get(code);
  if (exists) return res.status(409).json({ error: 'Mã đơn vị đã tồn tại' });
  const info = db.prepare(
    'INSERT INTO unit_management (name, code, parent_id, type, sort_order) VALUES (?, ?, ?, ?, ?)'
  ).run(name, code, parent_id || null, type || 'department', sort_order || 0);
  console.log(JSON.stringify({ event: 'created', entity: 'unit', id: info.lastInsertRowid }));
  res.status(201).json({ id: info.lastInsertRowid });
});

// PUT /api/units/:id — update unit
router.put('/:id', (req, res) => {
  const { name, code, parent_id, type, status, sort_order } = req.body;
  const unitId = Number(req.params.id);
  if (!name || !code) return res.status(400).json({ error: 'Thiếu tên và mã đơn vị' });
  const unit = db.prepare('SELECT * FROM unit_management WHERE id = ?').get(unitId);
  if (!unit) return res.status(404).json({ error: 'Không tìm thấy đơn vị' });
  const exists = db.prepare('SELECT id FROM unit_management WHERE code = ? AND id != ?').get(code, unitId);
  if (exists) return res.status(409).json({ error: 'Mã đơn vị đã tồn tại' });
  if (parent_id && Number(parent_id) === unitId) return res.status(400).json({ error: 'Không thể đặt chính nó làm cha' });
  if (parent_id) {
    const parent = db.prepare('SELECT id FROM unit_management WHERE id = ?').get(parent_id);
    if (!parent) return res.status(400).json({ error: 'Đơn vị cha không tồn tại' });
  }
  db.prepare(
    "UPDATE unit_management SET name=?, code=?, parent_id=?, type=?, status=COALESCE(?,status), sort_order=COALESCE(?,sort_order), updated_at=datetime('now','localtime') WHERE id=?"
  ).run(name, code, parent_id || null, type || unit.type, status, sort_order, unitId);
  console.log(JSON.stringify({ event: 'updated', entity: 'unit', id: unitId }));
  res.json({ ok: true });
});

// DELETE /api/units/:id — delete unit
router.delete('/:id', (req, res) => {
  const unitId = Number(req.params.id);
  const unit = db.prepare('SELECT * FROM unit_management WHERE id = ?').get(unitId);
  if (!unit) return res.status(404).json({ error: 'Không tìm thấy đơn vị' });
  const childCount = db.prepare('SELECT COUNT(*) as c FROM unit_management WHERE parent_id = ?').get(unitId).c;
  if (childCount > 0) return res.status(400).json({ error: 'Không thể xóa đơn vị có đơn vị con' });
  const userCount = db.prepare('SELECT COUNT(*) as c FROM users WHERE org_unit = ?').get(unit.name).c;
  if (userCount > 0) return res.status(400).json({ error: 'Không thể xóa đơn vị còn người dùng' });
  db.prepare('DELETE FROM unit_management WHERE id = ?').run(unitId);
  console.log(JSON.stringify({ event: 'deleted', entity: 'unit', id: unitId }));
  res.json({ ok: true });
});

module.exports = router;
