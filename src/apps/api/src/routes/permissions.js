const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/permissions — returns full permission matrix (groups × features)
router.get('/', (req, res) => {
  const groups = db.prepare('SELECT id, name FROM user_groups ORDER BY name').all();

  // Build feature list from catalog.json if available, else use M01 defaults
  let featureCodes = ['user', 'group', 'permission', 'org', 'login_log', 'totp', 'session'];
  try {
    const fs = require('fs');
    const path = require('path');
    const catalogPath = path.join(__dirname, '..', '..', '..', '..', '..', 'docs', 'intel', 'catalog.json');
    if (fs.existsSync(catalogPath)) {
      const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
      const codes = [];
      for (const mod of catalog.modules) {
        for (const feat of mod.features) {
          codes.push(feat.id);
        }
      }
      if (codes.length > 0) featureCodes = codes;
    }
  } catch (e) {
    // fallback to defaults
  }

  const rows = db.prepare('SELECT * FROM group_permissions ORDER BY group_id, feature_code').all();

  // Build matrix: groups as columns, features as rows
  const matrix = featureCodes.map(fc => {
    const row = { feature_code: fc };
    for (const g of groups) {
      const perm = rows.find(r => r.group_id === g.id && r.feature_code === fc);
      row[`g${g.id}`] = perm ? {
        can_create: perm.can_create,
        can_read: perm.can_read,
        can_update: perm.can_update,
        can_delete: perm.can_delete
      } : { can_create: 0, can_read: 0, can_update: 0, can_delete: 0 };
    }
    return row;
  });

  res.json({ groups, matrix, feature_codes: featureCodes });
});

// PUT /api/permissions — batch update permission matrix
router.put('/', (req, res) => {
  const { permissions } = req.body; // Array of { group_id, feature_code, can_create, can_read, can_update, can_delete }
  if (!Array.isArray(permissions)) {
    return res.status(400).json({ error: 'permissions phải là mảng' });
  }

  const upsert = db.prepare(`
    INSERT INTO group_permissions (group_id, feature_code, can_create, can_read, can_update, can_delete, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now','localtime'))
    ON CONFLICT(group_id, feature_code) DO UPDATE SET
      can_create = excluded.can_create,
      can_read = excluded.can_read,
      can_update = excluded.can_update,
      can_delete = excluded.can_delete,
      updated_at = excluded.updated_at
  `);

  const txn = db.transaction((items) => {
    for (const p of items) {
      upsert.run(p.group_id, p.feature_code, p.can_create ?? 0, p.can_read ?? 0, p.can_update ?? 0, p.can_delete ?? 0);
    }
  });

  try {
    txn(permissions);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/permissions/check — check user permission for a feature+action
router.get('/check', (req, res) => {
  const { feature, action } = req.query;
  if (!feature || !action) {
    return res.status(400).json({ error: 'Thiếu feature hoặc action' });
  }

  const user = req.user;
  if (user.role === 'system-admin') {
    return res.json({ allowed: true, reason: 'admin' });
  }

  const actionCol = `can_${action}`;
  const row = db.prepare(`
    SELECT gm.user_id, gp.${actionCol} as permitted
    FROM group_members gm
    JOIN group_permissions gp ON gm.group_id = gp.group_id
    WHERE gm.user_id = ? AND gp.feature_code = ? AND gp.${actionCol} = 1
    LIMIT 1
  `).get(user.id, feature);

  res.json({ allowed: !!row, reason: row ? 'permission_granted' : 'permission_denied' });
});

module.exports = router;
