import { NextResponse } from 'next/server';
import { getAttendanceByDate } from '@/lib/db';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const attendance = getAttendanceByDate(date);
    return NextResponse.json({ date, attendance });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
