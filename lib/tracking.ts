import {
  trackPixelAddToCart,
  trackPixelCheckout,
  trackPixelViewContent,
} from './pixels';
import { getProductPage } from './productPages';

/** Default price for a product (first/cheapest offer) — used so ViewContent always has a value. */
function catalogValue(productId: string): { value?: number; name?: string } {
  try {
    const page = productId ? getProductPage(productId) : undefined;
    const offer = page?.offers?.[0];
    if (!page || !offer) return {};
    return { value: Number(offer.price) || undefined, name: page.heroTitle };
  } catch {
    return {};
  }
}

export const AD_SOURCES = ['meta', 'tiktok', 'snapchat', 'direct'] as const;
export type AdSource = (typeof AD_SOURCES)[number];

/** Last-click paid attribution window (Meta default click window). */
export const ATTRIBUTION_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

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

function lsRemove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
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

export type ClickIds = {
  fbclid?: string;
  ttclid?: string;
  sccid?: string;
  utm_source?: string;
  at?: number;
};

const PLACEHOLDER_CLICK_IDS = new Set([
  'fbclid',
  'ttclid',
  'sccid',
  'sc_click_id',
  'scclid',
  'null',
  'undefined',
  'nil',
  '(not set)',
  '{{fbclid}}',
  '{{ttclid}}',
  '{fbclid}',
  '{ttclid}',
]);

function normalizeUtm(value: unknown) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

/** Drop template junk like fbclid=fbclid that was poisoning Meta vs TikTok. */
export function cleanClickId(value: unknown): string | undefined {
  const raw = String(value || '').trim();
  if (!raw) return undefined;
  const lower = raw.toLowerCase();
  if (PLACEHOLDER_CLICK_IDS.has(lower)) return undefined;
  if (lower.startsWith('{{') || lower.startsWith('%7b')) return undefined;
  // Real ad click IDs are long opaque tokens.
  if (raw.length < 12) return undefined;
  return raw.slice(0, 240);
}

function isMetaUtm(utm: string) {
  return (
    utm === 'facebook' ||
    utm === 'meta' ||
    utm === 'fb' ||
    utm === 'ig' ||
    utm === 'instagram' ||
    utm.startsWith('facebook') ||
    utm.startsWith('instagram') ||
    utm.startsWith('meta_') ||
    utm.startsWith('fb_') ||
    utm.startsWith('ig_')
  );
}

function isTikTokUtm(utm: string) {
  return utm === 'tt' || utm === 'tiktok' || utm.startsWith('tiktok') || utm.startsWith('tt_');
}

function isSnapUtm(utm: string) {
  return utm === 'snap' || utm === 'snapchat' || utm.startsWith('snapchat') || utm.startsWith('snap_');
}

function hasClickSignal(click: ClickIds) {
  return Boolean(click.fbclid || click.ttclid || click.sccid || click.utm_source);
}

function sanitizeClickIds(click: ClickIds): ClickIds {
  return {
    fbclid: cleanClickId(click.fbclid),
    ttclid: cleanClickId(click.ttclid),
    sccid: cleanClickId(click.sccid),
    utm_source: click.utm_source ? String(click.utm_source).trim().slice(0, 80) : undefined,
    at: click.at,
  };
}

export function sourceFromClick(click: ClickIds): AdSource {
  const clean = sanitizeClickIds(click);
  const utm = normalizeUtm(clean.utm_source);
  const hasFb = Boolean(clean.fbclid);
  const hasTt = Boolean(clean.ttclid);
  const hasSc = Boolean(clean.sccid);

  // Prefer platform where UTM and click-id agree (fixes fake fbclid + real ttclid).
  if (isTikTokUtm(utm) && hasTt) return 'tiktok';
  if (isMetaUtm(utm) && hasFb) return 'meta';
  if (isSnapUtm(utm) && hasSc) return 'snapchat';

  const idCount = [hasFb, hasTt, hasSc].filter(Boolean).length;
  if (idCount === 1) {
    if (hasTt) return 'tiktok';
    if (hasFb) return 'meta';
    if (hasSc) return 'snapchat';
  }
  if (idCount > 1) {
    if (isTikTokUtm(utm)) return 'tiktok';
    if (isMetaUtm(utm)) return 'meta';
    if (isSnapUtm(utm)) return 'snapchat';
    // Ambiguous dual IDs: TikTok token shape is distinctive; otherwise Meta.
    if (hasTt && String(clean.ttclid).startsWith('E_C_P_')) return 'tiktok';
    if (hasFb) return 'meta';
    if (hasTt) return 'tiktok';
    if (hasSc) return 'snapchat';
  }

  if (isMetaUtm(utm)) return 'meta';
  if (isTikTokUtm(utm)) return 'tiktok';
  if (isSnapUtm(utm)) return 'snapchat';
  return 'direct';
}

export function isAdSource(value: unknown): value is AdSource {
  return AD_SOURCES.includes(String(value) as AdSource);
}

