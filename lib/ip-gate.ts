import { neon } from '@neondatabase/serverless';
import { SEED_IP_BANS, SITE_BAN_COOKIE } from './ban-seeds';

const CACHE_TTL_MS = 30_000;
const ipCache = new Map<string, { banned: boolean; at: number }>();

function envBannedIps(): string[] {
  return (process.env.BANNED_IPS || '')
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function databaseUrl(): string {
  const raw = (process.env.DATABASE_URL || process.env.POSTGRES_URL || '').trim();
  if (!raw) return '';
  try {
    const url = new URL(raw.replace(/^"|"$/g, ''));
    url.searchParams.delete('channel_binding');
    if (!url.searchParams.has('sslmode')) url.searchParams.set('sslmode', 'require');
    return url.toString();
  } catch {
    return raw.replace(/^"|"$/g, '');
  }
}

/** Sync: seed + env only (no DB). */
export function isIpBannedSync(ip: string): boolean {
  const clean = String(ip || '').trim();
  if (!clean) return false;
  if (SEED_IP_BANS.some((b) => b.ip === clean)) return true;
  return envBannedIps().includes(clean);
}

export function hasSiteBanCookie(cookieHeader: string | null): boolean {
  if (!cookieHeader) return false;
  return cookieHeader.split(';').some((part) => {
    const [k, v] = part.trim().split('=');
    return k === SITE_BAN_COOKIE && v === '1';
  });
}

export function siteBanCookieHeader(): string {
  return `${SITE_BAN_COOKIE}=1; Path=/; Max-Age=31536000; SameSite=Lax; Secure; HttpOnly`;
}

/** Edge-safe: seed + env + short-lived Neon lookup. */
export async function isIpSiteBanned(ip: string): Promise<boolean> {
  const clean = String(ip || '').trim();
  if (!clean) return false;
  if (isIpBannedSync(clean)) return true;

  const cached = ipCache.get(clean);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.banned;

  const url = databaseUrl();
  if (!url) {
    ipCache.set(clean, { banned: false, at: Date.now() });
    return false;
  }

  try {
    const sql = neon(url, { fetchOptions: { cache: 'no-store' } });
    const rows = (await sql`
      SELECT 1 AS ok FROM ip_bans WHERE ip = ${clean} LIMIT 1
    `) as { ok: number }[];
    const banned = rows.length > 0;
    ipCache.set(clean, { banned, at: Date.now() });
    return banned;
  } catch {
    // Fail open for DB blips — seed/env still protect known abusers.
    return false;
  }
}

export function blockedSiteHtml(): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>غير متاح</title>
<style>
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0b0f;color:#e8e8ef;
font-family:system-ui,sans-serif}
main{text-align:center;padding:2rem}
h1{font-size:1.25rem;margin:0 0 .5rem}
p{opacity:.65;margin:0;font-size:.95rem}
</style>
</head>
<body><main><h1>غير متاح</h1><p>لا يمكن الوصول إلى هذا الموقع.</p></main></body>
</html>`;
}
