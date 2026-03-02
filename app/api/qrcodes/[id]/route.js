import { NextResponse } from 'next/server';
import { removeQrCode, toggleQrCode } from '@/lib/db';
import { isAuthorized } from '@/lib/admin-auth';

export async function DELETE(req, { params }) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = await (params instanceof Promise ? params : Promise.resolve(params));
    const result = removeQrCode(parseInt(id, 10));
    if (result.changes === 0) {
      return NextResponse.json({ error: 'QR code tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = await (params instanceof Promise ? params : Promise.resolve(params));
    const result = toggleQrCode(parseInt(id, 10));
    if (result.changes === 0) {
      return NextResponse.json({ error: 'QR code tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
