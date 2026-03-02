import { NextResponse } from 'next/server';
import { getStreakData, getCompletionStats, getAttendanceRange } from '@/lib/db';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30', 10);
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
