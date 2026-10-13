import { NextResponse, type NextRequest } from 'next/server';
import { isBotUserAgent } from './lib/anti-bot';
import { SITE_BAN_COOKIE } from './lib/ban-seeds';
import { clientIpFromHeaders } from './lib/client-ip';
import { isIpSiteBanned } from './lib/ip-gate';

/**
 * Site pages stay public.
 * Abuse hard-stop is on checkout POST only (IP ban + bot UA).
 * Full-page "غير متاح" was locking the owner after testing the shield.
 */

function clearSiteBanCookieHeader(): string {
  return `${SITE_BAN_COOKIE}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure; HttpOnly`;
}

function isAdminPath(pathname: string): boolean {
  return pathname.startsWith('/admin') || pathname === '/admin-dashboard.html';
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method.toUpperCase();

  // Visiting admin clears any accidental self-ban cookie.
  if (isAdminPath(pathname)) {
    const res = NextResponse.next();
    res.headers.append('Set-Cookie', clearSiteBanCookieHeader());
    return res;
  }

  // Only gate store checkout — never the whole shop.
  if (pathname === '/api/orders' && method === 'POST') {
    if (isBotUserAgent(request.headers.get('user-agent'))) {
      return NextResponse.json(
        { success: false, error: 'BLOCKED' },
        { status: 403 }
      );
    }
    const ip = clientIpFromHeaders(request.headers);
    if (ip && (await isIpSiteBanned(ip))) {
      return NextResponse.json(
        { success: false, error: 'BLOCKED' },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map|woff2?)$).*)',
  ],
};
