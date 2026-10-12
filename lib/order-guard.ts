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

  if (ip && (await isIpProductBlocked(ip, productId))) {
    return { allow: false, code: ORDER_ALREADY_RECORDED };
  }

  const exact = await findActiveOrderByPhoneProduct(phone, productId);
  if (exact) {
    return { allow: false, code: ORDER_ALREADY_RECORDED };
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
  const cf = headers.get('cf-connecting-ip')?.trim();
  if (cf) return cf.slice(0, 80);

  const real = headers.get('x-real-ip')?.trim();
  if (real) return real.slice(0, 80);

  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first.slice(0, 80);
  }

  return '';
}
