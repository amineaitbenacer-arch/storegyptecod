import { isIpBanned, isPhoneBanned, isVisitorBanned } from './bans-store';
import {
  findActiveOrderByPhoneProduct,
  isIpProductBlocked,
  listRecentOrdersForNearDup,
  recordAbuseAttempt,
  banIpProduct,
  countAbuseAttempts,
} from './orders-store';
import {
  ORDER_ALREADY_RECORDED,
  ORDER_ALREADY_RECORDED_MSG,
} from './order-messages';
import { normalizePhone } from './phone';

export { ORDER_ALREADY_RECORDED, ORDER_ALREADY_RECORDED_MSG };

const NEAR_DUP_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const ABUSE_WINDOW_MS = 48 * 60 * 60 * 1000;
const ABUSE_BAN_MS = 48 * 60 * 60 * 1000;
const ABUSE_THRESHOLD = 3;

export function phoneHammingDistance(a: string, b: string): number {
  const left = normalizePhone(a);
  const right = normalizePhone(b);
  if (left.length !== right.length) return Number.POSITIVE_INFINITY;
  let dist = 0;
  for (let i = 0; i < left.length; i++) {
    if (left[i] !== right[i]) dist++;
  }
  return dist;
}

export function isNearDuplicatePhone(a: string, b: string): boolean {
  const dist = phoneHammingDistance(a, b);
  return dist >= 1 && dist <= 2;
}

export type OrderGuardInput = {
  phone: string;
  productId: string;
  ip: string;
  visitorId: string;
};

export type OrderGuardResult =
  | { allow: true }
  | { allow: false; code: typeof ORDER_ALREADY_RECORDED };

export async function evaluateOrderGuard(
  input: OrderGuardInput
): Promise<OrderGuardResult> {
  const phone = normalizePhone(input.phone);
  const productId = String(input.productId || '').trim();
  const ip = String(input.ip || '').trim();
  const visitorId = String(input.visitorId || '').trim();

  if (!phone || !productId) {
    return { allow: true };
  }

  // Ban only this actor's checkout — never lock the whole site.
  if (await isPhoneBanned(phone)) {
    return { allow: false, code: ORDER_ALREADY_RECORDED };
  }

  if (visitorId && (await isVisitorBanned(visitorId))) {
    return { allow: false, code: ORDER_ALREADY_RECORDED };
  }

  if (ip && (await isIpBanned(ip))) {
    return { allow: false, code: ORDER_ALREADY_RECORDED };
  }

  if (ip && (await isIpProductBlocked(ip, productId))) {
    return { allow: false, code: ORDER_ALREADY_RECORDED };
  }

  try {
    const exact = await findActiveOrderByPhoneProduct(phone, productId);
    if (exact) {
      return { allow: false, code: ORDER_ALREADY_RECORDED };
    }
  } catch {
    // Lookup failed — still allow insert; unique DB index is the hard stop.
  }

  if (!ip && !visitorId) {
    return { allow: true };
  }

  const sinceIso = new Date(Date.now() - NEAR_DUP_WINDOW_MS).toISOString();
  const recent = await listRecentOrdersForNearDup(
    productId,
    sinceIso,
    ip,
    visitorId
  );

  const nearHit = recent.find((order) => isNearDuplicatePhone(phone, order.phone));

  if (nearHit) {
    if (ip) {
      await maybeEscalateIpBan(ip, productId, 'near_dup_phone');
    }
    return { allow: false, code: ORDER_ALREADY_RECORDED };
  }

  return { allow: true };
}

async function maybeEscalateIpBan(
  ip: string,
  productId: string,
  reason: string
): Promise<void> {
  await recordAbuseAttempt(ip, productId, reason);
  const sinceIso = new Date(Date.now() - ABUSE_WINDOW_MS).toISOString();
  const attempts = await countAbuseAttempts(ip, productId, sinceIso);
  if (attempts >= ABUSE_THRESHOLD) {
    const until = new Date(Date.now() + ABUSE_BAN_MS).toISOString();
    await banIpProduct(ip, productId, until, reason);
  }
}

export function clientIpFromHeaders(headers: Headers): string {
  const candidates = [
    headers.get('cf-connecting-ip'),
    headers.get('true-client-ip'),
    headers.get('x-real-ip'),
    headers.get('x-client-ip'),
    headers.get('x-vercel-forwarded-for')?.split(',')[0],
    headers.get('x-forwarded-for')?.split(',')[0],
    headers.get('fly-client-ip'),
  ];

  for (const raw of candidates) {
    const ip = String(raw || '').trim();
    if (ip && ip !== '::1' && ip !== '127.0.0.1') return ip.slice(0, 80);
  }

  // Last resort: allow localhost in dev so IP still gets stored for testing.
  for (const raw of candidates) {
    const ip = String(raw || '').trim();
    if (ip) return ip.slice(0, 80);
  }

  return '';
}
