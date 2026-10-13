import { antiBotClientFields } from './anti-bot';
import {
  ORDER_ALREADY_RECORDED,
  ORDER_ALREADY_RECORDED_MSG,
} from './order-messages';
import {
  isValidOrderPhone,
  normalizePhone,
  shouldBanIpForBadPhone,
} from './phone';

export { isValidOrderPhone, normalizePhone };
export { ORDER_ALREADY_RECORDED, ORDER_ALREADY_RECORDED_MSG };
export { markCheckoutReady } from './anti-bot';

export class OrderSubmitError extends Error {
  code: string;

  constructor(code: string) {
    super(code);
    this.name = 'OrderSubmitError';
    this.code = code;
  }
}

export function isOrderAlreadyRecordedError(error: unknown): boolean {
  if (error instanceof OrderSubmitError) {
    return error.code === ORDER_ALREADY_RECORDED;
  }
  return error instanceof Error && error.message === ORDER_ALREADY_RECORDED;
}

/**
 * ONLY client entry to create orders. Always attaches anti-bot fields.
 * Used by ProductView, store cart, shells, landings — and any future checkout.
 */
export async function submitOrderToApi(payload: Record<string, unknown>) {
  const phone = normalizePhone(String(payload.phone || ''));
  // antiBotClientFields() LAST so callers cannot overwrite honeypot / js_token / timer.
  const shielded = {
    ...payload,
    phone,
    timestamp: payload.timestamp || new Date().toISOString(),
    ...antiBotClientFields(),
  };

  if (!isValidOrderPhone(phone)) {
    // Still hit API so server can ban IP when they only typed ≤2 digits after 05.
    if (shouldBanIpForBadPhone(phone)) {
      try {
        await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(shielded),
        });
      } catch {
        /* ban attempt best-effort */
      }
    }
    throw new OrderSubmitError('INVALID_PHONE');
  }

  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(shielded),
  });

  let data: { success?: boolean; orderId?: string; error?: string } = {};
  try {
    data = (await res.json()) as typeof data;
  } catch {
    /* non-json */
  }

  if (data.error === ORDER_ALREADY_RECORDED || res.status === 409) {
    throw new OrderSubmitError(ORDER_ALREADY_RECORDED);
  }

  if (data.error === 'TOO_FAST') {
    throw new OrderSubmitError('TOO_FAST');
  }

  if (!res.ok || !data.success) {
    throw new OrderSubmitError(data.error || `ORDER_FAILED_${res.status}`);
  }

  return data as { success: true; orderId: string };
}
