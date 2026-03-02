import { NextResponse } from 'next/server';
import { PRAYERS, markAttendance, unmarkAttendance } from '@/lib/db';

export async function POST(req, { params }) {
  try {
    // params is a Promise in Next.js 15+ dynamic routes
    const resolvedParams = await Promise.resolve(params);
    const prayer = resolvedParams.prayer;
    
    if (!PRAYERS.includes(prayer)) {
      return NextResponse.json({ error: 'Sholat tidak valid' }, { status: 400 });
    }
    
    let body = {};
    try {
      body = await req.json();
    } catch (e) {}
    
    const date = body.date || new Date().toISOString().split('T')[0];
    const action = body.action || 'toggle';

    if (action === 'unmark') {
      unmarkAttendance(date, prayer);
    } else {
      markAttendance(date, prayer, 'completed');
    }

    return NextResponse.json({ success: true, date, prayer, action });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
