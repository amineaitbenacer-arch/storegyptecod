/** Shared client/server helpers so orders always reach Neon. */

export function normalizePhone(phone: string): string {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('212') && digits.length >= 12) {
    digits = `0${digits.slice(3)}`;
  }
  if (digits.length > 10) digits = digits.slice(-10);
  return digits;
}

export function isValidOrderPhone(phone: string): boolean {
  return /^\d{10}$/.test(normalizePhone(phone));
}

export async function submitOrderToApi(payload: Record<string, unknown>) {
  const phone = normalizePhone(String(payload.phone || ''));
  if (!isValidOrderPhone(phone)) {
    throw new Error('INVALID_PHONE');
  }

  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, phone }),
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
