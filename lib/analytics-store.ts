import { getSql, hasDatabase } from './db';
import { isAdSource, sourceFromClick, type AdSource } from './tracking';

export type TrackType =
  | 'pageview'
  | 'lp'
  | 'product'
  | 'addtocart'
  | 'checkout'
  | 'purchase'
  | 'scroll25'
  | 'scroll50'
  | 'scroll75'
  | 'scroll100';

export type StoredEvent = {
  visitorId: string;
  type: TrackType;
  source: AdSource;
  path: string;
  productId: string;
  orderId?: string;
  ts: string;
  loadMs: number;
};

const TYPES = new Set<TrackType>([
  'pageview',
  'lp',
  'product',
  'addtocart',
  'checkout',
  'purchase',
  'scroll25',
  'scroll50',
  'scroll75',
  'scroll100',
]);

type EventRow = {
  visitor_id: string;
  type: string;
  source: string;
  path: string;
  product_id: string;
  order_id: string;
  ts: string | Date;
  load_ms: number;
};

function rowToEvent(row: EventRow): StoredEvent {
  return {
    visitorId: row.visitor_id,
    type: row.type as TrackType,
    source: row.source as AdSource,
    path: row.path,
    productId: row.product_id || '',
    orderId: row.order_id || undefined,
    ts: typeof row.ts === 'string' ? row.ts : new Date(row.ts).toISOString(),
    loadMs: Number(row.load_ms) || 0,
  };
}

export async function readEvents(): Promise<StoredEvent[]> {
  const sql = getSql();
  if (!sql || !hasDatabase()) return [];
  const rows = (await sql`
    SELECT visitor_id, type, source, path, product_id, order_id, ts, load_ms
    FROM analytics_events
    ORDER BY ts DESC
    LIMIT 25000
  `) as EventRow[];
  return rows.map(rowToEvent).reverse();
}

export async function appendEvent(event: StoredEvent) {
  const sql = getSql();
  if (!sql || !hasDatabase()) return;

  const ts = event.ts;
  const scrollType = String(event.type).startsWith('scroll');
  const purchaseType = event.type === 'purchase';
  const orderId = event.orderId || '';
  const productId = event.productId || '';

  if (purchaseType && orderId) {
    const existing = (await sql`
      SELECT id FROM analytics_events
      WHERE visitor_id = ${event.visitorId}
        AND type = ${event.type}
        AND order_id = ${orderId}
      LIMIT 1
    `) as { id: number }[];
    if (existing.length) return;
  } else if (purchaseType) {
    const existing = (await sql`
      SELECT id FROM analytics_events
      WHERE visitor_id = ${event.visitorId}
        AND type = ${event.type}
        AND ABS(EXTRACT(EPOCH FROM (ts - ${ts}::timestamptz))) < 8
      LIMIT 1
    `) as { id: number }[];
    if (existing.length) return;
  } else if (scrollType) {
    const existing = (await sql`
      SELECT id FROM analytics_events
      WHERE visitor_id = ${event.visitorId}
        AND type = ${event.type}
        AND path = ${event.path}
        AND product_id = ${productId}
      LIMIT 1
    `) as { id: number }[];
    if (existing.length) return;
  } else {
    const existing = (await sql`
      SELECT id FROM analytics_events
      WHERE visitor_id = ${event.visitorId}
        AND type = ${event.type}
        AND path = ${event.path}
        AND product_id = ${productId}
        AND ABS(EXTRACT(EPOCH FROM (ts - ${ts}::timestamptz))) < 4
      LIMIT 1
    `) as { id: number }[];
    if (existing.length) return;
  }

  await sql`
    INSERT INTO analytics_events (
      visitor_id, type, source, path, product_id, order_id, ts, load_ms
    ) VALUES (
      ${event.visitorId},
      ${event.type},
      ${event.source},
      ${event.path},
      ${productId},
      ${orderId},
      ${ts},
      ${event.loadMs || 0}
    )
  `;
}

export function normalizeIncoming(body: Record<string, unknown>): StoredEvent | null {
  const visitorId = String(body.visitorId || '');
  const type = String(body.type || '') as TrackType;
  const pathName = String(body.path || '/').slice(0, 180);
  const path = pathName.startsWith('/') ? pathName : `/${pathName}`;
  const fromPath = path.match(/^\/product\/([^/?#]+)/)?.[1] || '';
  const productId = String(body.productId || fromPath || '')
    .replace(/[^\w.-]/g, '')
    .slice(0, 80);
  const ts = String(body.ts || new Date().toISOString());
  const loadMs = Number(body.loadMs) || 0;
  const orderId = String(body.orderId || '')
    .replace(/[^\w.-]/g, '')
    .slice(0, 80);
  if (!/^[a-zA-Z0-9-]{8,80}$/.test(visitorId)) return null;
  if (!TYPES.has(type)) return null;
  if (Number.isNaN(Date.parse(ts))) return null;

  const fromClicks = sourceFromClick({
    fbclid: String(body.fbclid || '') || undefined,
    ttclid: String(body.ttclid || '') || undefined,
    sccid: String(body.sccid || '') || undefined,
    utm_source: String(body.utm_source || '') || undefined,
  });
  const bodySource = String(body.source || '');
  const source: AdSource =
    fromClicks !== 'direct'
      ? fromClicks
      : isAdSource(bodySource)
        ? bodySource
        : 'direct';

  return {
    visitorId,
    type,
    source,
    path,
    productId,
    orderId: orderId || undefined,
    ts: new Date(ts).toISOString(),
    loadMs: loadMs > 0 && loadMs < 120000 ? Math.round(loadMs) : 0,
  };
}
