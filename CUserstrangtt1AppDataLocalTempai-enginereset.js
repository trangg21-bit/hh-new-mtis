const Database = require('better-sqlite3');
const path = require('path');
const DB_PATH = process.env.DB_PATH || '/app/data/database.sqlite';
const db = new Database(DB_PATH);
db.pragma('foreign_keys = OFF');

// Reset user statuses to active
const res = db.prepare("UPDATE users SET status = 1 WHERE username IN ('admin', 'chuyenviem1', 'lanhdao')").run();
console.log('Updated', res.changes, 'users');

// Clear sessions and login logs
db.prepare('DELETE FROM sessions').run();
db.prepare('DELETE FROM login_log').run();
console.log('Sessions and login_log cleared');

db.close();
console.log('DONE');
