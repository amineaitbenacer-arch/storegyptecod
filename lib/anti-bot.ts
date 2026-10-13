/**
 * Anti-bot / fake-order shield for COD checkout.
 * Layered checks — none alone is perfect; together they stop most bots & kids.
 */

export const HONEYPOT_FIELD = 'website';
export const JS_TOKEN_FIELD = 'js_token';
export const JS_TOKEN_VALUE = 'dm1';
export const FORM_STARTED_FIELD = 'formStartedAt';

/** Humans need a few seconds to type name + phone + city. */
const MIN_FILL_MS = 2_500;
/** Instant API hits (<800ms) = almost always a bot → hard ban. */
const INSTANT_BOT_MS = 800;

/** Max order POST attempts (incl. fails) per IP per window before site ban. */
export const ORDER_ATTEMPT_WINDOW_MS = 10 * 60 * 1000;
export const ORDER_ATTEMPT_MAX = 6;

const BOT_UA_RE =
  /bot|crawl|spider|slurp|scrapy|curl|wget|python-requests|httpclient|go-http|java\/|libwww|phantom|headless|selenium|puppeteer|playwright|axios\/|postman|insomnia|httpie|node-fetch|okhttp/i;

export type AntiBotVerdict =
  | { ok: true }
  | { ok: false; ban: boolean; reason: string };

export function isBotUserAgent(ua: string | null | undefined): boolean {
  const s = String(ua || '').trim();
  if (!s) return true; // empty UA on order POST is suspicious
  return BOT_UA_RE.test(s);
}

export function looksLikeFakeProfile(name: string, city: string): boolean {
  const n = String(name || '').trim();
  const c = String(city || '').trim();

  if (/https?:\/\//i.test(n) || /https?:\/\//i.test(c)) return true;
  if (/[<>{}]/.test(n) || /[<>{}]/.test(c)) return true;
  if (/\d{6,}/.test(n)) return true;
  // aaa / ١١١
  if (n.length >= 3 && /^(.)\1{2,}$/u.test(n)) return true;
  if (c.length >= 5 && /^(.)\1{4,}$/u.test(c)) return true;
  // Latin gibberish city with no vowels
  if (/^[a-z]{10,}$/i.test(c) && !/[aeiouy]/i.test(c)) return true;
  // Keyboard row spam
  if (/qwerty|asdfgh|zxcvbn|123456|abcdef/i.test(n + c)) return true;

  return false;
}

export function evaluateAntiBot(input: {
  body: Record<string, unknown>;
  userAgent: string | null;
  secFetchSite: string | null;
  now?: number;
}): AntiBotVerdict {
  const now = input.now ?? Date.now();
  const body = input.body || {};

  // 1) Honeypot — bots auto-fill "website"
  const honey = String(body[HONEYPOT_FIELD] ?? body._hp ?? '').trim();
  if (honey) {
    return { ok: false, ban: true, reason: 'honeypot_filled' };
  }

  // 2) Must come from our JS client
  if (String(body[JS_TOKEN_FIELD] || '') !== JS_TOKEN_VALUE) {
    return { ok: false, ban: true, reason: 'missing_js_token' };
  }

  // 3) User-Agent
  if (isBotUserAgent(input.userAgent)) {
    return { ok: false, ban: true, reason: 'bot_user_agent' };
  }

  // 4) Browser fetch metadata (browsers send this; raw scripts often don't)
  const site = String(input.secFetchSite || '').toLowerCase();
  if (site && site !== 'same-origin' && site !== 'same-site' && site !== 'none') {
    // cross-site POST to /api/orders → block+ban
    if (site === 'cross-site') {
      return { ok: false, ban: true, reason: 'cross_site_post' };
    }
  }

  // 5) Fill time
  const started = Number(body[FORM_STARTED_FIELD] || 0);
  if (!Number.isFinite(started) || started <= 0) {
    return { ok: false, ban: true, reason: 'missing_form_timer' };
  }
  const elapsed = now - started;
  if (elapsed < 0 || elapsed > 24 * 60 * 60 * 1000) {
    return { ok: false, ban: true, reason: 'bad_form_timer' };
  }
  if (elapsed < INSTANT_BOT_MS) {
    return { ok: false, ban: true, reason: 'instant_submit' };
  }
  if (elapsed < MIN_FILL_MS) {
    // Soft reject — human can retry in a second; don't ban yet
    return { ok: false, ban: false, reason: 'too_fast' };
  }

  // 6) Fake name/city
  const name = String(body.name || '');
  const city = String(body.city || body.address || '');
  if (looksLikeFakeProfile(name, city)) {
    return { ok: false, ban: true, reason: 'fake_profile' };
  }

  return { ok: true };
}

/** Client-side fields attached to every order POST. */
let checkoutOpenedAt = 0;

export function markCheckoutReady(): void {
  if (typeof window === 'undefined') return;
  if (!checkoutOpenedAt) checkoutOpenedAt = Date.now();
  try {
    sessionStorage.setItem('dm_co_at', String(checkoutOpenedAt));
  } catch {
    /* private mode */
  }
}

export function antiBotClientFields(): Record<string, string | number> {
  let started = checkoutOpenedAt;
  if (!started && typeof window !== 'undefined') {
    try {
      started = Number(sessionStorage.getItem('dm_co_at') || 0);
    } catch {
      started = 0;
    }
  }
  if (!started) {
    // Page never called markCheckoutReady — still give humans ~3s head start
    started = Date.now() - 3_500;
    checkoutOpenedAt = started;
  }
  return {
    [HONEYPOT_FIELD]: '',
    [JS_TOKEN_FIELD]: JS_TOKEN_VALUE,
    [FORM_STARTED_FIELD]: started,
  };
}