export function isPaidAdSource(value: unknown): value is Exclude<AdSource, 'direct'> {
  return value === 'meta' || value === 'tiktok' || value === 'snapchat';
}

function parseClickAt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;
  if (typeof value === 'string' && value.trim()) {
    const asNum = Number(value);
    if (Number.isFinite(asNum) && asNum > 0) return asNum;
    const asDate = Date.parse(value);
    if (!Number.isNaN(asDate)) return asDate;
  }
  return null;
}

export function isClickFresh(clickAt: unknown, now = Date.now()): boolean {
  const at = parseClickAt(clickAt);
  if (at == null) return false;
  const age = now - at;
  return age >= 0 && age <= ATTRIBUTION_WINDOW_MS;
}

/**
 * Server + client: last-click paid source inside the attribution window.
 * Never trust a paid `bodySource` without click-id / ad-UTM proof.
 * If `clickAt` is present and older than the window → Direct (strip stale IDs).
 * If `clickAt` is missing (legacy clients) → still trust click-id / ad-UTM proof.
 */
export function resolveAttributedSource(input: {
  fbclid?: unknown;
  ttclid?: unknown;
  sccid?: unknown;
  utm_source?: unknown;
  clickAt?: unknown;
  bodySource?: unknown;
  now?: number;
}): {
  source: AdSource;
  fbclid: string;
  ttclid: string;
  sccid: string;
  utm_source: string;
  clickAt: number | null;
} {
  const now = input.now ?? Date.now();
  const fbclid = cleanClickId(input.fbclid) || '';
  const ttclid = cleanClickId(input.ttclid) || '';
  const sccid = cleanClickId(input.sccid) || '';
  const utm_source = String(input.utm_source || '').trim().slice(0, 80);
  const clickAt = parseClickAt(input.clickAt);
  const click: ClickIds = {
    fbclid: fbclid || undefined,
    ttclid: ttclid || undefined,
    sccid: sccid || undefined,
    utm_source: utm_source || undefined,
  };
  const fromClick = sourceFromClick(click);
  const hasProof = Boolean(fbclid || ttclid || sccid || (utm_source && fromClick !== 'direct'));
  const stale = clickAt != null && !isClickFresh(clickAt, now);

  if (stale) {
    return {
      source: 'direct',
      fbclid: '',
      ttclid: '',
      sccid: '',
      utm_source: '',
      clickAt: null,
    };
  }

  if (isPaidAdSource(fromClick) && hasProof) {
    // Keep only the winning platform proof — never store cross-channel junk.
    return {
      source: fromClick,
      fbclid: fromClick === 'meta' ? fbclid : '',
      ttclid: fromClick === 'tiktok' ? ttclid : '',
      sccid: fromClick === 'snapchat' ? sccid : '',
      utm_source,
      clickAt,
    };
  }

  // Non-ad UTM only (whatsapp, google, …) — report Direct, keep UTM.
  if (utm_source && fromClick === 'direct') {
    return { source: 'direct', fbclid: '', ttclid: '', sccid: '', utm_source, clickAt };
  }

  // Paid label without proof is ignored (old sticky localStorage bug).
  void input.bodySource;
  return {
    source: 'direct',
    fbclid: '',
    ttclid: '',
    sccid: '',
    utm_source: '',
    clickAt: null,
  };
}

/** Meta first-party cookie `_fbc` = fb.1.<ts>.<fbclid> — use when URL lost fbclid. */
function readMetaFbcClickId(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  try {
    const match = document.cookie.match(/(?:^|;\s*)_fbc=([^;]+)/);
    if (!match?.[1]) return undefined;
    const value = decodeURIComponent(match[1]);
    const parts = value.split('.');
    if (parts.length < 4 || parts[0] !== 'fb') return undefined;
    return cleanClickId(parts.slice(3).join('.'));
  } catch {
    return undefined;
  }
}

function clearStoredAttribution() {
  lsRemove(CLICK_KEY);
  lsSet(SRC_KEY, 'direct');
}

function narrowClickToSource(click: ClickIds, source: AdSource): ClickIds {
  const at = click.at && click.at > 0 ? click.at : Date.now();
  if (source === 'meta') {
    return {
      fbclid: click.fbclid,
      utm_source: click.utm_source || 'fb',
      at,
    };
  }
  if (source === 'tiktok') {
    return {
      ttclid: click.ttclid,
      utm_source: click.utm_source || 'tiktok',
      at,
    };
  }
  if (source === 'snapchat') {
    return {
      sccid: click.sccid,
      utm_source: click.utm_source || 'snapchat',
      at,
    };
  }
  return { utm_source: click.utm_source, at };
}

function writeStoredAttribution(click: ClickIds, source: AdSource) {
  const payload = narrowClickToSource(sanitizeClickIds(click), source);
  lsSet(CLICK_KEY, JSON.stringify(payload));
  lsSet(SRC_KEY, source);
  return source;
}

function readClicks(): ClickIds {
  if (typeof window === 'undefined') return {};
  try {
    const parsed = JSON.parse(lsGet(CLICK_KEY) || '{}') as ClickIds;
    if (!parsed || typeof parsed !== 'object') return {};
    return sanitizeClickIds(parsed);
  } catch {
    return {};
  }
}

