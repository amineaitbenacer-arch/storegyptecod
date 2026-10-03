import { NextRequest, NextResponse } from 'next/server';
import { appendEvent, normalizeIncoming } from '../../../lib/analytics-store';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const event = normalizeIncoming(body);
    if (!event) return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
    if (event.path.startsWith('/admin')) return NextResponse.json({ success: true, ignored: true });
    await appendEvent(event);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to save event' }, { status: 500 });
  }
}
