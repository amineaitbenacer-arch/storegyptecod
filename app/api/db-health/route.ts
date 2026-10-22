import { NextResponse } from 'next/server';
import { getSql, hasDatabase } from '../../../lib/db';

/** Lets the admin dashboard show a clear banner when Neon is down / over quota. */
export async function GET() {
  const headers = { 'Cache-Control': 'no-store' };
  if (!hasDatabase()) {
    return NextResponse.json({ ok: false, reason: 'NO_DATABASE_URL' }, { headers });
  }
  try {
    const sql = getSql();
    await sql!`SELECT 1`;
    return NextResponse.json({ ok: true }, { headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const quota = /quota|402/i.test(message);
    return NextResponse.json(
      { ok: false, reason: quota ? 'QUOTA_EXCEEDED' : 'DB_ERROR', message: message.slice(0, 300) },
      { headers }
    );
  }
}
