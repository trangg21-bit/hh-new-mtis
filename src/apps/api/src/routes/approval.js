const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/approval-workflows — list all workflows
router.get('/workflows', (req, res) => {
  const workflows = db.prepare("SELECT * FROM approval_workflows WHERE status = 1 ORDER BY name").all();
  res.json({ workflows });
});

// GET /api/approval-requests — list requests (with filter)
router.get('/requests', (req, res) => {
  const { status, requester_id, workflow_id } = req.query;
  let query = `
    SELECT ar.*, u.full_name as requester_name, w.name as workflow_name
    FROM approval_requests ar
    JOIN users u ON ar.requester_id = u.id
    JOIN approval_workflows w ON ar.workflow_id = w.id
    WHERE 1=1
  `;
  const params = [];
  if (status) { query += ' AND ar.status = ?'; params.push(status); }
  if (requester_id) { query += ' AND ar.requester_id = ?'; params.push(Number(requester_id)); }
  if (workflow_id) { query += ' AND ar.workflow_id = ?'; params.push(Number(workflow_id)); }
  query += ' ORDER BY ar.created_at DESC';
  const requests = db.prepare(query).all(...params);
  res.json({ requests });
});

// POST /api/approval-requests — create request
router.post('/requests', (req, res) => {
  const { workflow_id, title, content, requester_id } = req.body;
  if (!workflow_id || !title || !requester_id) {
    return res.status(400).json({ error: 'Thiếu workflow_id, title, requester_id' });
  }
  const workflow = db.prepare('SELECT * FROM approval_workflows WHERE id = ?').get(workflow_id);
  if (!workflow) return res.status(404).json({ error: 'Workflow không tồn tại' });
  const info = db.prepare(
    'INSERT INTO approval_requests (workflow_id, requester_id, title, content) VALUES (?, ?, ?, ?)'
  ).run(workflow_id, Number(requester_id), title, content || '');
  console.log(JSON.stringify({ event: 'created', entity: 'approval_request', id: info.lastInsertRowid }));
  res.status(201).json({ id: info.lastInsertRowid });
});

// POST /api/approval-actions — perform approval action
router.post('/actions', (req, res) => {
  const { request_id, actor_id, action, comment } = req.body;
  if (!request_id || !actor_id || !action) {
    return res.status(400).json({ error: 'Thiếu request_id, actor_id, action' });
  }
  const request = db.prepare('SELECT * FROM approval_requests WHERE id = ?').get(request_id);
  if (!request) return res.status(404).json({ error: 'Yêu cầu không tồn tại' });
  if (request.status !== 'pending') {
    return res.status(400).json({ error: 'Yêu cầu không còn trạng thái pending' });
  }
  db.prepare(
    'INSERT INTO approval_actions (request_id, actor_id, action, comment) VALUES (?, ?, ?, ?)'
  ).run(request_id, Number(actor_id), action, comment || '');
  // Determine next step
  const wf = db.prepare('SELECT * FROM approval_workflows WHERE id = ?').get(request.workflow_id);
  let newStatus = 'pending';
  let nextStep = request.current_step + 1;
  if (action === 'reject') {
    newStatus = 'rejected';
    nextStep = request.current_step;
  } else if (action === 'approve') {
    const stepCol = `step${nextStep}_actor`;
    if (wf[stepCol]) {
      nextStep = request.current_step + 1;
    } else {
      newStatus = 'completed';
    }
  }
  db.prepare(
    "UPDATE approval_requests SET status=?, current_step=?, updated_at=datetime('now','localtime') WHERE id=?"
  ).run(newStatus, nextStep, request_id);
  console.log(JSON.stringify({ event: 'approved', entity: 'approval_action', request_id }));
  res.json({ ok: true, newStatus });
});

// GET /api/approval-actions/:request_id — list actions for a request
router.get('/actions/:request_id', (req, res) => {
  const actions = db.prepare(
    "SELECT aa.*, u.full_name as actor_name FROM approval_actions aa JOIN users u ON aa.actor_id = u.id WHERE aa.request_id = ? ORDER BY aa.created_at"
  ).all(Number(req.params.request_id));
  res.json({ actions });
});

module.exports = router;
