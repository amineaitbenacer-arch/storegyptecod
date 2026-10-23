import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export const ADMIN_SESSION_COOKIE = 'dune_admin_session';
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8;

function getSessionSecret(): string {
  return String(process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || '').trim();
}

export function isAdminPasswordConfigured(): boolean {
  return Boolean(String(process.env.ADMIN_PASSWORD || '').trim() && getSessionSecret());
}

function sign(expiresAt: number): string {
  return createHmac('sha256', getSessionSecret()).update(String(expiresAt)).digest('base64url');
}

export function verifyAdminPassword(password: unknown): boolean {
  const configured = String(process.env.ADMIN_PASSWORD || '').trim();
  const incoming = String(password || '').trim();
  if (!configured || !incoming) return false;
  const expected = Buffer.from(configured);
  const actual = Buffer.from(incoming);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function createAdminSessionToken(now = Date.now()): string {
  const expiresAt = Math.floor(now / 1000) + ADMIN_SESSION_MAX_AGE;
  return `${expiresAt}.${sign(expiresAt)}`;
}

export function verifyAdminSessionToken(token: string | undefined, now = Date.now()): boolean {
  if (!token || !isAdminPasswordConfigured()) return false;
  const [expiresText, signature] = token.split('.');
  const expiresAt = Number(expiresText);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(now / 1000) || !signature) return false;
  const expected = Buffer.from(sign(expiresAt));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function hasAdminSession(): Promise<boolean> {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminSessionToken(token);
}

export function adminSessionCookie(token: string) {
  return {
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ADMIN_SESSION_MAX_AGE,
  };
}

export function clearAdminSessionCookie() {
  return {
    ...adminSessionCookie(''),
    maxAge: 0,
    expires: new Date(0),
  };
}
