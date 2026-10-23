/**
 * Admin Pixel IDs → live site (Meta / TikTok / Snapchat).
 * Save in /admin → events fire automatically: PageView, ViewContent, AddToCart, Checkout, Purchase.
 */

import { splitStoredPixelIds } from './pixel-ids';
import { readLastOrder } from './last-order';

type PixelIds = {
  fb: string[];
  tiktok: string[];
  snap: string[];
};

export type CommercePayload = {
  value?: number;
  currency?: string;
  content_ids?: string[];
  content_id?: string;
  content_name?: string;
  content_type?: string;
  num_items?: number;
  transaction_id?: string;
  customer?: {
    phone?: string;
    name?: string;
    city?: string;
    email?: string;
  };
};

type QueuedEvent =
  | { kind: 'pageview' }
  | { kind: 'view'; payload: CommercePayload }
  | { kind: 'cart'; payload: CommercePayload }
  | { kind: 'checkout'; payload: CommercePayload }
  | { kind: 'purchase'; payload: CommercePayload };

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
    ttq?: {
      load: (id: string, opts?: Record<string, unknown>) => void;
      page: () => void;
      track: (name: string, payload?: Record<string, unknown>) => void;
      identify?: (data: Record<string, unknown>) => void;
    };
    snaptr?: ((...args: unknown[]) => void) & {
      handleRequest?: (...args: unknown[]) => void;
      queue?: unknown[];
    };
    __sgPixelsReady?: boolean;
    __sgPixelsBooted?: boolean;
    TiktokAnalyticsObject?: string;
  }
}

let ready = false;
let loading: Promise<void> | null = null;
const queue: QueuedEvent[] = [];
let lastPagePath = '';

