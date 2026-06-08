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

  CREATE TABLE IF NOT EXISTS password_history (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    password_hash TEXT    NOT NULL,
    created_at    TEXT    DEFAULT (datetime('now','localtime'))
  );

  CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON password_history(user_id);

  CREATE TABLE IF NOT EXISTS reset_tokens (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token      TEXT    NOT NULL UNIQUE,
    expires_at TEXT    NOT NULL,
    used       INTEGER DEFAULT 0,
    created_at TEXT    DEFAULT (datetime('now','localtime'))
  );

  CREATE INDEX IF NOT EXISTS idx_reset_tokens_token ON reset_tokens(token);
  CREATE INDEX IF NOT EXISTS idx_reset_tokens_user_id ON reset_tokens(user_id);

  CREATE TABLE IF NOT EXISTS sessions (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_jti      TEXT    NOT NULL UNIQUE,
    device         TEXT,
    ip             TEXT,
    last_active_at TEXT    DEFAULT (datetime('now','localtime')),
    created_at     TEXT    DEFAULT (datetime('now','localtime')),
    expires_at     TEXT    NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_token_jti ON sessions(token_jti);

  CREATE TABLE IF NOT EXISTS group_permissions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id    INTEGER NOT NULL REFERENCES user_groups(id) ON DELETE CASCADE,
    feature_code TEXT   NOT NULL,
    can_create  INTEGER DEFAULT 0,
    can_read    INTEGER DEFAULT 0,
    can_update  INTEGER DEFAULT 0,
    can_delete  INTEGER DEFAULT 0,
    updated_at  TEXT    DEFAULT (datetime('now','localtime')),
    UNIQUE(group_id, feature_code)
  );

  CREATE TABLE IF NOT EXISTS organizations (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    description TEXT,
    parent_id   INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
    sort_order  INTEGER DEFAULT 0,
    created_at  TEXT    DEFAULT (datetime('now','localtime')),
    updated_at  TEXT    DEFAULT (datetime('now','localtime'))
  );

  CREATE INDEX IF NOT EXISTS idx_organizations_parent_id ON organizations(parent_id);

`);

// Add org_id column to users if not exists (safe re-run)
try {
  db.exec('ALTER TABLE users ADD COLUMN org_id INTEGER REFERENCES organizations(id)');
} catch (e) {
  // Column already exists — ignore
}

// Add TOTP columns to users if not exists (safe re-run)
try {
  db.exec('ALTER TABLE users ADD COLUMN totp_secret TEXT');
} catch (e) {
  // Column already exists — ignore
}
try {
  db.exec('ALTER TABLE users ADD COLUMN totp_enabled INTEGER DEFAULT 0');
} catch (e) {
  // Column already exists — ignore
}

db.exec(`

  CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
  CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id);

  CREATE INDEX IF NOT EXISTS idx_login_log_username ON login_log(username);
  CREATE INDEX IF NOT EXISTS idx_login_log_logged_at ON login_log(logged_at);
  CREATE INDEX IF NOT EXISTS idx_login_log_status ON login_log(status);
`);

// ─── Seed data ───────────────────────────────────────────
const count = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
if (count === 0) {
  if (process.env.NODE_ENV === 'production') {
    console.warn(JSON.stringify({ event: 'seed_warning', msg: 'DB seeded in production with default passwords — change immediately' }));
  }
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare(`INSERT INTO users (username, password, full_name, email, phone, org_unit, role)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run('admin', hash, 'Nguyễn Văn A', 'admin@mtis.vn', '0912345678', 'Cục Hàng hải Việt Nam', 'system-admin');
  db.prepare(`INSERT INTO users (username, password, full_name, email, phone, org_unit, role)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run('chuyenviem1', hash, 'Trần Thị B', 'chuyenviem1@mtis.vn', '0987654321', 'Cảng vụ Hàng hải Hải Phòng', 'Chuyên viên');
  db.prepare(`INSERT INTO users (username, password, full_name, email, phone, org_unit, role)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run('lanhdao', hash, 'Lê Văn C', 'lanhdao@mtis.vn', '0977112233', 'Cảng vụ Hàng hải Hải Phòng', 'Lãnh đạo Cảng vụ');

  db.prepare('INSERT INTO user_groups (name, description) VALUES (?, ?)').run('Quản trị hệ thống', 'Nhóm quản trị toàn hệ thống');
  db.prepare('INSERT INTO user_groups (name, description) VALUES (?, ?)').run('Chuyên viên KCHT', 'Nhân viên quản lý KCHT');
  db.prepare('INSERT INTO user_groups (name, description) VALUES (?, ?)').run('Lãnh đạo', 'Cấp lãnh đạo phê duyệt');
}

// Seed organizations (if empty)
const orgCount = db.prepare('SELECT COUNT(*) as c FROM organizations').get().c;
if (orgCount === 0) {
  db.prepare('INSERT INTO organizations (name, description) VALUES (?, ?)').run('Cục Hàng hải Việt Nam', 'Cơ quan quản lý nhà nước về hàng hải');
  db.prepare('INSERT INTO organizations (name, description, parent_id) VALUES (?, ?, ?)').run('Cảng vụ Hàng hải Hải Phòng', 'Đơn vị trực thuộc Cục', 1);
  db.prepare('INSERT INTO organizations (name, description, parent_id) VALUES (?, ?, ?)').run('Cảng vụ Hàng hải Đà Nẵng', 'Đơn vị trực thuộc Cục', 1);
  db.prepare('INSERT INTO organizations (name, description, parent_id) VALUES (?, ?, ?)').run('Phòng KCHT', 'Phòng KCHT trực thuộc Cảng vụ Hải Phòng', 2);
}

// Seed group_permissions (if empty) — grant full CRUD to admin group only
const gpCount = db.prepare('SELECT COUNT(*) as c FROM group_permissions').get().c;
if (gpCount === 0) {
  // Admin group (id=1) gets full permissions on all M01 feature codes
  const featureCodes = ['user', 'group', 'permission', 'org', 'login_log', 'totp', 'session'];
  const insertGP = db.prepare('INSERT INTO group_permissions (group_id, feature_code, can_create, can_read, can_update, can_delete) VALUES (?, ?, ?, ?, ?, ?)');
  for (const fc of featureCodes) {
    insertGP.run(1, fc, 1, 1, 1, 1);
  }
  // Leadership group (id=3) gets read-only on login_log
  insertGP.run(3, 'login_log', 0, 1, 0, 0);
}

module.exports = db;
