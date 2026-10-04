import { NextRequest, NextResponse } from 'next/server';
import { readSettings, writeSettings } from '../../../lib/settings-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function errorMessage(error: unknown) {
  if (typeof error === 'string' && error.trim()) return error.trim();
  if (error && typeof error === 'object') {
    const record = error as { message?: unknown; code?: unknown; name?: unknown; detail?: unknown };
    const parts = [record.name, record.code, record.message, record.detail]
      .map((part) => (typeof part === 'string' ? part.trim() : ''))
      .filter(Boolean);
    if (parts.length) return parts.join(' · ').slice(0, 400);
  }
  if (error instanceof Error && error.message) return error.message;
  const text = String(error ?? '').trim();
  return text && text !== '[object Object]' ? text.slice(0, 400) : 'Failed to save settings';
}

export async function GET(request: NextRequest) {
  const settings = await readSettings();
  const admin = request.nextUrl.searchParams.get('admin') === 'true';
  if (admin) {
    return NextResponse.json({ success: true, settings });
  }
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
    const settings = await writeSettings(incoming);
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('[settings] save failed', error);
    const message = errorMessage(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