function money(value?: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function injectScript(src: string) {
  if (document.querySelector(`script[src="${src}"]`)) return;
  const t = document.createElement('script');
  t.async = true;
  t.src = src;
  const s = document.getElementsByTagName('script')[0];
  s?.parentNode?.insertBefore(t, s);
}

function ensureMeta() {
  if (typeof window.fbq === 'function') return;
  const fbq = function (...args: unknown[]) {
    const fn = fbq as typeof fbq & {
      callMethod?: (...a: unknown[]) => void;
      queue: unknown[];
      loaded?: boolean;
      version?: string;
      push: (...a: unknown[]) => void;
    };
    if (fn.callMethod) fn.callMethod(...args);
    else fn.queue.push(args);
  } as ((...args: unknown[]) => void) & {
    callMethod?: (...a: unknown[]) => void;
    queue: unknown[];
    loaded?: boolean;
    version?: string;
    push: (...a: unknown[]) => void;
  };
  fbq.queue = [];
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.push = fbq;
  window.fbq = fbq;
  if (!window._fbq) window._fbq = fbq;
  injectScript('https://connect.facebook.net/en_US/fbevents.js');
}

function ensureTikTok(pixelIds: string[]) {
  const ids = pixelIds.filter(Boolean);
  if (!ids.length) return;
  const w = window as Window & { __sgTtLoaded?: string };
  const signature = ids.join(',');
  if (w.ttq?.track && (w.__sgPixelsBooted || w.__sgTtLoaded === signature)) return;
  w.TiktokAnalyticsObject = 'ttq';
  const ttq = (w.ttq || []) as unknown as {
    methods: string[];
    setAndDefer: (target: object, name: string) => void;
    load: (id: string, opts?: Record<string, unknown>) => void;
    page: () => void;
    track: (name: string, payload?: Record<string, unknown>) => void;
    instance: (id: string) => unknown;
    _i: Record<string, { _u?: string } & unknown[]>;
    _t: Record<string, number>;
    _o: Record<string, unknown>;
    push: (item: unknown) => void;
  };
  ttq.methods = [
    'page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready',
    'alias', 'group', 'enableCookie', 'disableCookie', 'holdConsent', 'revokeConsent', 'grantConsent',
  ];
  ttq.setAndDefer = (target, name) => {
    (target as Record<string, unknown>)[name] = (...args: unknown[]) => {
      (target as { push: (item: unknown) => void }).push([name, ...args]);
    };
  };
  ttq.methods.forEach((name) => ttq.setAndDefer(ttq, name));
  ttq.instance = (id: string) => {
    const inst = ttq._i[id] || [];
    ttq.methods.forEach((name) => ttq.setAndDefer(inst as object, name));
    return inst;
  };
  ttq.load = (id: string, opts?: Record<string, unknown>) => {
    const src = 'https://analytics.tiktok.com/i18n/pixel/events.js';
    ttq._i = ttq._i || {};
    ttq._i[id] = [];
    ttq._i[id]._u = src;
    ttq._t = ttq._t || {};
    ttq._t[id] = Date.now();
    ttq._o = ttq._o || {};
    ttq._o[id] = opts || {};
    injectScript(`${src}?sdkid=${encodeURIComponent(id)}&lib=ttq`);
  };
  w.ttq = ttq as unknown as Window['ttq'];
  ids.forEach((id) => w.ttq?.load(id));
  w.__sgTtLoaded = signature;
}

function ensureSnap() {
  if (window.snaptr) return;
  const snaptr = function (...args: unknown[]) {
    const fn = snaptr as typeof snaptr & { handleRequest?: (...a: unknown[]) => void; queue: unknown[] };
    if (fn.handleRequest) fn.handleRequest(...args);
    else fn.queue.push(args);
  } as ((...args: unknown[]) => void) & { handleRequest?: (...args: unknown[]) => void; queue: unknown[] };
  snaptr.queue = [];
  window.snaptr = snaptr;
  injectScript('https://sc-static.net/scevent.min.js');
}

let cachedPixelIds: PixelIds | null = null;

async function fetchPixelIds(): Promise<PixelIds> {
  if (cachedPixelIds) return cachedPixelIds;
  const empty: PixelIds = { fb: [], tiktok: [], snap: [] };
  try {
    const res = await fetch('/api/settings');
    const data = await res.json();
    if (!data?.success || !data.settings) return empty;
    const s = data.settings;
    cachedPixelIds = {
      fb: splitStoredPixelIds(String(s.fb_pixel_1 || ''), String(s.fb_pixel_2 || '')),
      tiktok: splitStoredPixelIds(String(s.tiktok_pixel || '')),
      snap: splitStoredPixelIds(String(s.snapchat_pixel || ''), String(s.snapchat_pixel_2 || '')),
    };
    return cachedPixelIds;
  } catch {
    return empty;
  }
}

function flushQueue() {
  while (queue.length) {
    const ev = queue.shift();
    if (ev) dispatch(ev);
  }
}

function dispatch(ev: QueuedEvent) {
  if (!ready && typeof window !== 'undefined' && window.__sgPixelsBooted) markBootedReady();
  if (!ready) {
    queue.push(ev);
    void initAdPixels();
    return;
  }
  try {
    if (ev.kind === 'pageview') {
      window.fbq?.('track', 'PageView');
      window.ttq?.page?.();
      window.snaptr?.('track', 'PAGE_VIEW');
      return;
    }

    const p = ev.payload;
    const value = money(p.value);
    const currency = p.currency || 'SAR';
    const contentIds = p.content_ids || (p.content_id ? [p.content_id] : undefined);

    const metaBase: Record<string, unknown> = {
      currency,
      content_type: p.content_type || 'product',
    };
    if (value != null) metaBase.value = value;
    if (contentIds) {
      metaBase.content_ids = contentIds;
      metaBase.contents = contentIds.map((id) => ({ id, quantity: p.num_items || 1 }));
    }
    if (p.content_name) metaBase.content_name = p.content_name;
    if (p.num_items != null) metaBase.num_items = p.num_items;

    const snapBase: Record<string, unknown> = { currency };
    if (value != null) snapBase.price = value;
    if (contentIds) snapBase.item_ids = contentIds;
    if (p.transaction_id) snapBase.transaction_id = p.transaction_id;
    if (p.num_items != null) snapBase.number_items = p.num_items;

    const ttBase: Record<string, unknown> = { currency, content_type: 'product' };
    if (value != null) ttBase.value = value;
    if (contentIds) {
      ttBase.content_id = contentIds[0];
      ttBase.contents = contentIds.map((id) => ({ content_id: id, content_type: 'product' }));
    }
    if (p.content_name) ttBase.content_name = p.content_name;
    if (p.num_items != null) ttBase.quantity = p.num_items;

    if (ev.kind === 'view') {
      window.fbq?.('track', 'ViewContent', metaBase);
      window.ttq?.track?.('ViewContent', ttBase);
      window.snaptr?.('track', 'VIEW_CONTENT', snapBase);
      return;
    }
    if (ev.kind === 'cart') {
      window.fbq?.('track', 'AddToCart', metaBase);
      window.ttq?.track?.('AddToCart', ttBase);
      window.snaptr?.('track', 'ADD_CART', snapBase);
      return;
    }
    if (ev.kind === 'checkout') {
      window.fbq?.('track', 'InitiateCheckout', metaBase);
      window.ttq?.track?.('InitiateCheckout', ttBase);
      window.snaptr?.('track', 'START_CHECKOUT', snapBase);
      return;
    }
    if (ev.kind === 'purchase') {
      const eventId = p.transaction_id ? { eventID: `order_${p.transaction_id}` } : undefined;
      if (eventId) window.fbq?.('track', 'Purchase', metaBase, eventId);
      else window.fbq?.('track', 'Purchase', metaBase);
      window.ttq?.track?.('CompletePayment', {
        ...ttBase,
        ...(p.transaction_id ? { order_id: p.transaction_id } : {}),
      });
      window.snaptr?.('track', 'PURCHASE', snapBase);
    }
  } catch {
    /* never break store */
  }
}

function markBootedReady() {
  ready = true;
  window.__sgPixelsReady = true;
  flushQueue();
}

export function initAdPixels(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (ready) return Promise.resolve();
  if (window.__sgPixelsBooted) {
    markBootedReady();
    return Promise.resolve();
  }
  if (loading) return loading;

  loading = (async () => {
    const ids = await fetchPixelIds();
    if (ids.fb.length) {
      ensureMeta();
      const metaData = buildMetaAdvancedMatching();
      ids.fb.forEach((id) => {
        if (Object.keys(metaData).length) window.fbq?.('init', id, metaData);
        else window.fbq?.('init', id);
      });
    }
    if (ids.tiktok.length) ensureTikTok(ids.tiktok);
    if (ids.snap.length) {
      ensureSnap();
      ids.snap.forEach((id) => window.snaptr?.('init', id));
    }
    ready = true;
    window.__sgPixelsReady = true;
    flushQueue();
  })()
    .catch(() => {
      ready = true;
      window.__sgPixelsReady = true;
      flushQueue();
    })
    .then(() => undefined);

  return loading;
}

export function trackPixelPageView(path?: string) {
  const p = path || (typeof window !== 'undefined' ? window.location.pathname : '');
  if (p.startsWith('/admin')) return;
  if (p && p === lastPagePath) return;
  // Thank-you must always show PageView in Pixel Helper after hydration.
  if (p.startsWith('/thankyou')) {
    lastPagePath = p;
    dispatch({ kind: 'pageview' });
    return;
  }
  // The HTML snippet already sent the first PageView.
  if (!lastPagePath && typeof window !== 'undefined' && window.__sgPixelsBooted) {
    lastPagePath = p;
    return;
  }
  lastPagePath = p;
  dispatch({ kind: 'pageview' });
}

export function trackPixelViewContent(payload: CommercePayload = {}) {
  dispatch({ kind: 'view', payload });
}

export function trackPixelAddToCart(payload: CommercePayload = {}) {
  dispatch({ kind: 'cart', payload });
}

export function trackPixelCheckout(payload: CommercePayload = {}) {
  dispatch({ kind: 'checkout', payload });
}

export function trackPixelPurchase(payload: CommercePayload = {}) {
  dispatch({ kind: 'purchase', payload });
}

export function trackPixelPurchaseWhenReady(payload: CommercePayload, attempts = 15) {
  const run = (left: number) => {
    if (ready || (typeof window !== 'undefined' && window.__sgPixelsReady) || left <= 0) {
      trackPixelPurchase(payload);
      return;
    }
    window.setTimeout(() => run(left - 1), 350);
  };
  void initAdPixels().then(() => run(attempts));
}

let thankYouPurchaseId = '';
const PURCHASE_PIXEL_KEY = 'sg_ty_purchase_';

function alreadyFiredThankYouPurchase(id: string) {
  if (thankYouPurchaseId === id) return true;
  try {
    return window.sessionStorage.getItem(PURCHASE_PIXEL_KEY + id) === '1';
  } catch {
    return false;
  }
}

function markThankYouPurchaseFired(id: string) {
  thankYouPurchaseId = id;
  try {
    window.sessionStorage.setItem(PURCHASE_PIXEL_KEY + id, '1');
  } catch {
    /* private mode */
  }
}

/** Normalize phone number for Meta Advanced Matching (E.164 without plus sign). */
export function cleanAdvancedMatchingPhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  let digits = String(phone).replace(/\D/g, '');
  if (!digits) return undefined;
  // Egyptian mobile numbers (010, 011, 012, 015) 11 digits starting with 01
  if (digits.startsWith('01') && digits.length === 11) {
    digits = '2' + digits; // 201...
  } else if (digits.startsWith('05') && digits.length === 10) {
    // Saudi mobile numbers (05xxxxxxxx) 10 digits starting with 05
    digits = '966' + digits.slice(1); // 9665...
  }
  return digits.length >= 8 ? digits : undefined;
}

