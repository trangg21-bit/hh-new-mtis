const express = require('express');
const db = require('../db');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const BACKUP_DIR = path.join(__dirname, '..', '..', 'data', 'backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// GET /api/backup — list available backups
router.get('/', (req, res) => {
  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.sqlite'))
    .map(f => ({
      filename: f,
      size: fs.statSync(path.join(BACKUP_DIR, f)).size,
      created: fs.statSync(path.join(BACKUP_DIR, f)).mtime
    }));
  res.json({ backups });
});

// POST /api/backup/create — create backup
router.post('/create', (req, res) => {
  const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'database.sqlite');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `database-${timestamp}.sqlite`);
  try {
    const src = fs.readFileSync(dbPath);
    fs.writeFileSync(backupPath, src);
    console.log(JSON.stringify({ event: 'backup_created', file: path.basename(backupPath) }));
    res.status(201).json({ ok: true, message: `Backup created: ${path.basename(backupPath)}` });
  } catch (err) {
    res.status(500).json({ error: 'Backup failed: ' + err.message });
  }
});

// POST /api/backup/restore — restore from backup
router.post('/restore', (req, res) => {
  const { filename } = req.body;
  if (!filename) return res.status(400).json({ error: 'Thiếu filename' });
  const backupPath = path.join(BACKUP_DIR, filename);
  const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'database.sqlite');
  if (!fs.existsSync(backupPath)) {
    return res.status(404).json({ error: 'Backup file not found' });
  }
  try {
    const src = fs.readFileSync(backupPath);
    fs.writeFileSync(dbPath, src);
    console.log(JSON.stringify({ event: 'backup_restored', file: filename }));
    res.json({ ok: true, message: `Restored from ${filename}` });
  } catch (err) {
    res.status(500).json({ error: 'Restore failed: ' + err.message });
  }
});

module.exports = router;
