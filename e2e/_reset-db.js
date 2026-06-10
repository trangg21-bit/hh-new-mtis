const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const scriptLines = [
  "var D = require('better-sqlite3');",
  "var bc = require('bcryptjs');",
  "var db = new D('/app/data/database.sqlite');",
  "db.prepare('DELETE FROM login_log').run();",
  "db.prepare('DELETE FROM reset_tokens').run();",
  "db.prepare('DELETE FROM password_history').run();",
  "db.prepare('DELETE FROM sessions').run();",
  "db.prepare('DELETE FROM group_members').run();",
  "db.prepare('DELETE FROM group_permissions').run();",
  "db.prepare('DELETE FROM user_groups').run();",
  "db.prepare('DELETE FROM organizations').run();",
  "var h = bc.hashSync('admin123', 10);",
  "db.prepare(\"UPDATE users SET password=?, status=1 WHERE username='admin'\").run(h);",
  "db.prepare(\"UPDATE users SET password=?, status=1 WHERE username='chuyenviem1'\").run(h);",
  "db.prepare(\"UPDATE users SET password=?, status=1 WHERE username='lanhdao'\").run(h);",
  "var oc = db.prepare('SELECT COUNT(*) c FROM organizations').get().c;",
  "if (oc === 0) { db.prepare(\"INSERT INTO organizations (name,parent_id) VALUES ('Cục Hàng hải Việt Nam',NULL)\").run(); var p1=db.prepare(\"SELECT id FROM organizations WHERE name='Cục Hàng hải Việt Nam'\").get().id; db.prepare(\"INSERT INTO organizations (name,parent_id) VALUES (?,?)\").run('Cảng vụ Hàng hải Hải Phòng',p1); }",
  "var gc = db.prepare('SELECT COUNT(*) c FROM user_groups').get().c;",
  "if (gc === 0) { db.prepare(\"INSERT INTO user_groups (name,description) VALUES ('System Administrators','Admins')\").run(); db.prepare('INSERT INTO group_members (group_id,user_id) VALUES (?,?)').run(1,1); }",
  "var pc = db.prepare('SELECT COUNT(*) c FROM group_permissions').get().c;",
  "if (pc === 0) { ['user','group','permission','organization','dashboard','login-log','session','totp'].forEach(function(f) { db.prepare('INSERT INTO group_permissions (group_id,feature_code,can_create,can_read,can_update,can_delete) VALUES (?,?,?,?,?,?)').run(1,f,1,1,1,1); }); }",
  "var du = \"DELETE FROM users WHERE username!='admin' AND username!='chuyenviem1' AND username!='lanhdao'\";",
  "db.prepare(du).run();",
  "console.log('Reset OK');",
  "db.close();"
].join('\n');

var tmpPath = path.join(require('os').tmpdir(), 'reset-m01.js');
fs.writeFileSync(tmpPath, scriptLines, 'utf8');

try {
  execSync('docker cp "' + tmpPath + '" hh-new-mtis-api-1:/app/reset-m01.js', { stdio: 'pipe', timeout: 10000 });
  execSync('docker exec hh-new-mtis-api-1 node /app/reset-m01.js', { stdio: 'pipe', timeout: 30000 });
  console.log('Reset complete');
} finally {
  try { fs.unlinkSync(tmpPath); } catch(e) {}
}
