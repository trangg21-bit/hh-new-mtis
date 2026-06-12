// -*- coding: utf-8 -*-
const express = require('express');
const db = require('../db');

const router = express.Router();

// Cache catalog.json feature codes in memory
let _catalogCache = null;
function getCatalogFeatureCodes() {
  if (_catalogCache) return _catalogCache;
  try {
    const fs = require('fs');
    const path = require('path');
    const catalogPath = path.join(__dirname, '..', '..', '..', '..', '..', 'docs', 'intel', 'catalog.json');
    if (fs.existsSync(catalogPath)) {
      const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
      const codes = [];
      for (const mod of catalog.modules || []) {
        for (const feat of mod.features || []) {
          if (feat.id) codes.push(feat.id);
        }
      }
      if (codes.length > 0) { _catalogCache = codes; return codes; }
    }
  } catch {}
  _catalogCache = ['user', 'group', 'permission', 'org', 'login_log', 'totp', 'session'];
  return _catalogCache;
}

// GET /api/permissions � returns full permission matrix (groups � features)
router.get('/', (req, res) => {
  const groups = db.prepare('SELECT id, name FROM user_groups ORDER BY name').all();
  const featureCodes = getCatalogFeatureCodes();
  const rows = db.prepare('SELECT * FROM group_permissions ORDER BY group_id, feature_code').all();

  // Build Map: "groupId|featureCode" ? permission row (O(P))
  const permMap = new Map();
  for (const r of rows) {
    permMap.set(`${r.group_id}|${r.feature_code}`, r);
  }

  // Build matrix in O(F � G)
  const matrix = featureCodes.map(fc => {
    const row = { feature_code: fc };
    for (const g of groups) {
      const perm = permMap.get(`${g.id}|${fc}`);
      row[`g${g.id}`] = perm ? {
        can_create: perm.can_create, can_read: perm.can_read,
        can_update: perm.can_update, can_delete: perm.can_delete
      } : { can_create: 0, can_read: 0, can_update: 0, can_delete: 0 };
    }
    return row;
  });

  res.json({ groups, matrix, feature_codes: featureCodes });
});

// PUT /api/permissions � batch update permission matrix
router.put('/', (req, res) => {
  const { permissions } = req.body;
  if (!Array.isArray(permissions)) {
    return res.status(400).json({ error: 'permissions ph?i l� m?ng' });
  }

  const upsert = db.prepare(`
    INSERT INTO group_permissions (group_id, feature_code, can_create, can_read, can_update, can_delete, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now','localtime'))
    ON CONFLICT(group_id, feature_code) DO UPDATE SET
      can_create = excluded.can_create, can_read = excluded.can_read,
      can_update = excluded.can_update, can_delete = excluded.can_delete,
      updated_at = excluded.updated_at
  `);

  const txn = db.transaction((items) => {
    for (const p of items) {
      const bit = (v) => v === true || v === 1 || v === '1' ? 1 : 0;
      upsert.run(
        Number(p.group_id),
        String(p.feature_code),
        bit(p.can_create),
        bit(p.can_read),
        bit(p.can_update),
        bit(p.can_delete)
      );
    }
  });

  try {
    txn(permissions);
    _catalogCache = null; // invalidate cache on permission change
    res.json({ ok: true });
  } catch (e) {
    console.error(JSON.stringify({ event: 'error', route: 'PUT /api/permissions', error: e.message }));
    res.status(500).json({ error: 'L?i m�y ch? n?i b?' });
  }
});

// GET /api/permissions/check � check user permission for a feature+action (auth required)
const VALID_ACTIONS = ['create', 'read', 'update', 'delete'];
router.get('/check', (req, res) => {
  const { feature, action } = req.query;
  if (!feature || !action) {
    return res.status(400).json({ error: 'Thi?u feature ho?c action' });
  }
  if (!VALID_ACTIONS.includes(action)) {
    return res.status(400).json({ error: `action kh�ng h?p l?. D�ng: ${VALID_ACTIONS.join(', ')}` });
  }

  const user = req.user;
  if (user.role === 'system-admin') {
    return res.json({ allowed: true, reason: 'admin' });
  }

  const row = db.prepare(`
    SELECT gm.user_id,
      CASE ?
        WHEN 'create' THEN gp.can_create
        WHEN 'read'   THEN gp.can_read
        WHEN 'update' THEN gp.can_update
        WHEN 'delete' THEN gp.can_delete
        ELSE 0
      END as permitted
    FROM group_members gm
    JOIN group_permissions gp ON gm.group_id = gp.group_id
    WHERE gm.user_id = ? AND gp.feature_code = ?
      AND CASE ?
        WHEN 'create' THEN gp.can_create
        WHEN 'read'   THEN gp.can_read
        WHEN 'update' THEN gp.can_update
        WHEN 'delete' THEN gp.can_delete
        ELSE 0
      END = 1
    LIMIT 1
  `).get(action, user.id, feature, action);

  res.json({ allowed: !!row, reason: row ? 'permission_granted' : 'permission_denied' });
});

module.exports = router;
