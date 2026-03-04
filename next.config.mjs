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
  // Limit webpack to a single parallel worker so the build can complete on
  // low-RAM machines (e.g. 1 GB VPS).  This is a webpack-specific setting;
  // Next.js does not invoke this function at all when Turbopack is active,
  // so it has no effect on `next dev` (which uses Turbopack by default).
  webpack: (config) => {
    config.parallelism = 1;
    return config;
  },
};

export default nextConfig;
