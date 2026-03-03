import { NextResponse } from 'next/server';
import { getSchedulerStatus } from '@/lib/scheduler';

function isAuthorized(req) {
  const adminToken = process.env.ADMIN_TOKEN;

  // If no admin token is configured, do not enforce auth (e.g., development)
  if (!adminToken) {
    return true;
  }

  const authHeader = req.headers.get('authorization') || '';
  let token = authHeader;

  if (authHeader.toLowerCase().startsWith('bearer ')) {
    token = authHeader.slice(7);
  }

  return token === adminToken;
}

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
