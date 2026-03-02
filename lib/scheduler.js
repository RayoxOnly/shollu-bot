import cron from 'node-cron';
import { getSetting, PRAYERS, markAttendance } from './db.js';
import { submitAll } from './attendance.js';
import { getTodayPrayerTimes, invalidatePrayerCache } from './prayer-times.js';

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
 * We store the jobs in a global to survive Next.js HMR.
 */
export async function startScheduler() {
  if (global._schedulerJobs) {
    for (const key of Object.keys(global._schedulerJobs)) {
      if (global._schedulerJobs[key]) {
        global._schedulerJobs[key].stop();
      }
    }
  }
  global._schedulerJobs = {};
  global._nextRunTimes = {};

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
  const tzLabel = { 'Asia/Jakarta': 'WIB', 'Asia/Makassar': 'WITA', 'Asia/Jayapura': 'WIT' }[timezone] || timezone;

  for (const prayer of PRAYERS) {
    const time = prayerTimes[prayer];
    if (!time) continue;

    // Check if this specific prayer is enabled
    const prayerEnabled = getSetting(`${prayer}_enabled`);
    if (prayerEnabled === '0') {
      console.log(`[SCHEDULER] ⏸️  ${prayer.charAt(0).toUpperCase() + prayer.slice(1)}: dinonaktifkan, dilewati.`);
      global._nextRunTimes[prayer] = { scheduled: null, original: time, enabled: false };
      continue;
    }

    const { cron: cronExpr, display } = timeToCron(time);
    global._nextRunTimes[prayer] = { scheduled: display, original: time, enabled: true };

    console.log(`[SCHEDULER] ⏰ ${prayer.charAt(0).toUpperCase() + prayer.slice(1)}: ${time} → absen ${display} ${tzLabel}`);

    global._schedulerJobs[prayer] = cron.schedule(cronExpr, async () => {
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
  }

  console.log(`[SCHEDULER] ✅ ${Object.keys(global._schedulerJobs).length} jadwal sholat aktif.`);
}

/**
 * Get scheduler status for the dashboard.
 */
export function getSchedulerStatus() {
  const jobs = global._schedulerJobs || {};
  const runTimes = global._nextRunTimes || {};
  return {
    active: Object.keys(jobs).length > 0,
    bot_enabled: getSetting('bot_enabled') === '1',
    prayer_times: runTimes,
    jobs_count: Object.keys(jobs).length,
  };
}
