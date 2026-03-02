import { NextResponse } from 'next/server';
import { importData } from '@/lib/db';

export async function POST(req) {
  try {
    const data = await req.json();
    if (!data || !data.attendance) {
      return NextResponse.json({ error: 'Format data tidak valid' }, { status: 400 });
    }
    importData(data);
    return NextResponse.json({ success: true, imported: data.attendance.length });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
