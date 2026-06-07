function adminMiddleware(req, res, next) {
  if (req.user.role !== 'system-admin') {
    return res.status(403).json({ error: 'Từ chối quyền truy cập: chỉ Quản trị hệ thống' });
  }
  next();
}

module.exports = adminMiddleware;
