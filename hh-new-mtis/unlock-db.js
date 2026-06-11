const Database = require('better-sqlite3');
const db = new Database('/app/data/database.sqlite');
db.prepare("UPDATE users SET status=1, failed_attempts=0, lock_until=null WHERE status=2").run();
const all = db.prepare("SELECT id, username, status FROM users").all();
all.forEach(r => console.log(r));
console.log(`Unlocked: ${all.filter(u => u.status === 2).length}`);
