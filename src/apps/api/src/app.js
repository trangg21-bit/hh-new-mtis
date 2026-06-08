const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const authMiddleware = require('./middleware/authMiddleware');
const adminMiddleware = require('./middleware/adminMiddleware');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET;

// CRITICAL-01: JWT_SECRET must be set via env var — no default fallback
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required. Set it before starting the server.');
  process.exit(1);
}

const app = express();

// Correlation ID per request
app.use((req, res, next) => {
  const { randomUUID } = require('crypto');
  req.id = randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Request logging (structured JSON)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const log = { ts: new Date().toISOString(), rid: req.id, method: req.method, path: req.originalUrl, status: res.statusCode, ms: Date.now() - start };
    if (res.statusCode >= 400) console.warn(JSON.stringify(log));
  });
  next();
});

// Security headers — CSP disabled for SPA inline event handlers, HSTS for production
const helmetOpts = { contentSecurityPolicy: false };
if (process.env.NODE_ENV === 'production') {
  helmetOpts.hsts = { maxAge: 31536000, includeSubDomains: true };
}
app.use(helmet(helmetOpts));

// CORS — restrict to same-origin for production (HIGH-04)
app.use(cors({
  origin: process.env.CORS_ORIGIN || false,
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));

// SEC-20: Remove X-Powered-By header
app.disable('x-powered-by');

// Serve static UI files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '..', 'public')));

// API routes

// Auth routes — rate limiter applied per-route inside auth.js
app.use('/api/auth', require('./routes/auth'));

// User Groups — must be BEFORE /api/users to avoid route conflict
const groupsRouter = require('./routes/groups');
app.use('/api/users/groups', authMiddleware, function groupsGuard(req, res, next) {
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    return adminMiddleware(req, res, next);
  }
  next();
}, groupsRouter);

// Users — auth required; write operations admin-only (no bypass, except self-delete)
app.use('/api/users', authMiddleware, function userWriteGuard(req, res, next) {
  if (['POST', 'PUT', 'DELETE'].includes(req.method) && req.path !== '/self') {
    return adminMiddleware(req, res, next);
  }
  next();
}, require('./routes/users'));

// Permissions — GET allowed for all authenticated, PUT admin-only
const permissionsRouter = require('./routes/permissions');
app.use('/api/permissions', authMiddleware, function permGuard(req, res, next) {
  if (req.method === 'PUT') {
    return adminMiddleware(req, res, next);
  }
  next();
}, permissionsRouter);

// Organizations — admin-only for mutations
const orgRouter = require('./routes/organizations');
app.use('/api/organizations', authMiddleware, function orgGuard(req, res, next) {
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    return adminMiddleware(req, res, next);
  }
  next();
}, orgRouter);

// Admin stats — BE-1.3f dashboard
app.get('/api/admin/stats', authMiddleware, adminMiddleware, (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as c FROM users WHERE status != 0').get().c;
  const totalGroups = db.prepare('SELECT COUNT(*) as c FROM user_groups').get().c;
  const totalOrgs = db.prepare('SELECT COUNT(*) as c FROM organizations').get().c;
  const activeSessions = db.prepare('SELECT COUNT(*) as c FROM sessions').get().c;
  const lockedAccounts = db.prepare('SELECT COUNT(*) as c FROM users WHERE status = 2').get().c;
  const totpEnabled = db.prepare('SELECT COUNT(*) as c FROM users WHERE totp_enabled = 1').get().c;
  const recentLogins = db.prepare(
    'SELECT COUNT(*) as c FROM login_log WHERE logged_at > datetime(\'now\',\'-30 days\')'
  ).get().c;
  const failedLogins = db.prepare(
    "SELECT COUNT(*) as c FROM login_log WHERE status = 'failed' AND logged_at > datetime('now','-30 days')"
  ).get().c;
  const usersByRole = db.prepare(
    'SELECT role, COUNT(*) as count FROM users WHERE status != 0 GROUP BY role'
  ).all();

  res.json({
    total_users: totalUsers,
    total_groups: totalGroups,
    total_organizations: totalOrgs,
    active_sessions: activeSessions,
    locked_accounts: lockedAccounts,
    totp_enabled: totpEnabled,
    recent_logins: recentLogins,
    failed_logins_30d: failedLogins,
    users_by_role: usersByRole
  });
});

// Health check — shallow
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Readiness check — deep (DB ping)
app.get('/api/ready', (req, res) => {
  try {
    db.prepare('SELECT 1 as ok').get();
    res.json({ status: 'ok', db: true, time: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'degraded', db: false, time: new Date().toISOString() });
  }
});

// SPA fallback — serve index.html for all non-API, non-static routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });

  const filePath = path.join(__dirname, '..', 'public', req.path);
  res.sendFile(filePath, (err) => {
    if (err) {
      res.sendFile(path.join(__dirname, '..', 'public', 'index.html'), (spaErr) => {
        if (spaErr) res.status(404).json({ error: 'Not found' });
      });
    }
  });
});

// Global error handlers
process.on('uncaughtException', (err) => { console.error(JSON.stringify({ event: 'uncaughtException', error: err.message, stack: err.stack?.split('\n').slice(0,3) })); process.exit(1); });
process.on('unhandledRejection', (reason) => { console.error(JSON.stringify({ event: 'unhandledRejection', error: reason?.message || String(reason) })); });

module.exports = app;
