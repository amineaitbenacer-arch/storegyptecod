import { isValidOrderPhone, normalizePhone } from './phone';

export { isValidOrderPhone, normalizePhone };

export async function submitOrderToApi(payload: Record<string, unknown>) {
  const phone = normalizePhone(String(payload.phone || ''));
  if (!isValidOrderPhone(phone)) {
    throw new Error('INVALID_PHONE');
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

  if (!res.ok || !data.success) {
    throw new Error(data.error || `ORDER_FAILED_${res.status}`);
  }

  return data as { success: true; orderId: string };
}
