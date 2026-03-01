const cron = require('node-cron');
const { getSetting, PRAYERS, markAttendance } = require('./db');
const { submitAll } = require('./attendance');
const { getTodayPrayerTimes, invalidatePrayerCache } = require('./prayer-times');

let currentJobs = {};
let nextRunTimes = {};

/**
 * Parse time string ("HH:MM") and return a cron expression
 * that triggers 5 minutes after the time (safety margin for Shollu portal).
 */
function timeToCron(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  let safeMinutes = minutes + 5;
  let safeHours = hours;
  if (safeMinutes >= 60) {
    safeMinutes -= 60;
    safeHours = (safeHours + 1) % 24;
  }
  return { cron: `${safeMinutes} ${safeHours} * * *`, display: `${String(safeHours).padStart(2, '0')}:${String(safeMinutes).padStart(2, '0')}` };
}

/**
 * Start or restart all cron schedulers for all 5 prayers.
 */
async function startScheduler() {
  // Stop all existing jobs
  for (const key of Object.keys(currentJobs)) {
    if (currentJobs[key]) {
      currentJobs[key].stop();
    }
  }
  currentJobs = {};
  nextRunTimes = {};

  const botEnabled = getSetting('bot_enabled');
  if (botEnabled !== '1') {
    console.log('[SCHEDULER] ⏸️  Bot dinonaktifkan, scheduler tidak berjalan.');
    return;
  }

  // Get prayer times
  let prayerTimes;
  try {
    prayerTimes = await getTodayPrayerTimes();
  } catch (err) {
    console.error(`[SCHEDULER] ❌ Gagal ambil waktu sholat: ${err.message}`);
    return;
  }

  const timezone = getSetting('timezone') || 'Asia/Jakarta';

  for (const prayer of PRAYERS) {
    const time = prayerTimes[prayer];
    if (!time) continue;

    // Check if this specific prayer is enabled
    const prayerEnabled = getSetting(`${prayer}_enabled`);
    if (prayerEnabled === '0') {
      console.log(`[SCHEDULER] ⏸️  ${prayer.charAt(0).toUpperCase() + prayer.slice(1)}: dinonaktifkan, dilewati.`);
      nextRunTimes[prayer] = { scheduled: null, original: time, enabled: false };
      continue;
    }

    const { cron: cronExpr, display } = timeToCron(time);
    nextRunTimes[prayer] = { scheduled: display, original: time, enabled: true };

    console.log(`[SCHEDULER] ⏰ ${prayer.charAt(0).toUpperCase() + prayer.slice(1)}: ${time} → absen ${display} WIB`);

    currentJobs[prayer] = cron.schedule(cronExpr, async () => {
      const now = new Date();
      console.log(`\n[SCHEDULER] 🕌 Waktu ${prayer}! Memulai absen otomatis... (${now.toLocaleString('id-ID')})`);
      try {
        const results = await submitAll(prayer);
        const success = results.filter((r) => r.status === 'success').length;
        const failed = results.filter((r) => r.status === 'error').length;
        console.log(`[SCHEDULER] 📊 ${prayer}: ${success} berhasil, ${failed} gagal`);

        // Auto-mark attendance if at least one success
        if (success > 0) {
          const today = now.toISOString().split('T')[0];
          markAttendance(today, prayer, 'completed');
        }
      } catch (err) {
        console.error(`[SCHEDULER] ❌ Error ${prayer}: ${err.message}`);
      }
    }, {
      timezone,
    });

    currentJobs[prayer].start();
  }

  console.log(`[SCHEDULER] ✅ ${Object.keys(currentJobs).length} jadwal sholat aktif.`);
}

/**
 * Get scheduler status for the dashboard.
 */
function getSchedulerStatus() {
  return {
    active: Object.keys(currentJobs).length > 0,
    bot_enabled: getSetting('bot_enabled') === '1',
    prayer_times: nextRunTimes,
    jobs_count: Object.keys(currentJobs).length,
  };
}

module.exports = { startScheduler, getSchedulerStatus };
