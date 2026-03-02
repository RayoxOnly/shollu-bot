const express = require('express');
const path = require('path');
const routes = require('./routes');
const { startScheduler } = require('./scheduler');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ─────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// ─── API Routes ─────────────────────────────────────────
app.use(routes);

// ─── SPA Fallback ───────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ─── Start Server ───────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║     🕌 Bot Absen Shollu v1.0              ║');
  console.log('╚═══════════════════════════════════════════╝');
  console.log(`[SERVER] 🌐 Dashboard: http://localhost:${PORT}`);
  console.log('');

  // Start the scheduler
  startScheduler();
});
