const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Create simple reset script for container (no docker cp inside)
const scriptLines = [
  "var D = require('better-sqlite3');",
  "var bc = require('bcryptjs');",
  "var db = new D('/app/data/database.sqlite');",
  "db.exec('PRAGMA foreign_keys = OFF');",
  "db.prepare('DELETE FROM login_log').run();",
  "db.prepare('DELETE FROM reset_tokens').run();",
  "db.prepare('DELETE FROM password_history').run();",
  "db.prepare('DELETE FROM sessions').run();",
  "db.prepare('DELETE FROM group_members').run();",
  "db.prepare('DELETE FROM group_permissions').run();",
  "db.prepare('DELETE FROM user_groups').run();",
  "db.prepare('DELETE FROM organizations').run();",
  "db.prepare('DELETE FROM users').run();",
  "var h = bc.hashSync('admin123', 10);",
  "db.prepare(\"INSERT INTO users (username,password,full_name,role) VALUES ('admin',?,'Admin User','system-admin')\").run(h);",
  "var adminId = db.prepare(\"SELECT id FROM users WHERE username='admin'\").get().id;",
  "db.prepare(\"INSERT INTO users (username,password,full_name,role) VALUES ('chuyenviem1',?,'Chuyen Vien 1','Chuyen vien')\").run(h);",
  "var cvId = db.prepare(\"SELECT id FROM users WHERE username='chuyenviem1'\").get().id;",
  "db.prepare(\"INSERT INTO users (username,password,full_name,role) VALUES ('lanhdao',?,'Lanh Dao','Lanh dao')\").run(h);",
  "db.prepare(\"INSERT INTO organizations (name) VALUES ('Cục Hàng hải Việt Nam')\").run();",
  "db.prepare(\"INSERT INTO organizations (name,parent_id) VALUES ('Cảng vụ Hàng hải Hải Phòng', 1)\").run();",
  "db.prepare(\"INSERT INTO user_groups (name,description) VALUES ('System Administrators','Admins')\").run();",
  "db.prepare('INSERT INTO group_members (group_id,user_id) VALUES (?,?)').run(1, adminId);",
  "var fcs = ['user','group','permission','org','login-log','totp','session'];",
  "var igp = db.prepare('INSERT INTO group_permissions (group_id,feature_code,can_create,can_read,can_update,can_delete) VALUES (?,?,?,?,?,?)');",
  "fcs.forEach(function(f) { igp.run(1, f, 1, 1, 1, 1); });",
  "igp.run(3, 'login-log', 0, 1, 0, 0);",
  "db.exec('PRAGMA foreign_keys = ON');",
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
