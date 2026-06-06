const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'mtis-dev-secret-key-2026';

app.use(cors());
app.use(express.json());

// Serve static UI files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Auth middleware for protected routes
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Chưa đăng nhập' });
  try {
    const decoded = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Phiên đăng nhập hết hạn' });
  }
}

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', authMiddleware, require('./routes/users'));

// Health check (public)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Fallback — serve login page for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

// Other unmatched routes serve the requested file or login
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
  const filePath = path.join(__dirname, '..', 'public', req.path);
  res.sendFile(filePath, function (err) {
    if (err) res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
  });
});

app.listen(PORT, () => {
  console.log(`✅ MTIS running at http://localhost:${PORT}`);
  console.log(`🔐 Login: http://localhost:${PORT}/login.html`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard.html`);
});