function readFreshStoredClicks(now = Date.now()): ClickIds | null {
  const stored = readClicks();
  if (!hasClickSignal(stored)) {
    // Wipe poisoned placeholders like fbclid:"fbclid" left by old clients.
    if (lsGet(CLICK_KEY)) clearStoredAttribution();
    return null;
  }
  // Legacy rows had no `at` — stamp once so the 7-day window starts (ends infinite sticky).
  if (stored.at == null || !Number.isFinite(stored.at)) {
    const source = sourceFromClick(stored);
    if (!isPaidAdSource(source) && !stored.utm_source) {
      clearStoredAttribution();
      return null;
    }
    writeStoredAttribution({ ...stored, at: now }, isPaidAdSource(source) ? source : 'direct');
    return { ...stored, at: now };
  }
  if (!isClickFresh(stored.at, now)) {
    clearStoredAttribution();
    return null;
  }
  return stored;
}

export function captureVisitSource(): AdSource {
  if (typeof window === 'undefined') return 'direct';
  try {
    const now = Date.now();
    const params = new URLSearchParams(window.location.search);
    const incoming: ClickIds = sanitizeClickIds({
      fbclid: params.get('fbclid') || undefined,
      ttclid: params.get('ttclid') || undefined,
      sccid: params.get('ScCid') || params.get('sccid') || params.get('sc_click_id') || undefined,
      utm_source: params.get('utm_source') || undefined,
      at: now,
    });
    // URL/ad params only — a leftover Meta `_fbc` cookie alone is not a new last-touch.
    const hasIncoming = hasClickSignal(incoming);

    if (hasIncoming) {
      let detected = sourceFromClick(incoming);
      // Fill fbclid from `_fbc` only when this hit is already Meta (never on TikTok URLs).
      if (detected === 'meta' && !incoming.fbclid) {
        const fromFbc = readMetaFbcClickId();
        if (fromFbc) incoming.fbclid = fromFbc;
      }
      if (isPaidAdSource(detected)) {
        // Last-touch: new paid click always wins; store only that platform's proof.
        return writeStoredAttribution(incoming, detected);
      }
      // Non-ad UTM (whatsapp, google, …) overrides previous paid sticky tag.
      clearStoredAttribution();
      lsSet(
        CLICK_KEY,
        JSON.stringify({
          utm_source: incoming.utm_source,
          at: now,
        } satisfies ClickIds)
      );
      lsSet(SRC_KEY, 'direct');
      return 'direct';
    }

    // No URL params: keep last paid click only inside the window (Direct does not wipe it).
    const fresh = readFreshStoredClicks(now);
    if (fresh) {
      const source = sourceFromClick(fresh);
      if (isPaidAdSource(source)) {
        lsSet(SRC_KEY, source);
        return source;
      }
    }

    const storedSrc = lsGet(SRC_KEY);
    if (storedSrc === 'direct') return 'direct';
    clearStoredAttribution();
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
  const now = Date.now();
  const click = readFreshStoredClicks(now) || {};
  const resolved = resolveAttributedSource({
    fbclid: click.fbclid,
    ttclid: click.ttclid,
    sccid: click.sccid,
    utm_source: click.utm_source,
    clickAt: click.at,
    now,
  });
  return {
    source: resolved.source,
    productId: currentProductId(),
    visitorId: typeof window !== 'undefined' ? visitorId() : '',
    fbclid: resolved.fbclid,
    ttclid: resolved.ttclid,
    sccid: resolved.sccid,
    utm_source: resolved.utm_source,
    clickAt: resolved.clickAt ?? '',
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
    const fields = trackingFields();
    const id = fields.visitorId || visitorId();
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
      source: fields.source,
      path,
      productId,
      orderId: orderKey,
      loadMs,
      ts: new Date().toISOString(),
      fbclid: fields.fbclid || '',
      ttclid: fields.ttclid || '',
      sccid: fields.sccid || '',
      utm_source: fields.utm_source || '',
      clickAt: fields.clickAt || '',
    });

    const critical = type === 'purchase' || type === 'checkout' || type === 'addtocart';
    sendBody(body, critical);

    // Ad pixels (Meta / TikTok / Snap) — same moment as internal analytics
    try {
      const contentId = productId || undefined;
      const fallback = opts?.value == null || !opts?.contentName ? catalogValue(productId) : {};
      const commerce = {
        content_id: contentId,
        content_ids: contentId ? [contentId] : undefined,
        content_name: opts?.contentName ?? fallback.name,
        currency: 'SAR',
        value: opts?.value ?? fallback.value,
        num_items: opts?.numItems ?? 1,
      };
      if (type === 'product') {
        trackPixelViewContent(commerce);
      } else if (type === 'addtocart') {
        trackPixelAddToCart(commerce);
      } else if (type === 'checkout') {
        trackPixelCheckout(commerce);
      }
    } catch {
      /* ignore pixel errors */
    }
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
