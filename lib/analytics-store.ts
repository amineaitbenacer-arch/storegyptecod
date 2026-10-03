import { promises as fs } from 'fs';
import path from 'path';
import { isAdSource, sourceFromClick, type AdSource } from './tracking';

const FILE = path.join(process.cwd(), 'analytics.json');
const TMP = path.join(process.cwd(), 'analytics.json.tmp');

export type TrackType =
  | 'pageview'
  | 'lp'
  | 'product'
  | 'addtocart'
  | 'checkout'
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
  ts: string;
  loadMs: number;
};

const TYPES = new Set<TrackType>([
  'pageview',
  'lp',
  'product',
  'addtocart',
  'checkout',
  'scroll25',
  'scroll50',
  'scroll75',
  'scroll100',
]);

let writeChain: Promise<unknown> = Promise.resolve();

export async function readEvents(): Promise<StoredEvent[]> {
  try {
    const raw = await fs.readFile(FILE, 'utf-8');
    const data = JSON.parse(raw) as { events?: StoredEvent[] };
    return Array.isArray(data.events) ? data.events : [];
  } catch {
    return [];
  }
}

async function writeEvents(events: StoredEvent[]) {
  const payload = JSON.stringify({ events }, null, 2);
  await fs.writeFile(TMP, payload, 'utf-8');
  await fs.rename(TMP, FILE);
}

export function appendEvent(event: StoredEvent) {
  writeChain = writeChain
    .then(async () => {
      const events = await readEvents();
      const ts = Date.parse(event.ts);
      const scrollType = String(event.type).startsWith('scroll');
      const duplicate = events.some(
        (item) =>
          item.visitorId === event.visitorId &&
          item.type === event.type &&
          item.path === event.path &&
          String(item.productId || '') === String(event.productId || '') &&
          (scrollType || Math.abs(Date.parse(item.ts) - ts) < 4000),
      );
      if (duplicate) return;
      events.push(event);
      const trimmed = events.length > 25000 ? events.slice(-25000) : events;
      await writeEvents(trimmed);
    })
    .catch(async () => {
      try {
        const events = await readEvents();
        events.push(event);
        await writeEvents(events.slice(-25000));
      } catch {
        /* last resort swallow */
      }
    });
  return writeChain;
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
    ts: new Date(ts).toISOString(),
    loadMs: loadMs > 0 && loadMs < 120000 ? Math.round(loadMs) : 0,
  };
}
