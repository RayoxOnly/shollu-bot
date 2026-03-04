// Use bun:sqlite when running under bun, fall back to better-sqlite3 for Node.js
const IS_BUN = typeof Bun !== 'undefined';
let Database;
if (IS_BUN) {
  Database = require('bun:sqlite').Database;
} else {
  Database = require('better-sqlite3');
}
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'bot.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better performance
if (IS_BUN) {
  db.exec('PRAGMA journal_mode = WAL');
} else {
  db.pragma('journal_mode = WAL');
}

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
    prayer     TEXT NOT NULL DEFAULT 'subuh',
    status     TEXT NOT NULL,
    message    TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    date       TEXT NOT NULL,
    prayer     TEXT NOT NULL,
    status     TEXT NOT NULL DEFAULT 'pending',
    marked_at  TEXT,
    UNIQUE(date, prayer)
  );
`);

// Migrate: add 'prayer' column to logs if missing
try {
  db.prepare("SELECT prayer FROM logs LIMIT 1").get();
} catch {
  db.exec("ALTER TABLE logs ADD COLUMN prayer TEXT NOT NULL DEFAULT 'subuh'");
}

// ---- Default settings ----
const DEFAULTS = {
  username: '',
  password: '',
  event_id: '3',
  mesin_id: '12',
  subuh_time: '04:35',
  dzuhur_time: '12:00',
  ashar_time: '15:15',
  maghrib_time: '18:00',
  isya_time: '19:15',
  subuh_enabled: '1',
  dzuhur_enabled: '1',
  ashar_enabled: '1',
  maghrib_enabled: '1',
  isya_enabled: '1',
  delay_seconds: '3',
  bot_enabled: '1',
  timezone: 'Asia/Jakarta',
  calculation_method: '20',
  prayer_source: 'manual',
  theme: 'dark',
  onboarding_complete: '0',
};

const PRAYERS = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'];

const insertDefault = db.prepare(
  `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`
);

for (const [key, value] of Object.entries(DEFAULTS)) {
  insertDefault.run(key, value);
}

// ---- Setting helpers ----

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

// ---- QR Code helpers ----

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

// ---- Log helpers ----

function addLog(qrCode, name, status, message, prayer = 'subuh') {
  return db
    .prepare(
      'INSERT INTO logs (qr_code, name, prayer, status, message) VALUES (?, ?, ?, ?, ?)'
    )
    .run(qrCode, name, prayer, status, message || '');
}

function getLogs(limit = 100) {
  return db
    .prepare('SELECT * FROM logs ORDER BY id DESC LIMIT ?')
    .all(limit);
}

function clearLogs() {
  return db.prepare('DELETE FROM logs').run();
}

// ---- Attendance helpers ----

function markAttendance(date, prayer, status = 'completed') {
  return db.prepare(
    `INSERT INTO attendance (date, prayer, status, marked_at)
     VALUES (?, ?, ?, datetime('now', 'localtime'))
     ON CONFLICT(date, prayer) DO UPDATE SET status = ?, marked_at = datetime('now', 'localtime')`
  ).run(date, prayer, status, status);
}

function unmarkAttendance(date, prayer) {
  return db.prepare(
    `INSERT INTO attendance (date, prayer, status, marked_at)
     VALUES (?, ?, 'pending', NULL)
     ON CONFLICT(date, prayer) DO UPDATE SET status = 'pending', marked_at = NULL`
  ).run(date, prayer);
}

function getAttendanceByDate(date) {
  const rows = db.prepare('SELECT * FROM attendance WHERE date = ?').all(date);
  const result = {};
  for (const p of PRAYERS) {
    const found = rows.find((r) => r.prayer === p);
    result[p] = found ? found.status : 'pending';
  }
  return result;
}

function getAttendanceRange(startDate, endDate) {
  return db.prepare(
    'SELECT * FROM attendance WHERE date >= ? AND date <= ? ORDER BY date ASC'
  ).all(startDate, endDate);
}

function getStreakData() {
  // Get all dates with all 5 prayers completed, ordered desc
  const rows = db.prepare(`
    SELECT date, COUNT(*) as completed
    FROM attendance
    WHERE status = 'completed'
    GROUP BY date
    HAVING completed = ?
    ORDER BY date DESC
  `).all(PRAYERS.length);

  if (rows.length === 0) return { current: 0, best: 0 };

  // Calculate current streak
  let currentStreak = 0;
  const today = new Date();

  // Check from today backwards
  for (let i = 0; i < rows.length; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const checkStr = checkDate.toISOString().split('T')[0];
    if (rows.find((r) => r.date === checkStr)) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Calculate best streak
  let bestStreak = 0;
  let streak = 1;
  for (let i = 1; i < rows.length; i++) {
    const prev = new Date(rows[i - 1].date);
    const curr = new Date(rows[i].date);
    const diffDays = (prev - curr) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      streak++;
    } else {
      bestStreak = Math.max(bestStreak, streak);
      streak = 1;
    }
  }
  bestStreak = Math.max(bestStreak, streak);

  return { current: currentStreak, best: bestStreak };
}

function getCompletionStats(days = 30) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM attendance
    WHERE date >= ? AND date <= ? AND status = 'completed'
  `).get(startStr, endStr);

  const possible = days * PRAYERS.length;
  const completed = total ? total.count : 0;
  const rate = possible > 0 ? Math.round((completed / possible) * 100) : 0;

  // Per-prayer stats
  const perPrayer = {};
  for (const p of PRAYERS) {
    const pCount = db.prepare(`
      SELECT COUNT(*) as count FROM attendance
      WHERE date >= ? AND date <= ? AND prayer = ? AND status = 'completed'
    `).get(startStr, endStr, p);
    perPrayer[p] = {
      completed: pCount ? pCount.count : 0,
      total: days,
      rate: days > 0 ? Math.round(((pCount ? pCount.count : 0) / days) * 100) : 0,
    };
  }

  return { completed, possible, rate, perPrayer, days };
}

// ---- Export / Import ----

function exportAllData() {
  return {
    settings: getAllSettings(),
    qr_codes: getQrCodes(),
    attendance: db.prepare('SELECT * FROM attendance ORDER BY date ASC').all(),
    logs: db.prepare('SELECT * FROM logs ORDER BY id DESC LIMIT 500').all(),
    exported_at: new Date().toISOString(),
  };
}

function importData(data) {
  const tx = db.transaction(() => {
    // Import attendance records
    if (data.attendance && Array.isArray(data.attendance)) {
      const stmt = db.prepare(
        `INSERT OR REPLACE INTO attendance (date, prayer, status, marked_at) VALUES (?, ?, ?, ?)`
      );
      for (const row of data.attendance) {
        stmt.run(row.date, row.prayer, row.status, row.marked_at || null);
      }
    }
  });
  tx();
}

module.exports = {
  db,
  PRAYERS,
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
  markAttendance,
  unmarkAttendance,
  getAttendanceByDate,
  getAttendanceRange,
  getStreakData,
  getCompletionStats,
  exportAllData,
  importData,
};
