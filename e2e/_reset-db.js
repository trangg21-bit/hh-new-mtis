const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

async function main() {
  const script = [
    "var D = require('better-sqlite3');",
    "var bc = require('bcryptjs');",
    "var db = new D('/app/data/database.sqlite');",
    "db.pragma('foreign_keys = OFF');",
    "",
    "var h = bc.hashSync('admin123', 10);",
    "db.prepare('UPDATE users SET password=?, status=1').run(h);",
    "db.prepare('DELETE FROM login_log').run();",
    "db.prepare('DELETE FROM sessions').run();",
    "db.prepare('DELETE FROM reset_tokens').run();",
    "db.prepare('DELETE FROM password_history').run();",
    "db.prepare(\"DELETE FROM users WHERE username!='admin' AND username!='chuyenviem1' AND username!='lanhdao'\").run();",
    "db.prepare('DELETE FROM group_permissions').run();",
    "db.prepare('DELETE FROM group_members').run();",
    "db.prepare('DELETE FROM user_groups').run();",
    "db.prepare('DELETE FROM organizations').run();",
    "db.prepare('INSERT INTO organizations (name,description) VALUES (?,?)').run('Cuc HH VN','Co quan');",
    "db.prepare('INSERT INTO organizations (name,description,parent_id) VALUES (?,?,?)').run('Cang vu HP','Don vi',1);",
    "db.prepare('INSERT INTO user_groups (name,description) VALUES (?,?)').run('Admin','Admin group');",
    "db.prepare('INSERT INTO user_groups (name,description) VALUES (?,?)').run('Staff','Staff group');",
    "db.prepare('INSERT INTO user_groups (name,description) VALUES (?,?)').run('Leader','Leader group');",
    "db.prepare('INSERT INTO group_members (group_id,user_id) VALUES (?,?)').run(1,1);",
    "var f=['user','group','permission','org','login_log','totp','session'];",
    "var ig=db.prepare('INSERT INTO group_permissions (group_id,feature_code,can_create,can_read,can_update,can_delete) VALUES (?,?,?,?,?,?)');",
    "f.forEach(function(x){ig.run(1,x,1,1,1,1)});",
    "ig.run(3,'login_log',0,1,0,0);",
    "console.log('Reset OK');",
    "db.close();",
  ].join('\n');

  var tmp = path.join(require('os').tmpdir(), 'reset-m01.js');
  fs.writeFileSync(tmp, script, 'utf8');

  try {
    execSync('docker cp "' + tmp + '" hh-new-mtis-api-1:/app/reset-m01.js', { stdio: 'pipe', timeout: 10000 });
    execSync('docker exec hh-new-mtis-api-1 node /app/reset-m01.js', { stdio: 'pipe', timeout: 30000 });
    
    // Restart to clear in-memory rate limiter
    execSync('docker restart hh-new-mtis-api-1', { stdio: 'pipe', timeout: 30000 });
    
    // Wait for API health
    for (let i = 0; i < 30; i++) {
      try {
        await new Promise((resolve, reject) => {
          const req = http.request({
            hostname: 'localhost', port: 3000, path: '/api/health', method: 'GET',
            headers: { 'Content-Length': '0' }
          }, res => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => {
              try { if (JSON.parse(d).status === 'ok') resolve(); else reject(); }
              catch(e) { reject(e); }
            });
          });
          req.on('error', reject);
          req.end();
        });
        break;
      } catch (e) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    console.log('Reset complete');
  } finally {
    try { fs.unlinkSync(tmp); } catch(e) {}
  }
}

main().catch(e => { console.error('Reset error:', e.message); process.exit(1); });
