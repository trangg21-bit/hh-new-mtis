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

// Default permission matrix for a new group: all features, all actions = 0
function createDefaultPermissions(groupId, featureCodes) {
  const insert = db.prepare(`
    INSERT INTO group_permissions (group_id, feature_code, can_create, can_read, can_update, can_delete, updated_at)
    VALUES (?, ?, 0, 0, 0, 0, datetime('now','localtime'))
  `);
  const upsertMany = db.transaction((items) => {
    for (const item of items) {
      insert.run(item.group_id, item.feature_code);
    }
  });
  try {
    const records = featureCodes.map(fc => ({ group_id: groupId, feature_code: fc }));
    upsertMany(records);
  } catch (e) {
    console.error(JSON.stringify({ event: 'error', route: 'createDefaultPermissions', error: e.message }));
  }
}

// GET /api/permissions — returns full permission matrix (groups × features)
router.get('/', (req, res) => {
  const groups = db.prepare('SELECT id, name FROM user_groups ORDER BY name').all();
  const featureCodes = getCatalogFeatureCodes();
  const rows = db.prepare('SELECT * FROM group_permissions ORDER BY group_id, feature_code').all();

  // Build Map: "groupId|featureCode" → permission row (O(P))
  const permMap = new Map();
  for (const r of rows) {
    permMap.set(`${r.group_id}|${r.feature_code}`, r);
  }

  // Build matrix in O(F × G)
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

// GET /api/permissions/role/:roleId — return feature_ids already assigned to a group
router.get('/role/:roleId', (req, res) => {
  const roleId = Number(req.params.roleId);
  if (!roleId || isNaN(roleId)) {
    return res.status(400).json({ error: 'roleId không hợp lệ' });
  }

  const groupExists = db.prepare('SELECT id, name FROM user_groups WHERE id = ?').get(roleId);
  if (!groupExists) {
    return res.status(404).json({ error: 'Nhóm không tồn tại' });
  }

  const rows = db.prepare(`
    SELECT gp.feature_code
    FROM group_permissions gp
    WHERE gp.group_id = ? AND (gp.can_create = 1 OR gp.can_read = 1 OR gp.can_update = 1 OR gp.can_delete = 1)
    ORDER BY gp.feature_code
  `).all(roleId);

  const feature_ids = rows.map(r => r.feature_code);

  res.json({ group: groupExists, feature_ids });
});

// PUT /api/permissions — batch update permission matrix
// Supports two request body formats:
//   (a) Legacy: { permissions: [{group_id, feature_code, can_create, can_read, can_update, can_delete}, ...] }
//   (b) New:    { group_id, feature_ids: ['user', 'group', ...] } — auto-sets all actions = 1
router.put('/', (req, res) => {
  const body = req.body;

  const upsert = db.prepare(`
    INSERT INTO group_permissions (group_id, feature_code, can_create, can_read, can_update, can_delete, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now','localtime'))
    ON CONFLICT(group_id, feature_code) DO UPDATE SET
      can_create = excluded.can_create, can_read = excluded.can_read,
      can_update = excluded.can_update, can_delete = excluded.can_delete,
      updated_at = excluded.updated_at
  `);

  // Format (b): { group_id, feature_ids } — frontend tree-view format
  if (body.group_id != null && Array.isArray(body.feature_ids)) {
    const groupId = Number(body.group_id);
    const featureIds = body.feature_ids;

    if (isNaN(groupId)) {
      return res.status(400).json({ error: 'group_id không hợp lệ' });
    }

    const groupExists = db.prepare('SELECT id FROM user_groups WHERE id = ?').get(groupId);
    if (!groupExists) {
      return res.status(404).json({ error: 'Nhóm không tồn tại' });
    }

    const bit = 1; // auto-map all actions = 1 for each feature
    const txn = db.transaction((items) => {
      for (const fc of items) {
        upsert.run(groupId, fc, bit, bit, bit, bit);
      }
    });

    try {
      txn(featureIds);
      _catalogCache = null;
      console.log(JSON.stringify({ event: 'updated', route: 'PUT /api/permissions', format: 'new', group_id: groupId, feature_count: featureIds.length }));
      res.json({ ok: true });
    } catch (e) {
      console.error(JSON.stringify({ event: 'error', route: 'PUT /api/permissions', format: 'new', error: e.message }));
      res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
    }
    return;
  }

  // Format (a): { permissions: [...] } — legacy backend matrix format
  if (Array.isArray(body.permissions)) {
    const permissions = body.permissions;

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
      console.log(JSON.stringify({ event: 'updated', route: 'PUT /api/permissions', format: 'legacy', count: permissions.length }));
      res.json({ ok: true });
    } catch (e) {
      console.error(JSON.stringify({ event: 'error', route: 'PUT /api/permissions', format: 'legacy', error: e.message }));
      res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
    }
    return;
  }

  return res.status(400).json({ error: 'Thiếu định dạng request. Dùng { group_id, feature_ids } hoặc { permissions: [...] }' });
});

// GET /api/permissions/check — check user permission for a feature+action (auth required)
const VALID_ACTIONS = ['create', 'read', 'update', 'delete'];
router.get('/check', (req, res) => {
  const { feature, action } = req.query;
  if (!feature || !action) {
    return res.status(400).json({ error: 'Thiếu feature hoặc action' });
  }
  if (!VALID_ACTIONS.includes(action)) {
    return res.status(400).json({ error: `action không hợp lệ. Dùng: ${VALID_ACTIONS.join(', ')}` });
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
