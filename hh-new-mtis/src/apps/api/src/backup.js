// -*- coding: utf-8 -*-
/**
 * MTIS Database Backup Script
 * 
 * Uses SQLite VACUUM INTO for safe online backup.
 * Designed to run as a cron job (every 6 hours):
 *   0 */6 * * * node src/backup.js
 * 
 * Environment variables:
 *   DB_PATH      � path to database.sqlite (default: /app/data/database.sqlite)
 *   BACKUP_DIR   � backup destination (default: /app/data/backups)
 *   BACKUP_KEEP  � number of backups to retain (default: 28 = 7 days @ 4�/day)
 */
const db = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || '/app/data/database.sqlite';
const BACKUP_DIR = process.env.BACKUP_DIR || path.dirname(DB_PATH) + '/backups';
const BACKUP_KEEP = Number(process.env.BACKUP_KEEP) || 28;

function backup() {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const dest = path.join(BACKUP_DIR, `mtis-${ts}.sqlite`);

  try {
    // Ensure backup directory exists
    fs.mkdirSync(BACKUP_DIR, { recursive: true });

    // VACUUM INTO creates a defragmented copy atomically
    const conn = new db(DB_PATH, { readonly: true });
    conn.exec(`VACUUM INTO '${dest.replace(/'/g, "''")}'`);
    conn.close();

    console.log(JSON.stringify({ event: 'backup_complete', file: path.basename(dest) }));

    // Rotate old backups
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('mtis-') && f.endsWith('.sqlite'))
      .sort();
    while (files.length > BACKUP_KEEP) {
      const old = files.shift();
      fs.unlinkSync(path.join(BACKUP_DIR, old));
      console.log(JSON.stringify({ event: 'backup_rotated', file: old }));
    }
  } catch (err) {
    console.error(JSON.stringify({ event: 'backup_failed', error: err.message }));
    process.exit(1);
  }
}

backup();
