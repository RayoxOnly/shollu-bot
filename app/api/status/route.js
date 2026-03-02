import { NextResponse } from 'next/server';
import { getSchedulerStatus } from '@/lib/scheduler';

export async function GET() {
  try {
    return NextResponse.json(getSchedulerStatus());
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
