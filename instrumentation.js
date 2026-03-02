// NOTE: The node-cron scheduler started here requires a persistent long-lived
// Node.js process. It will NOT work reliably on serverless platforms (e.g.
// Vercel, Netlify Functions) where instances spin up and down on demand.
// Deploy to a traditional server / VPS (e.g. via PM2 or Docker) to ensure
// the scheduler keeps running continuously.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startScheduler } = await import('./lib/scheduler.js');
    await startScheduler();
  }
}
