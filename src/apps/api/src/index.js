const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static UI files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '..', 'public')));

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// SPA fallback — serve M01 UI for any unmatched route
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(__dirname, '..', 'public', 'M01-user-management.html'));
});

app.listen(PORT, () => {
  console.log(`✅ MTIS API running at http://localhost:${PORT}`);
  console.log(`📁 UI: http://localhost:${PORT}/dashboard.html`);
  console.log(`📁 M01: http://localhost:${PORT}/M01-user-management.html`);
});
