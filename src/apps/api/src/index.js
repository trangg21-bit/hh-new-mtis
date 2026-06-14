// Load .env manually (no dotenv dependency)
try {
  const fs = require('fs'), path = require('path');
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
      const m = line.match(/^\s*([\w._-]+)\s*=\s*(.*?)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    });
  }
} catch (e) { /* silent */ }

const app = require('./app');
const db = require('./db');
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log('Content-Type: application/json; charset=utf-8');
  console.log(JSON.stringify({ event: 'started', port: PORT, env: process.env.NODE_ENV || 'development' }));
});

// Graceful shutdown
function shutdown(signal) {
  console.log(JSON.stringify({ event: 'shutdown', signal }));
  server.close(() => {
    console.log(JSON.stringify({ event: 'stopped' }));
    db.close();
    process.exit(0);
  });
  setTimeout(() => { console.log(JSON.stringify({ event: 'force_exit' })); process.exit(1); }, 10000);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// WAL checkpoint every 30 min
setInterval(() => { try { db.pragma('wal_checkpoint(TRUNCATE)'); } catch {} }, 30 * 60 * 1000);

// Startup cleanup: purge expired sessions, used/expired reset tokens, old login_log
try {
  db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run();
} catch {}
try {
  db.prepare("DELETE FROM reset_tokens WHERE used = 1 OR expires_at < datetime('now', '-24 hours')").run();
} catch {}
try {
  db.prepare("DELETE FROM login_log WHERE logged_at < datetime('now', '-365 days')").run();
} catch {}
