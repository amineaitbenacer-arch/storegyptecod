import { splitStoredPixelIds } from './pixel-ids';
import type { StoreSettings } from './settings-store';

/** Official browser pixels, written into the page HTML from the saved IDs. */
export function pixelBootScript(settings: StoreSettings): string {
  const fb = splitStoredPixelIds(settings.fb_pixel_1, settings.fb_pixel_2);
  const snap = splitStoredPixelIds(settings.snapchat_pixel, settings.snapchat_pixel_2);
  const tiktok = splitStoredPixelIds(settings.tiktok_pixel);
  if (!fb.length && !tiktok.length && !snap.length) return '';

  const lines: string[] = ['window.__sgPixelsBooted=true;'];

  if (fb.length) {
    lines.push(
      `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');`
    );
    for (const id of fb) lines.push(`fbq('init',${JSON.stringify(id)});`);
    lines.push(`fbq('track','PageView');`);
  }

  if (tiktok.length) {
    lines.push(
      `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)}}(window,document,'ttq');`
    );
    for (const id of tiktok) lines.push(`ttq.load(${JSON.stringify(id)});`);
    lines.push(`ttq.page();`);
  }

  if (snap.length) {
    lines.push(
      `(function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};a.queue=[];var s='https://sc-static.net/scevent.min.js';var r=t.createElement('script');r.async=!0;r.src=s;var u=t.getElementsByTagName('script')[0];u.parentNode.insertBefore(r,u);})(window,document);`
    );
    for (const id of snap) lines.push(`snaptr('init',${JSON.stringify(id)},{});`);
    lines.push(`snaptr('track','PAGE_VIEW');`);
  }

  return lines.join('\n');
}
