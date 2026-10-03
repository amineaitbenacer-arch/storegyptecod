export type LastOrderPayload = Record<string, unknown>;

const LS_KEYS = ['ac_last_order', 'lastOrder'] as const;
const SS_KEY = 'sg_last_order';

export function saveLastOrder(data: LastOrderPayload) {
  const json = JSON.stringify(data);
  try {
    for (const key of LS_KEYS) localStorage.setItem(key, json);
  } catch {
    /* private mode */
  }
  try {
    sessionStorage.setItem(SS_KEY, json);
  } catch {
    /* private mode */
  }
}

export function readLastOrder(): LastOrderPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const fromSs = sessionStorage.getItem(SS_KEY);
    if (fromSs) return JSON.parse(fromSs) as LastOrderPayload;
  } catch {
    /* ignore */
  }
  for (const key of LS_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as LastOrderPayload;
    } catch {
      /* ignore */
    }
  }
  return null;
}

export function thankYouHref(orderId: string) {
  const id = encodeURIComponent(String(orderId || '').slice(0, 80));
  return id ? `/thankyou?oid=${id}` : '/thankyou';
}
