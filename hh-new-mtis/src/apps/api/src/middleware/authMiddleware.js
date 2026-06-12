// -*- coding: utf-8 -*-
const { verifyToken } = require('../utils/jwt');
const db = require('../db');

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Chua dang nh?p' });
  try {
    const payload = verifyToken(auth.replace('Bearer ', ''));
    const session = db.prepare(
      "SELECT user_id FROM sessions WHERE token_jti = ? AND expires_at > datetime('now')"
    ).get(payload.jti);
    if (!session) {
      return res.status(401).json({ error: 'Phi�n dang nh?p d� h?t h?n ho?c d� b? thu h?i' });
    }
    req.user = payload;
    // Update last_active_at on session (fire-and-forget, non-blocking)
    db.prepare("UPDATE sessions SET last_active_at = datetime('now','localtime') WHERE token_jti = ?").run(payload.jti);
    next();
  } catch {
    res.status(401).json({ error: 'Phi�n dang nh?p h?t h?n' });
  }
}

module.exports = authMiddleware;
