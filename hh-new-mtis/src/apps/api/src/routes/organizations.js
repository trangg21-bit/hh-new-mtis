// -*- coding: utf-8 -*-
const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/organizations � list all orgs (flat with parent_id)
router.get('/', (req, res) => {
  const orgs = db.prepare('SELECT * FROM organizations ORDER BY sort_order, name').all();
  res.json({ organizations: orgs });
});

// POST /api/organizations � create org node
router.post('/', (req, res) => {
  const { name, description, parent_id, sort_order } = req.body;
  if (!name) return res.status(400).json({ error: 'Thi?u t�n don v?' });

  // Validate parent_id if provided
  if (parent_id) {
    const parent = db.prepare('SELECT id FROM organizations WHERE id = ?').get(parent_id);
    if (!parent) return res.status(400).json({ error: '�on v? cha kh�ng t?n t?i' });
  }

  const info = db.prepare(
    'INSERT INTO organizations (name, description, parent_id, sort_order) VALUES (?, ?, ?, ?)'
  ).run(name, description, parent_id || null, sort_order || 0);
  console.log(JSON.stringify({ event: 'created', entity: 'organization', id: info.lastInsertRowid }));
  res.status(201).json({ id: info.lastInsertRowid });
});

// PUT /api/organizations/:id � update org node
router.put('/:id', (req, res) => {
  const { name, description, parent_id, sort_order } = req.body;
  if (!name) return res.status(400).json({ error: 'Thi?u t�n don v?' });

  // Prevent circular reference: cannot set parent to itself
  const orgId = Number(req.params.id);
  if (parent_id && Number(parent_id) === orgId) {
    return res.status(400).json({ error: '�on v? kh�ng th? l� cha c?a ch�nh n�' });
  }

  // Validate parent exists
  if (parent_id) {
    const parent = db.prepare('SELECT id FROM organizations WHERE id = ?').get(parent_id);
    if (!parent) return res.status(400).json({ error: '�on v? cha kh�ng t?n t?i' });
  }

  db.prepare(
    "UPDATE organizations SET name = ?, description = ?, parent_id = ?, sort_order = ?, updated_at = datetime('now','localtime') WHERE id = ?"
  ).run(name, description, parent_id || null, sort_order ?? 0, orgId);
  console.log(JSON.stringify({ event: 'updated', entity: 'organization', id: orgId }));
  res.json({ ok: true });
});

// DELETE /api/organizations/:id � delete leaf org (fails if has children or users)
router.delete('/:id', (req, res) => {
  const orgId = req.params.id;
  const childCount = db.prepare('SELECT COUNT(*) as c FROM organizations WHERE parent_id = ?').get(orgId).c;
  if (childCount > 0) {
    return res.status(400).json({ error: 'Kh�ng th? x�a don v? c� don v? con' });
  }
  const userCount = db.prepare('SELECT COUNT(*) as c FROM users WHERE org_id = ?').get(orgId).c;
  if (userCount > 0) {
    return res.status(400).json({ error: 'Kh�ng th? x�a don v? c� ngu?i d�ng tr?c thu?c' });
  }
  db.prepare('DELETE FROM organizations WHERE id = ?').run(orgId);
  console.log(JSON.stringify({ event: 'deleted', entity: 'organization', id: orgId }));
  res.json({ ok: true });
});

// PUT /api/organizations/:id/move � move org to new parent
router.put('/:id/move', (req, res) => {
  const orgId = Number(req.params.id);
  const { parent_id } = req.body;

  // Prevent circular reference
  if (parent_id && Number(parent_id) === orgId) {
    return res.status(400).json({ error: '�on v? kh�ng th? l� cha c?a ch�nh n�' });
  }

  // Validate parent exists (null = root)
  if (parent_id) {
    const parent = db.prepare('SELECT id FROM organizations WHERE id = ?').get(parent_id);
    if (!parent) return res.status(400).json({ error: '�on v? cha kh�ng t?n t?i' });
  }

  db.prepare(
    "UPDATE organizations SET parent_id = ?, updated_at = datetime('now','localtime') WHERE id = ?"
  ).run(parent_id || null, orgId);
  res.json({ ok: true });
});

module.exports = router;