type AdvancedMatchingCustomer = {
  phone?: string;
  name?: string;
  city?: string;
  email?: string;
  orderId?: string;
};

function buildMetaAdvancedMatching(customer?: AdvancedMatchingCustomer): Record<string, string> {
  const last = (typeof readLastOrder === 'function' ? readLastOrder() : null) || {};
  const rawPhone = customer?.phone ?? String(last.phone || '');
  const rawName = customer?.name ?? String(last.name || '');
  const rawCity = customer?.city ?? String(last.city || '');
  const rawEmail = customer?.email ?? String(last.email || '');
  const rawOrderId = customer?.orderId ?? String(last.orderId || last.serverOrderId || '');

  const ph = cleanAdvancedMatchingPhone(rawPhone);
  const em = rawEmail.trim().toLowerCase().includes('@') ? rawEmail.trim().toLowerCase() : undefined;
  const nameParts = rawName.trim().split(/\s+/).filter(Boolean);
  const fn = nameParts[0]?.toLowerCase();
  const ln = nameParts.length > 1 ? nameParts.slice(1).join(' ').toLowerCase() : undefined;
  const ct = rawCity.trim().toLowerCase() || undefined;
  const external_id = rawOrderId ? String(rawOrderId).replace(/^#/, '').trim() : undefined;

  const metaData: Record<string, string> = {};
  if (ph) metaData.ph = ph;
  if (em) metaData.em = em;
  if (fn) metaData.fn = fn;
  if (ln) metaData.ln = ln;
  if (ct) metaData.ct = ct;
  if (external_id && external_id !== '----') metaData.external_id = external_id;
  return metaData;
}

/**
 * Meta Manual Advanced Matching (fbq('init', id, { ph, fn, ln, ct, em, external_id }))
 * + TikTok identify + Snapchat advanced matching.
 */
export function syncPixelAdvancedMatching(customer?: {
  phone?: string;
  name?: string;
  city?: string;
  email?: string;
  orderId?: string;
}) {
  if (typeof window === 'undefined') return;
  const metaData = buildMetaAdvancedMatching(customer);

  if (Object.keys(metaData).length === 0) return;

  void fetchPixelIds().then((ids) => {
    // 1. Meta Pixel Manual Advanced Matching
    if (typeof window.fbq === 'function') {
      ids.fb.forEach((id) => {
        window.fbq?.('init', id, metaData);
      });
    }
    // 2. TikTok Identify
    if (window.ttq?.identify && (metaData.ph || metaData.em || metaData.external_id)) {
      window.ttq.identify({
        ...(metaData.ph ? { phone_number: metaData.ph } : {}),
        ...(metaData.em ? { email: metaData.em } : {}),
        ...(metaData.external_id ? { external_id: metaData.external_id } : {}),
      });
    }
    // 3. Snapchat Advanced Matching
    if (window.snaptr && metaData.ph) {
      ids.snap.forEach((id) => {
        window.snaptr?.('init', id, { user_phone_number: metaData.ph });
      });
    }
  });
}

/** PageView + Purchase on the confirmation page, after the pixel helper can see them. */
export function trackThankYouPixels(payload: CommercePayload, attempt = 0) {
  if (typeof window === 'undefined') return;
  void initAdPixels().then(() => {
    const pixelReady =
      typeof window.fbq === 'function' ||
      typeof window.ttq?.track === 'function' ||
      typeof window.snaptr === 'function' ||
      !window.__sgPixelsBooted;
    if (!pixelReady && attempt < 20) {
      window.setTimeout(() => trackThankYouPixels(payload, attempt + 1), 250);
      return;
    }
    const id = String(payload.transaction_id || '').replace(/^#/, '');
    if (!id || id === '----') {
      window.fbq?.('track', 'PageView');
      window.ttq?.page?.();
      window.snaptr?.('track', 'PAGE_VIEW');
      return;
    }
    if (alreadyFiredThankYouPurchase(id)) return;
    markThankYouPurchaseFired(id);

    // Apply Meta Manual Advanced Matching with customer data
    syncPixelAdvancedMatching({
      orderId: id,
      phone: payload.customer?.phone,
      name: payload.customer?.name,
      city: payload.customer?.city,
      email: payload.customer?.email,
    });

    window.fbq?.('track', 'PageView');
    window.ttq?.page?.();
    window.snaptr?.('track', 'PAGE_VIEW');
    trackPixelPurchase({ ...payload, transaction_id: id });
  });
}
