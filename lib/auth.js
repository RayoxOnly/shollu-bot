import { getSetting } from './db.js';

const LOGIN_URL = 'https://app.shollu.com/auth/partners-login';

let cachedToken = null;
let tokenTimestamp = 0;
const TOKEN_LIFETIME_MS = 3 * 60 * 60 * 1000; // refresh every 3 hours

/**
 * Login to Shollu and return JWT token.
 * Caches the token and reuses until expired.
 */
export async function login(forceRefresh = false) {
  const now = Date.now();

  if (!forceRefresh && cachedToken && now - tokenTimestamp < TOKEN_LIFETIME_MS) {
    return cachedToken;
  }

  const username = getSetting('username');
  const password = getSetting('password');

  if (!username || !password) {
    throw new Error('Username atau password belum diatur. Buka dashboard untuk setup.');
  }

  try {
    const res = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      signal: AbortSignal.timeout(15000),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${JSON.stringify(data).slice(0, 200)}`);
    }

    // The token could be in various response structures
    let token = null;

    if (data.token) {
      token = data.token;
    } else if (data.data && data.data.token) {
      token = data.data.token;
    } else if (data.access_token) {
      token = data.access_token;
    } else if (typeof data === 'string') {
      token = data;
    }

    if (!token) {
      throw new Error(`Login response tidak mengandung token: ${JSON.stringify(data).slice(0, 200)}`);
    }

    cachedToken = token;
    tokenTimestamp = now;
    console.log(`[AUTH] ✅ Login berhasil, token diperoleh.`);
    return token;
  } catch (err) {
    cachedToken = null;
    tokenTimestamp = 0;
    throw new Error(`Login gagal: ${err.message}`);
  }
}

/**
 * Invalidate cached token (e.g., after a 401 response).
 */
export function invalidateToken() {
  cachedToken = null;
  tokenTimestamp = 0;
}
