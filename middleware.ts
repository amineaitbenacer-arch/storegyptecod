import { NextResponse, type NextRequest } from 'next/server';
import { clientIpFromHeaders } from './lib/client-ip';
import {
  blockedSiteHtml,
  hasSiteBanCookie,
  isIpSiteBanned,
  siteBanCookieHeader,
} from './lib/ip-gate';

/** Admin / tooling — never lock the store owner out. */
function isExemptPath(pathname: string): boolean {
  if (pathname.startsWith('/admin')) return true;
  if (pathname === '/admin-dashboard.html') return true;
  if (pathname.startsWith('/_next/')) return true;
  if (pathname === '/favicon.ico') return true;
  if (pathname === '/robots.txt') return true;
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
  if (isExemptPath(pathname)) return NextResponse.next();

  if (hasSiteBanCookie(request.headers.get('cookie'))) {
    return deny();
  }

  const ip = clientIpFromHeaders(request.headers);
  if (ip && (await isIpSiteBanned(ip))) {
    return deny();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Everything except Next internals already handled in isExemptPath.
     * Still skip common static asset extensions for speed.
     */
    '/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map|woff2?)$).*)',
  ],
};
