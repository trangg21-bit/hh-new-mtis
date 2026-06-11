const db = require('../db');

const VALID_ACTIONS = ['create', 'read', 'update', 'delete'];

function permissionMiddleware(featureCode, action) {
  if (!featureCode || !action) {
    throw new Error('permissionMiddleware requires featureCode and action');
  }
  if (!VALID_ACTIONS.includes(action)) {
    throw new Error(`Invalid action: ${action}. Must be one of: ${VALID_ACTIONS.join(', ')}`);
  }

  return (req, res, next) => {
    if (req.user.role === 'system-admin') return next();

    const actionCol = `can_${action}`;
    const row = db.prepare(`
      SELECT gp.${actionCol} as permitted
      FROM group_members gm
      JOIN group_permissions gp ON gm.group_id = gp.group_id
      WHERE gm.user_id = ? AND gp.feature_code = ? AND gp.${actionCol} = 1
      LIMIT 1
    `).get(req.user.id, featureCode);

    if (!row) {
      return res.status(403).json({
        error: `Từ chối quyền truy cập: không có quyền ${action} trên ${featureCode}`
      });
    }

    next();
  };
}

function getUserPermissions(userId) {
  if (!userId) return [];

  const rows = db.prepare(`
    SELECT gp.feature_code, gp.can_create, gp.can_read, gp.can_update, gp.can_delete
    FROM group_members gm
    JOIN group_permissions gp ON gm.group_id = gp.group_id
    WHERE gm.user_id = ?
  `).all(userId);

  const merged = {};
  for (const r of rows) {
    if (!merged[r.feature_code]) {
      merged[r.feature_code] = {
        feature_code: r.feature_code,
        can_create: 0,
        can_read: 0,
        can_update: 0,
        can_delete: 0
      };
    }
    merged[r.feature_code].can_create = merged[r.feature_code].can_create || r.can_create;
    merged[r.feature_code].can_read = merged[r.feature_code].can_read || r.can_read;
    merged[r.feature_code].can_update = merged[r.feature_code].can_update || r.can_update;
    merged[r.feature_code].can_delete = merged[r.feature_code].can_delete || r.can_delete;
  }

  return Object.values(merged);
}

module.exports = { permissionMiddleware, getUserPermissions };
