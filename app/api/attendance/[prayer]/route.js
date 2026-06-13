import { NextResponse } from 'next/server';
import { PRAYERS, markAttendance, unmarkAttendance } from '@/lib/db';
import { isAuthorized } from '@/lib/admin-auth';

export async function POST(req, { params }) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
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
    } catch {
      // Body parsing failed; body stays as {} — handled below via validation
    }
    
    const date = body.date;
    if (typeof date !== 'string' || date.trim() === '') {
      return NextResponse.json({ error: 'Tanggal wajib dikirim oleh klien' }, { status: 400 });
    }
    
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
