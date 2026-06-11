const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const authMiddleware = require('./middleware/authMiddleware');
const adminMiddleware = require('./middleware/adminMiddleware');
const db = require('./db');
const { verifyPassword } = require('./services/passwordService');

const JWT_SECRET = process.env.JWT_SECRET;

// CRITICAL-01: JWT_SECRET must be set via env var â€” no default fallback
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required. Set it before starting the server.');
  process.exit(1);
}

const app = express();

// â”€â”€â”€ Prometheus metrics (lightweight) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const metrics = {
  requests_total: 0,
  errors_4xx: 0,
  errors_5xx: 0,
};

// â”€â”€â”€ Metrics tracking middleware â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.use((req, _res, next) => {
  metrics.requests_total++;
  next();
});

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
    // SRE-17: Log ALL requests (not just errors) for full observability
    console.log(JSON.stringify(log));
    if (res.statusCode >= 400) console.warn(JSON.stringify({ ...log, level: 'warn' }));
  });
  next();
});

// Security headers â€” CSP disabled for SPA inline event handlers, HSTS for production
const helmetOpts = { contentSecurityPolicy: false };
if (process.env.NODE_ENV === 'production') {
  helmetOpts.hsts = { maxAge: 31536000, includeSubDomains: true };
}
app.use(helmet(helmetOpts));

// CORS â€” restrict to same-origin for production (HIGH-04)
app.use(cors({
  origin: process.env.CORS_ORIGIN || false,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID'],
}));

app.use(express.json({ limit: '1mb' }));

// SEC-20: Remove X-Powered-By header
app.disable('x-powered-by');

// Serve static UI files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '..', 'public')));

// API routes

// Auth routes â€” rate limiter applied per-route inside auth.js
app.use('/api/auth', require('./routes/auth'));

// User Groups â€” must be BEFORE /api/users to avoid route conflict
const groupsRouter = require('./routes/groups');
app.use('/api/users/groups', authMiddleware, function groupsGuard(req, res, next) {
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    return adminMiddleware(req, res, next);
  }
  next();
}, groupsRouter);

// Users â€” auth required; write operations admin-only (no bypass, except self-delete)
app.use('/api/users', authMiddleware, function userWriteGuard(req, res, next) {
  if (['POST', 'PUT', 'DELETE'].includes(req.method) && req.path !== '/self') {
    return adminMiddleware(req, res, next);
  }
  next();
}, require('./routes/users'));

// Permissions â€” GET allowed for all authenticated, PUT admin-only
const permissionsRouter = require('./routes/permissions');
app.use('/api/permissions', authMiddleware, function permGuard(req, res, next) {
  if (req.method === 'PUT') {
    return adminMiddleware(req, res, next);
  }
  next();
}, permissionsRouter);

// Organizations â€” admin-only for mutations
const orgRouter = require('./routes/organizations');
app.use('/api/organizations', authMiddleware, function orgGuard(req, res, next) {
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    return adminMiddleware(req, res, next);
  }
  next();
}, orgRouter);

// Admin stats â€” BE-1.3f dashboard
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

// Admin reset DB â€” soft reset (E2E test helper, only when ENABLE_E2E_TEST_HOOKS=true)
// CR-V3-01: Password derived from env var, requires current admin password verification
app.post('/api/admin/reset-db', authMiddleware, adminMiddleware, (req, res) => {
  if (process.env.ENABLE_E2E_TEST_HOOKS !== 'true') {
    return res.status(403).json({ error: 'Reset disabled in production' });
  }

  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Thiáº¿u máº­t kháº©u xÃ¡c nháº­n' });
  }

  // CR-V3-01: Validate current admin password before proceeding
  const admin = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
  if (!admin) return res.status(404).json({ error: 'KhÃ´ng tÃ¬m tháº¥y ngÆ°á»i dÃ¹ng admin' });
  if (!verifyPassword(password, admin.password)) {
    return res.status(400).json({ error: 'Máº­t kháº©u xÃ¡c nháº­n khÃ´ng Ä‘Ãºng' });
  }

  const bcrypt = require('bcryptjs');
  const h = bcrypt.hashSync(process.env.E2E_RESET_PASSWORD || 'E2E_RESET_' + crypto.randomUUID().slice(0, 8), 10);

  // Disable FK globally for this connection (better-sqlite3 pragma)
  db.exec('PRAGMA foreign_keys = OFF');
  db.prepare('DELETE FROM login_log').run();
  db.prepare('DELETE FROM reset_tokens').run();
  db.prepare('DELETE FROM password_history').run();
  db.prepare('DELETE FROM sessions').run();
  db.prepare('DELETE FROM group_members').run();
  db.prepare('DELETE FROM group_permissions').run();
  db.prepare('DELETE FROM user_groups').run();
  db.prepare('DELETE FROM organizations').run();
  db.prepare("DELETE FROM users WHERE username!='admin' AND username!='chuyenviem1' AND username!='lanhdao'").run();
  db.prepare("UPDATE users SET password=?, status=1 WHERE username='admin'").run(h);
  db.prepare("UPDATE users SET password=?, status=1 WHERE username='chuyenviem1'").run(h);
  db.prepare("UPDATE users SET password=?, status=1 WHERE username='lanhdao'").run(h);
  // Re-seed orgs
  db.prepare('INSERT INTO organizations (name, description) VALUES (?, ?)').run('Cá»¥c HÃ ng háº£i Viá»‡t Nam', 'CÆ¡ quan quáº£n lÃ½ nhÃ  nÆ°á»›c vá» hÃ ng háº£i');
  db.prepare('INSERT INTO organizations (name, description, parent_id) VALUES (?, ?, ?)').run('Cáº£ng vá»¥ HÃ ng háº£i Háº£i PhÃ²ng', 'ÄÆ¡n vá»‹ trá»±c thuá»™c Cá»¥c', 1);
  // Re-seed groups
  db.prepare('INSERT INTO user_groups (name, description) VALUES (?, ?)').run('Quáº£n trá»‹ há»‡ thá»‘ng', 'NhÃ³m quáº£n trá»‹ toÃ n há»‡ thá»‘ng');
  db.prepare('INSERT INTO user_groups (name, description) VALUES (?, ?)').run('ChuyÃªn viÃªn KCHT', 'NhÃ¢n viÃªn quáº£n lÃ½ KCHT');
  db.prepare('INSERT INTO user_groups (name, description) VALUES (?, ?)').run('LÃ£nh Ä‘áº¡o', 'Cáº¥p lÃ£nh Ä‘áº¡o phÃª duyá»‡t');
  // Re-seed permissions
  db.prepare('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)').run(1, 1);
  const fcs = ['user','group','permission','org','login_log','totp','session'];
  const igp = db.prepare('INSERT INTO group_permissions (group_id, feature_code, can_create, can_read, can_update, can_delete) VALUES (?, ?, ?, ?, ?, ?)');
  fcs.forEach(fc => igp.run(1, fc, 1, 1, 1, 1));
  igp.run(3, 'login_log', 0, 1, 0, 0);
  db.exec('PRAGMA foreign_keys = ON');
  console.log('E2E reset-db completed');
  res.json({ ok: true });
});

