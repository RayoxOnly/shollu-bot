import { NextResponse } from 'next/server';
import { submitAll } from '@/lib/attendance';

export async function POST(req) {
  try {
    let prayer = 'subuh';
    try {
      const body = await req.json();
      if (body.prayer) prayer = body.prayer;
    } catch (e) {}
    
    console.log(`[MANUAL] 🔧 Manual trigger dari dashboard... (${prayer})`);
    const results = await submitAll(prayer);
    return NextResponse.json({ success: true, results });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
