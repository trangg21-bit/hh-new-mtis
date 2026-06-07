const { verifyToken } = require('../utils/jwt');

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Chưa đăng nhập' });
  try {
    req.user = verifyToken(auth.replace('Bearer ', ''));
    next();
  } catch {
    res.status(401).json({ error: 'Phiên đăng nhập hết hạn' });
  }
}

module.exports = authMiddleware;
