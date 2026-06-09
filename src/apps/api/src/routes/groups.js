const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/users/groups — list all groups with member count
router.get('/', (req, res) => {
  const groups = db.prepare(`
    SELECT g.*, (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) as member_count
    FROM user_groups g ORDER BY g.name
  `).all();
  res.json({ groups });
});

// POST /api/users/groups — create group
router.post('/', (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Thiếu tên nhóm' });
  try {
    const info = db.prepare('INSERT INTO user_groups (name, description) VALUES (?, ?)').run(name, description);
    res.status(201).json({ id: info.lastInsertRowid });
  } catch(e) {
    console.error(JSON.stringify({ event: 'error', route: 'POST /api/users/groups', error: e?.message }));
    res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
  }
});

// DELETE /api/users/groups/:id — delete group (fails if has members)
router.delete('/:id', (req, res) => {
  const groupId = req.params.id;
  const memberCount = db.prepare('SELECT COUNT(*) as c FROM group_members WHERE group_id = ?').get(groupId).c;
  if (memberCount > 0) {
    return res.status(400).json({ error: 'Không thể xóa nhóm có thành viên. Vui lòng xóa thành viên trước.' });
  }
  db.prepare('DELETE FROM user_groups WHERE id = ?').run(groupId);
  res.json({ ok: true });
});

// PUT /api/users/groups/:id — update group
router.put('/:id', (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Thiếu tên nhóm' });
  try {
    db.prepare("UPDATE user_groups SET name = ?, description = ? WHERE id = ?").run(name, description, req.params.id);
    res.json({ ok: true });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Tên nhóm đã tồn tại' });
    res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
  }
});

// GET /api/users/groups/:id/members — list group members
router.get('/:id/members', (req, res) => {
  const groupId = req.params.id;
  const members = db.prepare(`
    SELECT u.id, u.username, u.full_name, u.email, u.role
    FROM group_members gm
    JOIN users u ON gm.user_id = u.id
    WHERE gm.group_id = ?
    ORDER BY u.full_name
  `).all(groupId);
  res.json({ members });
});

// POST /api/users/groups/:id/members — add member to group
router.post('/:id/members', (req, res) => {
  const groupId = req.params.id;
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'Thiếu user_id' });
  try {
    db.prepare('INSERT INTO group_members (user_id, group_id) VALUES (?, ?)').run(user_id, groupId);
    res.status(201).json({ ok: true });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Thành viên đã tồn tại trong nhóm' });
    res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
  }
});

// DELETE /api/users/groups/:id/members/:userId — remove member from group
router.delete('/:id/members/:userId', (req, res) => {
  db.prepare('DELETE FROM group_members WHERE group_id = ? AND user_id = ?').run(req.params.id, req.params.userId);
  res.json({ ok: true });
});

module.exports = router;