// A3-L01/SRE-16: Metrics endpoint requires auth
app.get('/api/metrics', authMiddleware, (req, res) => {
  const activeSessions = db.prepare('SELECT COUNT(*) as c FROM sessions').get().c;
  const totalUsers = db.prepare('SELECT COUNT(*) as c FROM users WHERE status != 0').get().c;
  const lockedAccounts = db.prepare('SELECT COUNT(*) as c FROM users WHERE status = 2').get().c;
  const totpEnabled = db.prepare('SELECT COUNT(*) as c FROM users WHERE totp_enabled = 1').get().c;
  const lines = [
    `# HELP mtis_requests_total Total HTTP requests`,
    `# TYPE mtis_requests_total counter`,
    `mtis_requests_total ${metrics.requests_total}`,
    `# HELP mtis_active_sessions Active user sessions`,
    `# TYPE mtis_active_sessions gauge`,
    `mtis_active_sessions ${activeSessions}`,
    `# HELP mtis_users_total Active users`,
    `# TYPE mtis_users_total gauge`,
    `mtis_users_total ${totalUsers}`,
    `# HELP mtis_locked_accounts Locked accounts`,
    `# TYPE mtis_locked_accounts gauge`,
    `mtis_locked_accounts ${lockedAccounts}`,
    `# HELP mtis_totp_enabled TOTP-enabled users`,
    `# TYPE mtis_totp_enabled gauge`,
    `mtis_totp_enabled ${totpEnabled}`,
  ];
  res.set('Content-Type', 'text/plain; version=0.0.4');
  res.send(lines.join('\n') + '\n');
});

// Health check â€” shallow
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Health check â€” DB check
app.get('/api/health/db', (req, res) => {
  try {
    db.prepare('SELECT 1 as ok').get();
    res.json({ status: 'ok', db: true, time: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'degraded', db: false, time: new Date().toISOString() });
  }
});

// Readiness check â€” deep (DB ping)
app.get('/api/ready', (req, res) => {
  try {
    db.prepare('SELECT 1 as ok').get();
    res.json({ status: 'ok', db: true, time: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'degraded', db: false, time: new Date().toISOString() });
  }
});

// SPA fallback â€” serve index.html for all non-API, non-static routes
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

// DG-06: Periodic session cleanup cron
setInterval(() => {
  try {
    const deleted = db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run();
    if (deleted.changes > 0) console.log(JSON.stringify({ event: 'cleanup', type: 'sessions', count: deleted.changes }));
  } catch {}
}, 60 * 60 * 1000); // every 1 hour

// DG-05: Periodic reset_tokens cleanup cron
setInterval(() => {
  try {
    const deleted = db.prepare("DELETE FROM reset_tokens WHERE used = 1 OR expires_at < datetime('now', '-24 hours')").run();
    if (deleted.changes > 0) console.log(JSON.stringify({ event: 'cleanup', type: 'reset_tokens', count: deleted.changes }));
  } catch {}
}, 60 * 60 * 1000); // every 1 hour

// DG-04: Periodic login_log cleanup cron (retention 365 days)
setInterval(() => {
  try {
    const deleted = db.prepare("DELETE FROM login_log WHERE logged_at < datetime('now', '-365 days')").run();
    if (deleted.changes > 0) console.log(JSON.stringify({ event: 'cleanup', type: 'login_log', count: deleted.changes }));
  } catch {}
}, 6 * 60 * 60 * 1000); // every 6 hours

module.exports = app;
