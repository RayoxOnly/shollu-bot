import { NextResponse } from 'next/server';
import { getLogs, clearLogs } from '@/lib/db';
import { isAuthorized } from '@/lib/admin-auth';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const rawLimit = searchParams.get('limit');
    let limit = parseInt(rawLimit ?? '', 10);
    if (Number.isNaN(limit) || limit < 1) {
      limit = 100;
    } else if (limit > 500) {
      limit = 500;
    }
    return NextResponse.json(getLogs(limit));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    clearLogs();
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
