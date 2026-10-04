import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

let cached: NeonQueryFunction<false, false> | null | undefined;

function cleanDatabaseUrl(raw: string) {
  try {
    const url = new URL(raw);
    // channel_binding can break some Node / serverless runtimes
    url.searchParams.delete('channel_binding');
    if (!url.searchParams.has('sslmode')) url.searchParams.set('sslmode', 'require');
    return url.toString();
  } catch {
    return raw
      .replace(/([?&])channel_binding=[^&]*&?/i, '$1')
      .replace(/[?&]$/, '');
  }
}

export function getDatabaseUrl() {
  const raw = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
  if (!raw) return '';
  return cleanDatabaseUrl(raw.trim().replace(/^"|"$/g, ''));
}

export function hasDatabase() {
  return Boolean(getDatabaseUrl());
}

export function getSql() {
  const url = getDatabaseUrl();
  if (!url) return null;
  if (cached === undefined) {
    cached = neon(url, { fetchOptions: { cache: 'no-store' } });
  }
  return cached;
}
