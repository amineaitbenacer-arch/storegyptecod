import { NextResponse, type NextRequest } from 'next/server';
import { isBotUserAgent } from './lib/anti-bot';
import { SITE_BAN_COOKIE } from './lib/ban-seeds';
import { clientIpFromHeaders } from './lib/client-ip';
import {
  blockedSiteHtml,
  hasSiteBanCookie,
  isIpSiteBanned,
  siteBanCookieHeader,
} from './lib/ip-gate';

function clearSiteBanCookieHeader(): string {
  return `${SITE_BAN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax; Secure; HttpOnly`;
}

/** Admin + tooling — never lock the store owner out of the dashboard. */
function isAdminOrStaticPath(pathname: string): boolean {
  if (pathname.startsWith('/admin')) return true;
  if (pathname === '/admin-dashboard.html') return true;
  if (pathname.startsWith('/_next/')) return true;
  if (pathname === '/favicon.ico') return true;
  if (pathname === '/robots.txt') return true;
  return false;
}

/** Admin APIs must keep working even if the owner got a site-ban cookie while testing. */
function isAdminApiPath(pathname: string, method: string): boolean {
  if (pathname.startsWith('/api/analytics')) return true;
  if (pathname.startsWith('/api/settings')) return true;
  if (pathname.startsWith('/api/products')) return true;
  // Orders: GET/PUT/DELETE = admin dashboard. POST = store checkout (still guarded).
  if (pathname === '/api/orders' && method !== 'POST') return true;
  return false;
}

function deny(): NextResponse {
  return new NextResponse(blockedSiteHtml(), {
    status: 403,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Set-Cookie': siteBanCookieHeader(),
    },
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method.toUpperCase();

  if (isAdminOrStaticPath(pathname)) {
    // Opening admin clears an accidental self-ban cookie (from testing the shield).
    const res = NextResponse.next();
    if (pathname === '/admin-dashboard.html' || pathname.startsWith('/admin')) {
      res.headers.set('Set-Cookie', clearSiteBanCookieHeader());
    }
    return res;
  }
  if (isAdminApiPath(pathname, method)) return NextResponse.next();

  // Store pages: ban cookie / banned IP → blocked from browsing the shop.
  if (hasSiteBanCookie(request.headers.get('cookie'))) {
    return deny();
  }

  const ip = clientIpFromHeaders(request.headers);
  if (ip && (await isIpSiteBanned(ip))) {
    return deny();
  }

  // Checkout POST: kill bots + already-banned IPs before the route runs.
  if (pathname === '/api/orders' && method === 'POST') {
    if (isBotUserAgent(request.headers.get('user-agent'))) {
      return deny();
    }
    if (ip && (await isIpSiteBanned(ip))) {
      return deny();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map|woff2?)$).*)',
  ],
};
