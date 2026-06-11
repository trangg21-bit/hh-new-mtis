const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const db = new Database('/app/data/database.sqlite');
const hash = bcrypt.hashSync('admin123', 10);
db.prepare("UPDATE users SET password=? WHERE username='admin'").run(hash);
console.log('Admin password reset to admin123');
console.log('Hash:', hash);
