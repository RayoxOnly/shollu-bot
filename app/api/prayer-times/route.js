import { NextResponse } from 'next/server';
import { getTodayPrayerTimes, getNextPrayer, PRAYER_LABELS } from '@/lib/prayer-times';
import { PRAYERS, getAttendanceByDate, getAllSettings } from '@/lib/db';

function isAuthorized(request) {
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) return false;

  const authHeader = request.headers.get('authorization') || request.headers.get('x-admin-token');
  if (!authHeader) return false;

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  return token === adminToken;
}

export async function GET(request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const settings = getAllSettings();
    const timezone = settings.timezone || 'Asia/Jakarta';
    const today = new Date().toLocaleDateString('en-CA', { timeZone: timezone });
    const times = await getTodayPrayerTimes();
    const next = await getNextPrayer();
    const attendance = getAttendanceByDate(today);
    const prayers = PRAYERS.map((p) => ({
      key: p,
      label: PRAYER_LABELS[p],
      time: times[p],
      status: attendance[p] || 'pending',
      enabled: settings[`${p}_enabled`] !== '0',
    }));

    return NextResponse.json({
      date: today,
      prayers,
      next_prayer: next,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
