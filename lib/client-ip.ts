/** Extract real client IP from proxy headers (Edge + Node safe). */

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

  for (const raw of candidates) {
    const ip = String(raw || '').trim();
    if (ip) return ip.slice(0, 80);
  }

  return '';
}
