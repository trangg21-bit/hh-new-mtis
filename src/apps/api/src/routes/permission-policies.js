const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/permission-policies — list all permission policies
router.get('/', (req, res) => {
  const policies = db.prepare(
    `SELECT gp.*, ug.name as group_name FROM group_permissions gp 
     JOIN user_groups ug ON gp.group_id = ug.id ORDER BY ug.name, gp.feature_code`
  ).all();
  res.json({ policies });
});

// POST /api/permission-policies — update/create policy
router.post('/', (req, res) => {
  const { group_id, feature_code, can_create, can_read, can_update, can_delete } = req.body;
  if (!group_id || !feature_code) {
    return res.status(400).json({ error: 'Thiếu group_id và feature_code' });
  }
  db.prepare(
    `INSERT OR REPLACE INTO group_permissions 
     (group_id, feature_code, can_create, can_read, can_update, can_delete, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now','localtime'))`
  ).run(group_id, feature_code, can_create, can_read, can_update, can_delete);
  console.log(JSON.stringify({ event: 'updated', entity: 'permission_policy', group_id, feature_code }));
  res.json({ ok: true });
});

// DELETE /api/permission-policies — delete policy
router.delete('/', (req, res) => {
  const { group_id, feature_code } = req.query;
  if (!group_id || !feature_code) {
    return res.status(400).json({ error: 'Thiếu group_id và feature_code' });
  }
  db.prepare('DELETE FROM group_permissions WHERE group_id = ? AND feature_code = ?').run(group_id, feature_code);
  console.log(JSON.stringify({ event: 'deleted', entity: 'permission_policy', group_id, feature_code }));
  res.json({ ok: true });
});

module.exports = router;
