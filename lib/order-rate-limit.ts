import { getSql, hasDatabase } from './db';
import {
  ORDER_ATTEMPT_MAX,
  ORDER_ATTEMPT_WINDOW_MS,
} from './anti-bot';

let schemaReady: Promise<void> | null = null;

async function ensureSchema() {
  const sql = getSql();
  if (!sql) return;
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS order_attempt_limits (
          ip text PRIMARY KEY,
          hits int NOT NULL DEFAULT 0,
          window_start timestamptz NOT NULL DEFAULT now()
        )
      `;
    })().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  await schemaReady;
}

export type AttemptLimitResult = {
  allowed: boolean;
  hits: number;
};

/**
 * Record a POST /api/orders attempt. Returns whether IP is still under the cap.
 * When over cap → caller should ban the IP.
 */
export async function recordOrderAttempt(ip: string): Promise<AttemptLimitResult> {
  const clean = String(ip || '').trim().slice(0, 80);
  if (!clean) return { allowed: true, hits: 0 };

  if (!hasDatabase()) {
    return { allowed: true, hits: 0 };
  }

  try {
    const sql = getSql();
    if (!sql) return { allowed: true, hits: 0 };
    await ensureSchema();

    const rows = (await sql`
      SELECT hits, window_start FROM order_attempt_limits WHERE ip = ${clean} LIMIT 1
    `) as { hits: number; window_start: string | Date }[];

    const now = Date.now();
    const row = rows[0];
    if (!row) {
      await sql`
        INSERT INTO order_attempt_limits (ip, hits, window_start)
        VALUES (${clean}, 1, now())
        ON CONFLICT (ip) DO UPDATE SET hits = 1, window_start = now()
      `;
      return { allowed: true, hits: 1 };
    }

    const startMs =
      typeof row.window_start === 'string'
        ? Date.parse(row.window_start)
        : row.window_start.getTime();

    if (!Number.isFinite(startMs) || now - startMs > ORDER_ATTEMPT_WINDOW_MS) {
      await sql`
        UPDATE order_attempt_limits
        SET hits = 1, window_start = now()
        WHERE ip = ${clean}
      `;
      return { allowed: true, hits: 1 };
    }

    const hits = Number(row.hits || 0) + 1;
    await sql`
      UPDATE order_attempt_limits SET hits = ${hits} WHERE ip = ${clean}
    `;
    return { allowed: hits <= ORDER_ATTEMPT_MAX, hits };
  } catch (error) {
    console.error('[rate] recordOrderAttempt failed', error);
    return { allowed: true, hits: 0 };
  }
}
