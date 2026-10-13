import {
  banActor,
  banIp,
  isIpBanned,
  isPhoneBanned,
  isVisitorBanned,
} from './bans-store';
import { clientIpFromHeaders } from './client-ip';
import {
  findActiveOrderByPhoneProduct,
  isIpProductBlocked,
  listRecentOrdersForNearDup,
  recordAbuseAttempt,
  banIpProduct,
  countAbuseAttempts,
  countRecentOrdersByIp,
} from './orders-store';
import {
  ORDER_ALREADY_RECORDED,
  ORDER_ALREADY_RECORDED_MSG,
} from './order-messages';
import { isSpamPhonePattern, normalizePhone } from './phone';

export { ORDER_ALREADY_RECORDED, ORDER_ALREADY_RECORDED_MSG };
export { clientIpFromHeaders };

const NEAR_DUP_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const ABUSE_WINDOW_MS = 48 * 60 * 60 * 1000;
const ABUSE_BAN_MS = 48 * 60 * 60 * 1000;
/** First abuse strike → permanent IP ban (max). */
const ABUSE_THRESHOLD = 1;
/** Burst orders from same IP in 1h → site ban. */
const IP_BURST_WINDOW_MS = 60 * 60 * 1000;
const IP_BURST_MAX = 4;

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
  name?: string;
  city?: string;
};

export type OrderGuardResult =
  | { allow: true }
  | { allow: false; code: typeof ORDER_ALREADY_RECORDED; siteBan?: boolean };

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

  // Fake pattern (0512121212…) → wipe actor from the site.
  if (isSpamPhonePattern(phone)) {
    await banActor({
      ip,
      visitorId,
      phone,
      reason: `auto: spam phone pattern ${phone}`,
    });
    return { allow: false, code: ORDER_ALREADY_RECORDED, siteBan: true };
  }

  if (await isPhoneBanned(phone)) {
    await banActor({
      ip,
      visitorId,
      phone,
      reason: `auto: banned phone ${phone}`,
    });
    return { allow: false, code: ORDER_ALREADY_RECORDED, siteBan: true };
  }

  if (visitorId && (await isVisitorBanned(visitorId))) {
    await banActor({
      ip,
      visitorId,
      phone,
      reason: `auto: banned visitor ${visitorId}`,
    });
    return { allow: false, code: ORDER_ALREADY_RECORDED, siteBan: true };
  }

  if (ip && (await isIpBanned(ip))) {
    return { allow: false, code: ORDER_ALREADY_RECORDED, siteBan: true };
  }

  if (ip && (await isIpProductBlocked(ip, productId))) {
    await banIp(ip, `auto: escalate ip-product block ${productId}`);
    return { allow: false, code: ORDER_ALREADY_RECORDED, siteBan: true };
  }

  // Burst spam from one IP.
  if (ip) {
    try {
      const sinceIso = new Date(Date.now() - IP_BURST_WINDOW_MS).toISOString();
      const burst = await countRecentOrdersByIp(ip, sinceIso);
      if (burst >= IP_BURST_MAX) {
        await banActor({
          ip,
          visitorId,
          phone,
          reason: `auto: ip burst ${burst} orders/1h`,
        });
        return { allow: false, code: ORDER_ALREADY_RECORDED, siteBan: true };
      }
    } catch {
      /* ignore burst lookup failures */
    }
  }

  try {
    const exact = await findActiveOrderByPhoneProduct(phone, productId);
    if (exact) {
      // Soft block only — real customers sometimes double-tap submit.
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
    await banActor({
      ip,
      visitorId,
      phone,
      reason: `auto: near_dup_phone vs ${nearHit.phone}`,
    });
    await maybeEscalateIpBan(ip, productId, 'near_dup_phone');
    return { allow: false, code: ORDER_ALREADY_RECORDED, siteBan: true };
  }

  return { allow: true };
}

async function maybeEscalateIpBan(
  ip: string,
  productId: string,
  reason: string
): Promise<void> {
  if (!ip) return;
  await recordAbuseAttempt(ip, productId, reason);
  const sinceIso = new Date(Date.now() - ABUSE_WINDOW_MS).toISOString();
  const attempts = await countAbuseAttempts(ip, productId, sinceIso);
  if (attempts >= ABUSE_THRESHOLD) {
    const until = new Date(Date.now() + ABUSE_BAN_MS).toISOString();
    await banIpProduct(ip, productId, until, reason);
    await banIp(ip, `auto: abuse threshold ${reason}`);
  }
}
