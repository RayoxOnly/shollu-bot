const express = require('express');
const {
  getAllSettings,
  setSettings,
  getQrCodes,
  addQrCode,
  removeQrCode,
  toggleQrCode,
  getLogs,
  clearLogs,
  PRAYERS,
  markAttendance,
  unmarkAttendance,
  getAttendanceByDate,
  getAttendanceRange,
  getStreakData,
  getCompletionStats,
  exportAllData,
  importData,
} = require('./db');
const { getSchedulerStatus, startScheduler } = require('./scheduler');
const { submitAll } = require('./attendance');
const { getTodayPrayerTimes, getNextPrayer, invalidatePrayerCache, PRAYER_LABELS } = require('./prayer-times');

const router = express.Router();

// ─── Settings ──────────────────────────────────────────

router.get('/api/settings', (req, res) => {
  try {
    const settings = getAllSettings();
    // Mask password for security
    if (settings.password) {
      settings.password_masked = '*'.repeat(settings.password.length);
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/api/settings', (req, res) => {
  try {
    const allowed = [
      'username', 'password', 'event_id', 'mesin_id',
      'subuh_time', 'dzuhur_time', 'ashar_time', 'maghrib_time', 'isya_time',
      'delay_seconds', 'bot_enabled',
      'timezone', 'calculation_method', 'prayer_source',
      'theme', 'onboarding_complete',
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined && req.body[key] !== '') {
        updates[key] = req.body[key];
      }
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Tidak ada setting yang valid' });
    }
    setSettings(updates);

    // Restart scheduler if prayer times or enabled changed
    const prayerKeys = ['subuh_time', 'dzuhur_time', 'ashar_time', 'maghrib_time', 'isya_time', 'bot_enabled', 'prayer_source', 'calculation_method', 'timezone'];
    if (prayerKeys.some((k) => updates[k] !== undefined)) {
      invalidatePrayerCache();
      startScheduler();
    }

    res.json({ success: true, updated: Object.keys(updates) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Prayer Times ──────────────────────────────────────

router.get('/api/prayer-times', async (req, res) => {
  try {
    const times = await getTodayPrayerTimes();
    const next = await getNextPrayer();
    const today = new Date().toISOString().split('T')[0];
    const attendance = getAttendanceByDate(today);

    const prayers = PRAYERS.map((p) => ({
      key: p,
      label: PRAYER_LABELS[p],
      time: times[p],
      status: attendance[p] || 'pending',
    }));

    res.json({
      date: today,
      prayers,
      next_prayer: next,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Attendance ────────────────────────────────────────

router.post('/api/attendance/:prayer', (req, res) => {
  try {
    const { prayer } = req.params;
    if (!PRAYERS.includes(prayer)) {
      return res.status(400).json({ error: 'Sholat tidak valid' });
    }
    const date = req.body.date || new Date().toISOString().split('T')[0];
    const action = req.body.action || 'toggle';

    if (action === 'unmark') {
      unmarkAttendance(date, prayer);
    } else {
      markAttendance(date, prayer, 'completed');
    }

    res.json({ success: true, date, prayer, action });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/attendance', (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const attendance = getAttendanceByDate(date);
    res.json({ date, attendance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Analytics ─────────────────────────────────────────

router.get('/api/analytics', (req, res) => {
  try {
    const days = parseInt(req.query.days || '30', 10);
    const streak = getStreakData();
    const stats = getCompletionStats(days);

    // Get daily data for the chart
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    const range = getAttendanceRange(startStr, endStr);

    // Group by date
    const dailyData = {};
    for (const row of range) {
      if (!dailyData[row.date]) dailyData[row.date] = {};
      dailyData[row.date][row.prayer] = row.status;
    }

    res.json({ streak, stats, dailyData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── QR Codes ──────────────────────────────────────────

router.get('/api/qrcodes', (req, res) => {
  try {
    res.json(getQrCodes());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/api/qrcodes', (req, res) => {
  try {
    const { name, qr_code } = req.body;
    if (!name || !qr_code) {
      return res.status(400).json({ error: 'Nama dan QR code wajib diisi' });
    }
    addQrCode(name.trim(), qr_code.trim());
    res.json({ success: true });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'QR code sudah ada' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.delete('/api/qrcodes/:id', (req, res) => {
  try {
    const result = removeQrCode(parseInt(req.params.id, 10));
    if (result.changes === 0) {
      return res.status(404).json({ error: 'QR code tidak ditemukan' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/api/qrcodes/:id', (req, res) => {
  try {
    const result = toggleQrCode(parseInt(req.params.id, 10));
    if (result.changes === 0) {
      return res.status(404).json({ error: 'QR code tidak ditemukan' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Logs ──────────────────────────────────────────────

router.get('/api/logs', (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '100', 10);
    res.json(getLogs(limit));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/api/logs', (req, res) => {
  try {
    clearLogs();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Bot Status & Actions ──────────────────────────────

router.get('/api/status', (req, res) => {
  try {
    res.json(getSchedulerStatus());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/api/test', async (req, res) => {
  try {
    const prayer = req.body.prayer || 'subuh';
    console.log(`[MANUAL] 🔧 Manual trigger dari dashboard... (${prayer})`);
    const results = await submitAll(prayer);
    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Export / Import ───────────────────────────────────

router.get('/api/export', (req, res) => {
  try {
    const format = req.query.format || 'json';
    const data = exportAllData();

    if (format === 'csv') {
      // Convert attendance to CSV
      let csv = 'date,prayer,status,marked_at\n';
      for (const row of data.attendance) {
        csv += `${row.date},${row.prayer},${row.status},${row.marked_at || ''}\n`;
      }
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=shollu-data.csv');
      return res.send(csv);
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=shollu-data.json');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/api/import', (req, res) => {
  try {
    const data = req.body;
    if (!data || !data.attendance) {
      return res.status(400).json({ error: 'Format data tidak valid' });
    }
    importData(data);
    res.json({ success: true, imported: data.attendance.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
