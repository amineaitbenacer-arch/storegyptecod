import {
  ORDER_ALREADY_RECORDED,
  ORDER_ALREADY_RECORDED_MSG,
} from './order-messages';
import { isValidOrderPhone, normalizePhone } from './phone';

export { isValidOrderPhone, normalizePhone };
export { ORDER_ALREADY_RECORDED, ORDER_ALREADY_RECORDED_MSG };

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

export async function submitOrderToApi(payload: Record<string, unknown>) {
  const phone = normalizePhone(String(payload.phone || ''));
  if (!isValidOrderPhone(phone)) {
    throw new OrderSubmitError('INVALID_PHONE');
  }

  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      phone,
      timestamp: payload.timestamp || new Date().toISOString(),
    }),
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

  if (!res.ok || !data.success) {
    throw new OrderSubmitError(data.error || `ORDER_FAILED_${res.status}`);
  }

  return data as { success: true; orderId: string };
}
