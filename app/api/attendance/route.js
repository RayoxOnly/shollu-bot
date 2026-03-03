import { NextResponse } from 'next/server';
import { getAttendanceByDate } from '@/lib/db';
import { isAuthorized } from '@/lib/admin-auth';

export async function GET(req) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const attendance = getAttendanceByDate(date);
    return NextResponse.json({ date, attendance });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
