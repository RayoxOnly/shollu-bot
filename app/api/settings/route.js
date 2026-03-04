import { NextResponse } from 'next/server';
import { getAllSettings, setSettings } from '@/lib/db';
import { invalidatePrayerCache } from '@/lib/prayer-times';
import { startScheduler } from '@/lib/scheduler';
import { isAuthorized } from '@/lib/admin-auth';

export async function GET(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const settings = getAllSettings();
    // Never send plaintext password to the browser
    const hasPassword = typeof settings.password === 'string' && settings.password.length > 0;
    settings.password_set = hasPassword;
    settings.password_masked = hasPassword ? '••••••••' : '';
    delete settings.password;
    return NextResponse.json(settings);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await req.json();
    const allowed = [
      'username', 'password', 'event_id', 'mesin_id',
      'subuh_time', 'dzuhur_time', 'ashar_time', 'maghrib_time', 'isya_time',
      'subuh_enabled', 'dzuhur_enabled', 'ashar_enabled', 'maghrib_enabled', 'isya_enabled',
      'delay_seconds', 'bot_enabled',
      'timezone', 'calculation_method', 'prayer_source',
      'theme', 'onboarding_complete', 'api_key',
    ];
    
    const updates = {};
    for (const key of allowed) {
      if (body[key] !== undefined && body[key] !== '') {
        updates[key] = body[key];
      }
    }
    
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Tidak ada setting yang valid' }, { status: 400 });
    }
    
    setSettings(updates);

    // Restart scheduler if prayer times or enabled changed
    const prayerKeys = ['subuh_time', 'dzuhur_time', 'ashar_time', 'maghrib_time', 'isya_time', 'subuh_enabled', 'dzuhur_enabled', 'ashar_enabled', 'maghrib_enabled', 'isya_enabled', 'bot_enabled', 'prayer_source', 'calculation_method', 'timezone'];
    
    if (prayerKeys.some((k) => updates[k] !== undefined)) {
      invalidatePrayerCache();
      await startScheduler();
    }

    return NextResponse.json({ success: true, updated: Object.keys(updates) });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
