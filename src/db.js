const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'bot.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// ---- Create tables ----
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS qr_codes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    qr_code    TEXT NOT NULL UNIQUE,
    enabled    INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS logs (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    qr_code    TEXT NOT NULL,
    name       TEXT NOT NULL,
    status     TEXT NOT NULL,
    message    TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );
`);

// ---- Default settings ----
const DEFAULTS = {
  username: '',
  password: '',
  event_id: '3',
  subuh_time: '04:35',
  delay_seconds: '3',
  bot_enabled: '1',
};

const insertDefault = db.prepare(
  `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`
);

for (const [key, value] of Object.entries(DEFAULTS)) {
  insertDefault.run(key, value);
}

// ---- Helper functions ----

function getSetting(key) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : null;
}

function getAllSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  return settings;
}

function setSetting(key, value) {
  db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?'
  ).run(key, value, value);
}

function setSettings(obj) {
  const stmt = db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?'
  );
  const tx = db.transaction(() => {
    for (const [key, value] of Object.entries(obj)) {
      stmt.run(key, String(value), String(value));
    }
  });
  tx();
}

function getQrCodes() {
  return db.prepare('SELECT * FROM qr_codes ORDER BY created_at DESC').all();
}

function getEnabledQrCodes() {
  return db
    .prepare('SELECT * FROM qr_codes WHERE enabled = 1 ORDER BY id ASC')
    .all();
}

function addQrCode(name, qrCode) {
  return db
    .prepare('INSERT INTO qr_codes (name, qr_code) VALUES (?, ?)')
    .run(name, qrCode);
}

function removeQrCode(id) {
  return db.prepare('DELETE FROM qr_codes WHERE id = ?').run(id);
}

function toggleQrCode(id) {
  return db
    .prepare('UPDATE qr_codes SET enabled = CASE WHEN enabled = 1 THEN 0 ELSE 1 END WHERE id = ?')
    .run(id);
}

function addLog(qrCode, name, status, message) {
  return db
    .prepare(
      'INSERT INTO logs (qr_code, name, status, message) VALUES (?, ?, ?, ?)'
    )
    .run(qrCode, name, status, message || '');
}

function getLogs(limit = 100) {
  return db
    .prepare('SELECT * FROM logs ORDER BY id DESC LIMIT ?')
    .all(limit);
}

function clearLogs() {
  return db.prepare('DELETE FROM logs').run();
}

module.exports = {
  db,
  getSetting,
  getAllSettings,
  setSetting,
  setSettings,
  getQrCodes,
  getEnabledQrCodes,
  addQrCode,
  removeQrCode,
  toggleQrCode,
  addLog,
  getLogs,
  clearLogs,
};
