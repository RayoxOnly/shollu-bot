import { NextResponse } from 'next/server';
import { importData } from '@/lib/db';
import { isAuthorized } from '@/lib/admin-auth';

const MAX_PAYLOAD_BYTES = 1024 * 1024; // 1 MB

export async function POST(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const contentLength = req.headers.get('content-length');
    if (contentLength && Number(contentLength) > MAX_PAYLOAD_BYTES) {
      return NextResponse.json({ error: 'Payload terlalu besar' }, { status: 413 });
    }

    const data = await req.json();
    if (!data || !Array.isArray(data.attendance) || data.attendance.length === 0) {
      return NextResponse.json({ error: 'Format data tidak valid' }, { status: 400 });
    }
    importData(data);
    return NextResponse.json({ success: true, imported: data.attendance.length });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
