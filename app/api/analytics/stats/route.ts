import { NextResponse } from 'next/server';
import { readEvents } from '../../../../lib/analytics-store';

export async function GET() {
  try {
    const events = await readEvents();
    return NextResponse.json({ success: true, events });
  } catch {
    return NextResponse.json({ error: 'Failed to read analytics' }, { status: 500 });
  }
}
