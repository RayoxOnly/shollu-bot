import { NextResponse } from 'next/server';
import { getStreakData, getCompletionStats, getAttendanceRange } from '@/lib/db';
import { isAuthorized } from '@/lib/auth';

export async function GET(req) {
  try {
    const authorized = await isAuthorized(req);
    if (!authorized) {
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

    // Get daily data for the chart
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
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
