'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initAdPixels, trackPixelPageView } from '../../lib/pixels';

/** Loads Meta / TikTok / Snapchat Pixel IDs from Admin and fires PAGE_VIEW on each route. */
export default function AdPixels() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname?.startsWith('/admin')) return;
    void initAdPixels();
  }, [pathname]);

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return;
    void initAdPixels().then(() => trackPixelPageView(pathname));
  }, [pathname]);

  return null;
}
