import { NextResponse } from 'next/server';
import { getQrCodes, addQrCode } from '@/lib/db';

export async function GET() {
  try {
    return NextResponse.json(getQrCodes());
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { name, qr_code } = await req.json();
    if (!name || !qr_code) {
      return NextResponse.json({ error: 'Nama dan QR code wajib diisi' }, { status: 400 });
    }
    
    addQrCode(name.trim(), qr_code.trim());
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return NextResponse.json({ error: 'QR code sudah ada' }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
