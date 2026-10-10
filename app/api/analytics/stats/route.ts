import { NextResponse } from 'next/server';
import { readEvents } from '../../../../lib/analytics-store';

const NO_STORE = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  Pragma: 'no-cache',
};

export async function GET() {
  try {
    const events = await readEvents();
    return NextResponse.json({ success: true, events }, { headers: NO_STORE });
  } catch {
    return NextResponse.json(
      { error: 'Failed to read analytics' },
      { status: 500, headers: NO_STORE }
    );
  }
}
