const cron = require('node-cron');
const { getSetting } = require('./db');
const { submitAll } = require('./attendance');

let currentJob = null;
let nextRunTime = null;

/**
 * Parse subuh_time ("HH:MM") and return a cron expression
 * that triggers 5 minutes after the configured time (safety margin).
 */
function timeToCron(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  // Add 5 minutes margin to ensure portal is open
  let safeMinutes = minutes + 5;
  let safeHours = hours;
  if (safeMinutes >= 60) {
    safeMinutes -= 60;
    safeHours = (safeHours + 1) % 24;
  }
  return `${safeMinutes} ${safeHours} * * *`;
}

/**
 * Format next run time for display
 */
function formatNextRun(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  let safeMinutes = minutes + 5;
  let safeHours = hours;
  if (safeMinutes >= 60) {
    safeMinutes -= 60;
    safeHours = (safeHours + 1) % 24;
  }
  return `${String(safeHours).padStart(2, '0')}:${String(safeMinutes).padStart(2, '0')}`;
}

/**
 * Start or restart the cron scheduler.
 */
function startScheduler() {
  // Stop existing job if any
  if (currentJob) {
    currentJob.stop();
    currentJob = null;
  }

  const botEnabled = getSetting('bot_enabled');
  if (botEnabled !== '1') {
    console.log('[SCHEDULER] ⏸️  Bot dinonaktifkan, scheduler tidak berjalan.');
    nextRunTime = null;
    return;
  }

  const subuhTime = getSetting('subuh_time') || '04:35';
  const cronExpr = timeToCron(subuhTime);
  nextRunTime = formatNextRun(subuhTime);

  console.log(`[SCHEDULER] ⏰ Menjadwalkan absen Subuh pada ${nextRunTime} WIB (cron: ${cronExpr})`);

  currentJob = cron.schedule(cronExpr, async () => {
    const now = new Date();
    console.log(`\n[SCHEDULER] 🕌 Waktu Subuh! Memulai absen otomatis... (${now.toLocaleString('id-ID')})`);
    try {
      const results = await submitAll();
      const success = results.filter((r) => r.status === 'success').length;
      const failed = results.filter((r) => r.status === 'error').length;
      console.log(`[SCHEDULER] 📊 Selesai: ${success} berhasil, ${failed} gagal`);
    } catch (err) {
      console.error(`[SCHEDULER] ❌ Error: ${err.message}`);
    }
  }, {
    timezone: 'Asia/Jakarta',
  });

  currentJob.start();
}

/**
 * Get scheduler status for the dashboard.
 */
function getSchedulerStatus() {
  return {
    active: currentJob !== null,
    bot_enabled: getSetting('bot_enabled') === '1',
    subuh_time: getSetting('subuh_time') || '04:35',
    next_run: nextRunTime,
  };
}

module.exports = { startScheduler, getSchedulerStatus };
