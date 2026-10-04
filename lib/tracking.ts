export const AD_SOURCES = ['meta', 'tiktok', 'snapchat', 'direct'] as const;
export type AdSource = (typeof AD_SOURCES)[number];

export type StoreEventType =
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

const VID_KEY = 'sg_vid';
const SRC_KEY = 'sg_src';
const CLICK_KEY = 'sg_click';
const PID_KEY = 'sg_pid';
const QUEUE_KEY = 'sg_track_q';

export function productIdFromPath(path: string) {
  const match = String(path || '').match(/^\/product\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]).slice(0, 80) : '';
}

function lsGet(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function lsSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode / quota */
  }
}

export function currentProductId() {
  if (typeof window === 'undefined') return '';
  const fromPath = productIdFromPath(window.location.pathname);
  if (fromPath) {
    lsSet(PID_KEY, fromPath);
    return fromPath;
  }
  return lsGet(PID_KEY) || '';
}

type ClickIds = {
  fbclid?: string;
  ttclid?: string;
  sccid?: string;
  utm_source?: string;
};

function readClicks(): ClickIds {
  if (typeof window === 'undefined') return {};
  try {
    const parsed = JSON.parse(lsGet(CLICK_KEY) || '{}') as ClickIds;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function sourceFromClick(click: ClickIds): AdSource {
  const utm = String(click.utm_source || '').toLowerCase();
  if (click.fbclid || ['facebook', 'meta', 'fb', 'ig', 'instagram'].includes(utm)) return 'meta';
  if (click.ttclid || utm === 'tiktok' || utm === 'tt') return 'tiktok';
  if (click.sccid || utm === 'snapchat' || utm === 'snap') return 'snapchat';
  return 'direct';
}

export function isAdSource(value: unknown): value is AdSource {
  return AD_SOURCES.includes(String(value) as AdSource);
}

export function captureVisitSource(): AdSource {
  if (typeof window === 'undefined') return 'direct';
  try {
    const params = new URLSearchParams(window.location.search);
    const incoming: ClickIds = {
      fbclid: params.get('fbclid') || undefined,
      ttclid: params.get('ttclid') || undefined,
      sccid: params.get('ScCid') || params.get('sccid') || params.get('sc_click_id') || undefined,
      utm_source: params.get('utm_source') || undefined,
    };
    const detected = Object.values(incoming).some(Boolean) ? sourceFromClick(incoming) : null;
    if (detected === 'meta' || detected === 'tiktok' || detected === 'snapchat') {
      lsSet(CLICK_KEY, JSON.stringify(incoming));
      lsSet(SRC_KEY, detected);
      return detected;
    }
    const stored = lsGet(SRC_KEY);
    if (isAdSource(stored)) return stored;
    lsSet(SRC_KEY, 'direct');
    return 'direct';
  } catch {
    return 'direct';
  }
}

function visitorId() {
  let id = lsGet(VID_KEY);
  if (!id) {
    try {
      id = crypto.randomUUID();
    } catch {
      id = `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    }
    lsSet(VID_KEY, id);
  }
  return id;
}

export function getVisitorId() {
  if (typeof window === 'undefined') return '';
  return visitorId();
}

export function trackingFields() {
  if (typeof window !== 'undefined') captureVisitSource();
  const click = readClicks();
  return {
    source: captureVisitSource(),
    productId: currentProductId(),
    visitorId: typeof window !== 'undefined' ? visitorId() : '',
    fbclid: click.fbclid || '',
    ttclid: click.ttclid || '',
    sccid: click.sccid || '',
    utm_source: click.utm_source || '',
  };
}

const recent = new Set<string>();

function readQueue(): string[] {
  try {
    const raw = sessionStorage.getItem(QUEUE_KEY);
    const list = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(list) ? list.slice(-40) : [];
  } catch {
    return [];
  }
}

function writeQueue(list: string[]) {
  try {
    sessionStorage.setItem(QUEUE_KEY, JSON.stringify(list.slice(-40)));
  } catch {
    /* ignore */
  }
}

function enqueue(body: string) {
  const list = readQueue();
  list.push(body);
  writeQueue(list);
}

function sendBody(body: string, critical = false) {
  let beaconOk = false;
  if (!critical) {
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        beaconOk = navigator.sendBeacon(
          '/api/analytics',
          new Blob([body], { type: 'application/json' })
        );
      }
    } catch {
      beaconOk = false;
    }
    if (beaconOk) return;
  }

  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  })
    .then((res) => {
      if (!res.ok) enqueue(body);
    })
    .catch(() => enqueue(body));
}

export function flushTrackingQueue() {
  if (typeof window === 'undefined') return;
  const list = readQueue();
  if (!list.length) return;
  writeQueue([]);
  list.forEach((body) => sendBody(body));
}

export function trackStoreEvent(
  type: StoreEventType,
  opts?: {
    productId?: string;
    value?: number;
    contentName?: string;
    orderId?: string | number;
    numItems?: number;
  }
) {
  if (typeof window === 'undefined') return;
  try {
    const source = captureVisitSource();
    const click = readClicks();
    const id = visitorId();
    const path = window.location.pathname || '/';
    if (path.startsWith('/admin')) return;
    if (opts?.productId) lsSet(PID_KEY, opts.productId.slice(0, 80));
    const productId = opts?.productId || currentProductId();
    const orderKey = opts?.orderId != null ? String(opts.orderId) : '';
    const key =
      type === 'purchase'
        ? `${id}|purchase|${orderKey || productId || path}`
        : `${id}|${type}|${path}|${productId}`;
    if (recent.has(key)) return;
    recent.add(key);
    if (!type.startsWith('scroll')) {
      window.setTimeout(() => recent.delete(key), type === 'purchase' ? 15000 : 2500);
    }

    let loadMs = 0;
    if (type === 'pageview') {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      if (nav) {
        const end = nav.loadEventEnd > 0 ? nav.loadEventEnd : nav.domContentLoadedEventEnd;
        if (end > 0) loadMs = Math.round(end);
      }
    }

    const body = JSON.stringify({
      visitorId: id,
      type,
      source,
      path,
      productId,
      orderId: orderKey,
      loadMs,
      ts: new Date().toISOString(),
      fbclid: click.fbclid || '',
      ttclid: click.ttclid || '',
      sccid: click.sccid || '',
      utm_source: click.utm_source || '',
    });

    const critical = type === 'purchase' || type === 'checkout' || type === 'addtocart';
    sendBody(body, critical);
  } catch {
    /* never break the store */
  }
}

function productScrollPct() {
  const doc = document.documentElement;
  const body = document.body;
  const height = Math.max(doc.scrollHeight, body ? body.scrollHeight : 0);
  const scrollable = height - window.innerHeight;
  if (scrollable <= 24) return 100;
  const y = window.scrollY || doc.scrollTop || 0;
  return Math.min(100, Math.max(0, Math.round((y / scrollable) * 100)));
}

/** Tracks how far a visitor scrolled the product page: 25 / 50 / 75 / 100. */
export function startProductScrollTracking() {
  if (typeof window === 'undefined') return () => {};
  let maxPct = 0;
  const fired = new Set<number>();
  let ticking = false;

  const mark = (pct: number, type: StoreEventType) => {
    if (fired.has(pct)) return;
    fired.add(pct);
    trackStoreEvent(type);
  };

  const check = () => {
    ticking = false;
    try {
      const pct = productScrollPct();
      if (pct > maxPct) maxPct = pct;
      if (maxPct >= 25) mark(25, 'scroll25');
      if (maxPct >= 50) mark(50, 'scroll50');
      if (maxPct >= 75) mark(75, 'scroll75');
      if (maxPct >= 95) mark(100, 'scroll100');
    } catch {
      /* ignore */
    }
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(check);
  };

  check();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      check();
      flushTrackingQueue();
    }
  });
  window.addEventListener('pagehide', flushTrackingQueue);
  const timer = window.setInterval(check, 1000);

  return () => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    window.removeEventListener('pagehide', flushTrackingQueue);
    window.clearInterval(timer);
    check();
    flushTrackingQueue();
  };
}
