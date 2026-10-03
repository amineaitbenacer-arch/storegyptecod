'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { flushTrackingQueue, startProductScrollTracking, trackStoreEvent } from '../../lib/tracking';

export default function TrackVisit() {
  const pathname = usePathname();

  useEffect(() => {
    flushTrackingQueue();
    const onHide = () => flushTrackingQueue();
    window.addEventListener('pagehide', onHide);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flushTrackingQueue();
    });
    return () => {
      window.removeEventListener('pagehide', onHide);
    };
  }, []);

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return;
    trackStoreEvent('pageview');
    if (pathname === '/') trackStoreEvent('lp');
    if (pathname.startsWith('/product')) trackStoreEvent('product');
    flushTrackingQueue();
  }, [pathname]);

  useEffect(() => {
    if (!pathname || !pathname.startsWith('/product')) return;
    return startProductScrollTracking();
  }, [pathname]);

  return null;
}
