import { NextResponse } from 'next/server';
import { submitAll } from '@/lib/attendance';
import { isAuthorized } from '@/lib/admin-auth';
import { PRAYERS } from '@/lib/db';

export async function POST(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    let prayer = 'subuh';
    try {
      const body = await req.json();
      if (body?.prayer) prayer = body.prayer;
    } catch {
      // Body parsing failed, proceed with default prayer 'subuh'
    }

    if (!PRAYERS.includes(prayer)) {
      return NextResponse.json({ error: `Nama sholat tidak valid: "${prayer}"` }, { status: 400 });
    }

    console.log(`[MANUAL] 🔧 Manual trigger dari dashboard... (${prayer})`);
    const results = await submitAll(prayer);
    return NextResponse.json({ success: true, results });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
