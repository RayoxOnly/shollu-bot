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
} = require('./db');
const { getSchedulerStatus, startScheduler } = require('./scheduler');
const { submitAll } = require('./attendance');

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
    const allowed = ['username', 'password', 'event_id', 'mesin_id', 'subuh_time', 'delay_seconds', 'bot_enabled'];
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

    // Restart scheduler if time or enabled changed
    if (updates.subuh_time || updates.bot_enabled !== undefined) {
      startScheduler();
    }

    res.json({ success: true, updated: Object.keys(updates) });
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
    console.log('[MANUAL] 🔧 Manual trigger dari dashboard...');
    const results = await submitAll();
    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
