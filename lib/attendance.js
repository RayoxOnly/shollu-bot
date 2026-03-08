import { login, invalidateToken } from './auth.js';
import { getSetting, getEnabledQrCodes, addLog } from './db.js';

const ABSEN_URL = 'https://api.shollu.com/api/v1/absent-qr';

function getApiKey() {
  return process.env.SHOLLU_API_KEY || getSetting('api_key') || 'shollusemakindidepan';
}

/**
 * Submit attendance for a single QR code.
 */
export async function submitOne(token, qrCode, eventId, mesinId, type = 'sholat_wajib', tag = null) {
  const payload = {
    qr_code: qrCode,
    event_id: parseInt(eventId, 10),
    mesin_id: mesinId,
    type,
  };
  if (tag) payload.tag = tag;

  const res = await fetch(ABSEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-API-Key': getApiKey(),
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  });

  const data = await res.json();
  if (!res.ok) {
    throw { response: { status: res.status, data } }; // Mock axios error format for catch block
  }
  return data;
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Submit attendance for ALL enabled QR codes, with delay between each.
 * Logs results to the database.
 * Returns summary array.
 */
export async function submitAll(prayer = 'subuh') {
  const qrCodes = getEnabledQrCodes();

  if (qrCodes.length === 0) {
    console.log(`[ABSEN] ⚠️  Tidak ada QR code yang aktif. (${prayer})`);
    addLog('-', '-', 'skip', 'Tidak ada QR code yang aktif', prayer);
    return [{ status: 'skip', message: 'Tidak ada QR code aktif' }];
  }

  const eventId = getSetting('event_id') || '3';
  const mesinId = getSetting('mesin_id') || '12';
  const delaySeconds = parseInt(getSetting('delay_seconds') || '3', 10);
  const absenType = prayer === 'tarawih' ? 'tarawih' : 'sholat_wajib';
  const absenTag = prayer === 'tarawih' ? 'tarawih' : null;
  const results = [];
  let hasRetried = false;

  // Login (will use cache if still valid)
  let token;
  try {
    token = await login();
  } catch (err) {
    console.error(`[ABSEN] ❌ Gagal login: ${err.message}`);
    addLog('-', '-', 'error', `Login gagal: ${err.message}`, prayer);
    return [{ status: 'error', message: `Login gagal: ${err.message}` }];
  }

  for (let i = 0; i < qrCodes.length; i++) {
    const qr = qrCodes[i];
    try {
      const response = await submitOne(token, qr.qr_code, eventId, mesinId, absenType, absenTag);
      const msg = response.message || response.msg || JSON.stringify(response).slice(0, 150);
      console.log(`[ABSEN] ✅ ${prayer} | ${qr.name} (${qr.qr_code}): ${msg}`);
      addLog(qr.qr_code, qr.name, 'success', msg, prayer);
      results.push({ name: qr.name, qr_code: qr.qr_code, status: 'success', message: msg });
    } catch (err) {
      let msg;

      if (err.response) {
        const status = err.response.status;
        msg = `HTTP ${status}: ${JSON.stringify(err.response.data).slice(0, 200)}`;

        // If 401 or 403, try re-login once per run
        if ((status === 401 || status === 403) && !hasRetried) {
          hasRetried = true;
          console.log('[ABSEN] 🔄 Token expired, mencoba login ulang...');
          invalidateToken();
          try {
            token = await login(true);
            // Retry this QR code
            const retryRes = await submitOne(token, qr.qr_code, eventId, mesinId, absenType, absenTag);
            const retryMsg = retryRes.message || retryRes.msg || JSON.stringify(retryRes).slice(0, 150);
            console.log(`[ABSEN] ✅ ${prayer} | ${qr.name} (${qr.qr_code}): ${retryMsg}`);
            addLog(qr.qr_code, qr.name, 'success', retryMsg, prayer);
            results.push({ name: qr.name, qr_code: qr.qr_code, status: 'success', message: retryMsg });
            if (i < qrCodes.length - 1) await sleep(delaySeconds * 1000);
            continue;
          } catch (retryErr) {
            msg = `Re-login gagal: ${retryErr.message}`;
          }
        }
      } else {
        msg = err.message;
      }

      console.error(`[ABSEN] ❌ ${prayer} | ${qr.name} (${qr.qr_code}): ${msg}`);
      addLog(qr.qr_code, qr.name, 'error', msg, prayer);
      results.push({ name: qr.name, qr_code: qr.qr_code, status: 'error', message: msg });
    }

    // Delay before next QR code (skip if last one)
    if (i < qrCodes.length - 1) {
      console.log(`[ABSEN] ⏳ Menunggu ${delaySeconds} detik sebelum QR berikutnya...`);
      await sleep(delaySeconds * 1000);
    }
  }

  return results;
}
