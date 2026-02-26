const axios = require('axios');
const { login, invalidateToken } = require('./auth');
const { getSetting, getEnabledQrCodes, addLog } = require('./db');

const ABSEN_URL = 'https://api.shollu.com/api/v1/absent-qr';
const API_KEY = 'shollusemakindidepan';

/**
 * Submit attendance for a single QR code.
 */
async function submitOne(token, qrCode, eventId) {
  const res = await axios.post(
    ABSEN_URL,
    {
      qr_code: qrCode,
      event_id: parseInt(eventId, 10),
      type: 'sholat_wajib',
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-API-Key': API_KEY,
      },
      timeout: 15000,
    }
  );
  return res.data;
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
async function submitAll() {
  const qrCodes = getEnabledQrCodes();

  if (qrCodes.length === 0) {
    console.log('[ABSEN] ⚠️  Tidak ada QR code yang aktif.');
    addLog('-', '-', 'skip', 'Tidak ada QR code yang aktif');
    return [{ status: 'skip', message: 'Tidak ada QR code aktif' }];
  }

  const eventId = getSetting('event_id') || '3';
  const delaySeconds = parseInt(getSetting('delay_seconds') || '3', 10);
  const results = [];

  // Login (will use cache if still valid)
  let token;
  try {
    token = await login();
  } catch (err) {
    console.error(`[ABSEN] ❌ Gagal login: ${err.message}`);
    addLog('-', '-', 'error', `Login gagal: ${err.message}`);
    return [{ status: 'error', message: `Login gagal: ${err.message}` }];
  }

  for (let i = 0; i < qrCodes.length; i++) {
    const qr = qrCodes[i];
    try {
      const response = await submitOne(token, qr.qr_code, eventId);
      const msg = response.message || response.msg || JSON.stringify(response).slice(0, 150);
      console.log(`[ABSEN] ✅ ${qr.name} (${qr.qr_code}): ${msg}`);
      addLog(qr.qr_code, qr.name, 'success', msg);
      results.push({ name: qr.name, qr_code: qr.qr_code, status: 'success', message: msg });
    } catch (err) {
      let msg;

      if (err.response) {
        const status = err.response.status;
        msg = `HTTP ${status}: ${JSON.stringify(err.response.data).slice(0, 200)}`;

        // If 401 or 403, try re-login once
        if ((status === 401 || status === 403) && i === 0) {
          console.log('[ABSEN] 🔄 Token expired, mencoba login ulang...');
          invalidateToken();
          try {
            token = await login(true);
            // Retry this QR code
            const retryRes = await submitOne(token, qr.qr_code, eventId);
            const retryMsg = retryRes.message || retryRes.msg || JSON.stringify(retryRes).slice(0, 150);
            console.log(`[ABSEN] ✅ ${qr.name} (${qr.qr_code}): ${retryMsg}`);
            addLog(qr.qr_code, qr.name, 'success', retryMsg);
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

      console.error(`[ABSEN] ❌ ${qr.name} (${qr.qr_code}): ${msg}`);
      addLog(qr.qr_code, qr.name, 'error', msg);
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

module.exports = { submitAll, submitOne };
