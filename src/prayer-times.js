const axios = require('axios');
const { getSetting, PRAYERS } = require('./db');

// Cache daily prayer times from API
let cachedTimes = null;
let cachedDate = null;

const PRAYER_LABELS = {
  subuh: 'Subuh',
  dzuhur: 'Dzuhur',
  ashar: 'Ashar',
  maghrib: 'Maghrib',
  isya: 'Isya',
};

// Map our prayer names to Aladhan API response keys
const ALADHAN_MAP = {
  subuh: 'Fajr',
  dzuhur: 'Dhuhr',
  ashar: 'Asr',
  maghrib: 'Maghrib',
  isya: 'Isha',
};

/**
 * Get prayer times from Aladhan API.
 * Uses city-based lookup with timezone.
 */
async function fetchFromAladhan(date) {
  const method = getSetting('calculation_method') || '20';
  const timezone = getSetting('timezone') || 'Asia/Jakarta';

  // Use timings by date endpoint with timezone
  const dateStr = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
  const url = `https://api.aladhan.com/v1/timingsByCity/${dateStr}`;

  try {
    const res = await axios.get(url, {
      params: {
        city: 'Jakarta',
        country: 'Indonesia',
        method: parseInt(method, 10),
      },
      timeout: 10000,
    });

    const timings = res.data.data.timings;
    const result = {};
    for (const [key, apiKey] of Object.entries(ALADHAN_MAP)) {
      // Aladhan returns "HH:MM (TZ)" — strip timezone part
      result[key] = timings[apiKey].split(' ')[0];
    }
    return result;
  } catch (err) {
    console.error(`[PRAYER] ❌ Gagal ambil waktu dari Aladhan: ${err.message}`);
    return null;
  }
}

/**
 * Get manual prayer times from settings.
 */
function getManualTimes() {
  const result = {};
  for (const p of PRAYERS) {
    result[p] = getSetting(`${p}_time`) || '00:00';
  }
  return result;
}

/**
 * Get today's prayer times — either from API or manual settings.
 * Caches API results for the day.
 */
async function getTodayPrayerTimes() {
  const source = getSetting('prayer_source') || 'manual';
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  if (source === 'api') {
    // Return cached if same day
    if (cachedTimes && cachedDate === todayStr) {
      return cachedTimes;
    }
    const apiTimes = await fetchFromAladhan(today);
    if (apiTimes) {
      cachedTimes = apiTimes;
      cachedDate = todayStr;
      return apiTimes;
    }
    // Fallback to manual if API fails
    console.log('[PRAYER] ⚠️ Fallback ke waktu manual.');
    return getManualTimes();
  }

  return getManualTimes();
}

/**
 * Get the next upcoming prayer based on current time.
 */
async function getNextPrayer() {
  const times = await getTodayPrayerTimes();
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  for (const p of PRAYERS) {
    const [h, m] = times[p].split(':').map(Number);
    const prayerMinutes = h * 60 + m;
    if (prayerMinutes > nowMinutes) {
      return { prayer: p, time: times[p], label: PRAYER_LABELS[p] };
    }
  }

  // All prayers passed today — next is subuh tomorrow
  return { prayer: 'subuh', time: times.subuh, label: PRAYER_LABELS.subuh, tomorrow: true };
}

/**
 * Invalidate cached prayer times (e.g., after settings change).
 */
function invalidatePrayerCache() {
  cachedTimes = null;
  cachedDate = null;
}

module.exports = {
  getTodayPrayerTimes,
  getNextPrayer,
  getManualTimes,
  invalidatePrayerCache,
  PRAYER_LABELS,
};
