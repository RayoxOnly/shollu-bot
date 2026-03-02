import { NextResponse } from 'next/server';
import { getTodayPrayerTimes, getNextPrayer, PRAYER_LABELS } from '@/lib/prayer-times';
import { PRAYERS, getAttendanceByDate, getAllSettings } from '@/lib/db';

export async function GET() {
  try {
    const times = await getTodayPrayerTimes();
    const next = await getNextPrayer();
    const today = new Date().toISOString().split('T')[0];
    const attendance = getAttendanceByDate(today);

    const settings = getAllSettings();
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
