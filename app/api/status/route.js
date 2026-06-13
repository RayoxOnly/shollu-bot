import { NextResponse } from 'next/server';
import { getSchedulerStatus } from '@/lib/scheduler';
import { isAuthorized } from '@/lib/admin-auth';

export async function GET(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    return NextResponse.json(getSchedulerStatus());
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
