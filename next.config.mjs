/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  // Allow cross-origin requests to /_next/* in dev mode when running behind a
  // reverse proxy (e.g. nginx on a VPS).  Set ALLOWED_DEV_ORIGINS to a
  // comma-separated list of origins, e.g.:
  //   ALLOWED_DEV_ORIGINS=http://203.0.113.10,https://myapp.example.com
  ...(process.env.ALLOWED_DEV_ORIGINS && {
    allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS.split(',').map((s) => s.trim()).filter((s) => s.length > 0),
  }),
};

export default nextConfig;
