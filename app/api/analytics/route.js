import { NextResponse } from 'next/server';
import { getStreakData, getCompletionStats, getAttendanceRange, getSetting } from '@/lib/db';
import { isAuthorized } from '@/lib/admin-auth';

export async function GET(req) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const rawDays = searchParams.get('days');
    let days = parseInt(rawDays ?? '', 10);
    if (Number.isNaN(days) || days < 1) {
      days = 30;
    } else if (days > 365) {
      days = 365;
    }
    const streak = getStreakData();
    const stats = getCompletionStats(days);

    // Get daily data for the chart (timezone-aware to avoid off-by-one around midnight)
    const timezone = getSetting('timezone') || 'Asia/Jakarta';
    const endStr = new Date().toLocaleDateString('en-CA', { timeZone: timezone });
    // Derive startStr from endStr (using UTC noon to avoid DST boundary issues)
    const endDateUtcNoon = new Date(`${endStr}T12:00:00Z`);
    endDateUtcNoon.setUTCDate(endDateUtcNoon.getUTCDate() - days);
    const startStr = endDateUtcNoon.toLocaleDateString('en-CA', { timeZone: timezone });
    const range = getAttendanceRange(startStr, endStr);

    // Group by date
    const dailyData = {};
    for (const row of range) {
      if (!dailyData[row.date]) dailyData[row.date] = {};
      dailyData[row.date][row.prayer] = row.status;
    }

    return NextResponse.json({ streak, stats, dailyData });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
