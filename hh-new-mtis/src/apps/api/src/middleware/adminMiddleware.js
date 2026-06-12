// -*- coding: utf-8 -*-
function adminMiddleware(req, res, next) {
  if (req.user.role !== 'system-admin') {
    return res.status(403).json({ error: 'T? ch?i quy?n truy c?p: ch? Qu?n tr? h? th?ng' });
  }
  next();
}

module.exports = adminMiddleware;
