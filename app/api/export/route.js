import { NextResponse } from 'next/server';
import { exportAllData } from '@/lib/db';
import { isAuthorized } from '@/lib/admin-auth';

export async function GET(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'json';
    const data = exportAllData();
    // Exclude sensitive credentials from export
    if (data.settings) {
      delete data.settings.password;
    }

    if (format === 'csv') {
      let csv = 'date,prayer,status,marked_at\n';
      for (const row of data.attendance) {
        csv += `${row.date},${row.prayer},${row.status},${row.marked_at || ''}\n`;
      }
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename=shollu-data.csv',
        },
      });
    }

    return NextResponse.json(data, {
      headers: {
        'Content-Disposition': 'attachment; filename=shollu-data.json',
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
