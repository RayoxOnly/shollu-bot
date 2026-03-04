import { timingSafeEqual } from 'crypto';

/**
 * Optional admin-token authorization for privileged API routes.
 *
 * Set the ADMIN_TOKEN environment variable to enable auth.
 * When set, every protected route requires either:
 *   - Authorization: Bearer <token>  header, or
 *   - x-admin-token: <token>          header.
 *
 * When ADMIN_TOKEN is not set, all requests are allowed.
 * Restrict access at the network level (firewall, VPN) if needed.
 */
export function isAuthorized(req) {
  const expectedToken = process.env.ADMIN_TOKEN;
  if (!expectedToken) {
    // No token configured – allow access.
    // Secure your deployment at the network level (firewall, nginx, VPN).
    return true;
  }

  const authHeader = req.headers.get('authorization') || '';
  let providedToken = null;

  if (authHeader.toLowerCase().startsWith('bearer ')) {
    providedToken = authHeader.slice(7).trim();
  }

  if (!providedToken) {
    providedToken = req.headers.get('x-admin-token');
  }

  if (!providedToken) return false;

  try {
    const expected = Buffer.from(expectedToken, 'utf8');
    const provided = Buffer.from(providedToken, 'utf8');
    if (expected.length !== provided.length) return false;
    return timingSafeEqual(expected, provided);
  } catch {
    return false;
  }
}
