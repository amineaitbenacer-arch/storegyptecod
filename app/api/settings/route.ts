import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'settings.json');

const EMPTY = {
  fb_pixel_1: '',
  fb_token_1: '',
  fb_pixel_2: '',
  fb_token_2: '',
  tiktok_pixel: '',
  tiktok_token: '',
  snapchat_pixel: '',
  snapchat_token: '',
  snapchat_pixel_2: '',
  snapchat_token_2: '',
};

async function readSettings() {
  try {
    const raw = await fs.readFile(SETTINGS_FILE, 'utf-8');
    return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    return { ...EMPTY };
  }
}

export async function GET(request: NextRequest) {
  const settings = await readSettings();
  const admin = request.nextUrl.searchParams.get('admin') === 'true';
  if (admin) {
    return NextResponse.json({ success: true, settings });
  }
  // Public: pixel IDs only (never tokens)
  return NextResponse.json({
    success: true,
    settings: {
      fb_pixel_1: settings.fb_pixel_1,
      fb_pixel_2: settings.fb_pixel_2,
      tiktok_pixel: settings.tiktok_pixel,
      snapchat_pixel: settings.snapchat_pixel,
      snapchat_pixel_2: settings.snapchat_pixel_2,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const incoming = body.settings || body;
    const current = await readSettings();
    const next = { ...current };
    (Object.keys(EMPTY) as (keyof typeof EMPTY)[]).forEach((key) => {
      if (incoming[key] !== undefined) next[key] = String(incoming[key] ?? '');
    });
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(next, null, 2), 'utf-8');
    return NextResponse.json({ success: true, settings: next });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to save settings' }, { status: 500 });
  }
}
