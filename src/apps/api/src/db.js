const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'database.sqlite');
const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Schema ──────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    username    TEXT    UNIQUE NOT NULL,
    password    TEXT    NOT NULL,
    full_name   TEXT    NOT NULL,
    email       TEXT,
    phone       TEXT,
    org_unit    TEXT    DEFAULT 'Cảng vụ Hàng hải Hải Phòng',
    role        TEXT    DEFAULT 'Chuyên viên',
    status      INTEGER DEFAULT 1,
    created_at  TEXT    DEFAULT (datetime('now','localtime')),
    updated_at  TEXT    DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS user_groups (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    UNIQUE NOT NULL,
    description TEXT,
    created_at  TEXT    DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS group_members (
    user_id  INTEGER NOT NULL,
    group_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, group_id),
    FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES user_groups(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS login_log (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    username  TEXT    NOT NULL,
    ip        TEXT,
    device    TEXT,
    status    TEXT    DEFAULT 'success',
    logged_at TEXT    DEFAULT (datetime('now','localtime'))
  );
`);

// ─── Seed data ───────────────────────────────────────────
const count = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
if (count === 0) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare(`INSERT INTO users (username, password, full_name, email, phone, org_unit, role)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run('admin', hash, 'Nguyễn Văn A', 'admin@mtis.vn', '0912345678', 'Cục Hàng hải Việt Nam', 'Quản trị hệ thống');
  db.prepare(`INSERT INTO users (username, password, full_name, email, phone, org_unit, role)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run('chuyenviem1', hash, 'Trần Thị B', 'chuyenviem1@mtis.vn', '0987654321', 'Cảng vụ Hàng hải Hải Phòng', 'Chuyên viên');
  db.prepare(`INSERT INTO users (username, password, full_name, email, phone, org_unit, role)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run('lanhdao', hash, 'Lê Văn C', 'lanhdao@mtis.vn', '0977112233', 'Cảng vụ Hàng hải Hải Phòng', 'Lãnh đạo Cảng vụ');

  db.prepare('INSERT INTO user_groups (name, description) VALUES (?, ?)').run('Quản trị hệ thống', 'Nhóm quản trị toàn hệ thống');
  db.prepare('INSERT INTO user_groups (name, description) VALUES (?, ?)').run('Chuyên viên KCHT', 'Nhân viên quản lý KCHT');
  db.prepare('INSERT INTO user_groups (name, description) VALUES (?, ?)').run('Lãnh đạo', 'Cấp lãnh đạo phê duyệt');
}

module.exports = db;
