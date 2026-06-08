const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const scriptContent = `
const D = require('better-sqlite3');
const bc = require('bcryptjs');
const db = new D('/app/data/database.sqlite');
db.prepare('DELETE FROM login_log').run();
db.prepare('DELETE FROM reset_tokens').run();
db.prepare('DELETE FROM password_history').run();
db.prepare('UPDATE users SET status=1 WHERE status=2').run();
const h = bc.hashSync('admin123', 10);
db.prepare("UPDATE users SET password=? WHERE username='admin'").run(h);
db.prepare("UPDATE users SET password=? WHERE username='chuyenviem1'").run(h);
console.log('Reset OK');
db.close();
`;

// Write to temp, copy to container, exec
const localTmp = '/tmp/reset-m01.js';
fs.writeFileSync(localTmp, scriptContent.trim(), 'utf8');
execSync(`docker cp "${localTmp}" hhnew-api-1:/app/reset-m01.js`, { stdio: 'pipe', timeout: 10000 });
execSync('docker exec hhnew-api-1 node /app/reset-m01.js', { stdio: 'inherit', timeout: 15000 });
// Restart API to clear express-rate-limit in-memory state
execSync('docker compose restart api', { stdio: 'pipe', timeout: 30000 });
// Wait for API to be ready
const start = Date.now();
while (Date.now() - start < 20000) {
  try {
    const res = execSync('curl -s http://localhost:3000/api/health', { stdio: 'pipe', timeout: 3000 });
    if (res.toString().includes('ok')) break;
  } catch {}
}
