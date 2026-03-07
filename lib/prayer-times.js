import { getSetting, PRAYERS } from './db.js';

// Cache daily prayer times from API
let cachedTimes = null;
let cachedDate = null;

export const PRAYER_LABELS = {
  subuh: 'Subuh',
  dzuhur: 'Dzuhur',
  ashar: 'Ashar',
  maghrib: 'Maghrib',
  isya: 'Isya',
  tarawih: 'Tarawih',
};

// Map our prayer names to Aladhan API response keys
const ALADHAN_MAP = {
  subuh: 'Fajr',
  dzuhur: 'Dhuhr',
  ashar: 'Asr',
  maghrib: 'Maghrib',
  isya: 'Isha',
};

// Map common Indonesian timezones to their representative cities for the Aladhan API
const TIMEZONE_CITY_MAP = {
  'Asia/Jakarta': 'Jakarta',
  'Asia/Makassar': 'Makassar',
  'Asia/Jayapura': 'Jayapura',
};

/**
 * Get prayer times from Aladhan API.
 * Uses city-based lookup with timezone.
 * @param {string} todayStr - Date string in YYYY-MM-DD format (timezone-aware)
 */
async function fetchFromAladhan(todayStr) {
  const method = getSetting('calculation_method') || '20';
  const timezone = getSetting('timezone') || 'Asia/Jakarta';
  const city = TIMEZONE_CITY_MAP[timezone] || 'Jakarta';

  // Derive Aladhan date format (DD-M-YYYY) from timezone-aware date string
  const [year, month, day] = todayStr.split('-').map(Number);
  const dateStr = `${day}-${month}-${year}`;
  const url = `https://api.aladhan.com/v1/timingsByCity/${dateStr}?city=${city}&country=Indonesia&method=${method}`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000)
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    const timings = data.data.timings;
    
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
export function getManualTimes() {
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
export async function getTodayPrayerTimes() {
  const source = getSetting('prayer_source') || 'manual';
  const timezone = getSetting('timezone') || 'Asia/Jakarta';
  const today = new Date();
  const todayStr = today.toLocaleDateString('en-CA', { timeZone: timezone });

  if (source === 'api') {
    // Return cached if same day
    if (cachedTimes && cachedDate === todayStr) {
      return cachedTimes;
    }
    const apiTimes = await fetchFromAladhan(todayStr);
    if (apiTimes) {
      // Tarawih is not in the Aladhan API — always use manual setting
      apiTimes.tarawih = getSetting('tarawih_time') || '20:00';
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
export async function getNextPrayer() {
  const times = await getTodayPrayerTimes();
  const timezone = getSetting('timezone') || 'Asia/Jakarta';
  const now = new Date();

  // Use timezone-aware current time to avoid off-by-hour errors on non-UTC servers
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const h = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10) % 24;
  const m = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
  const nowMinutes = h * 60 + m;

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
export function invalidatePrayerCache() {
  cachedTimes = null;
  cachedDate = null;
}
