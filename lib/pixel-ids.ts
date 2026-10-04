const INVISIBLE = /[\u200B-\u200D\uFEFF\u00A0]/g;

const PLACEHOLDERS = new Set([
  '1234567890',
  '0987654321',
  'cxxxxxx',
  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
]);

const NOISE = new Set([
  'page', 'track', 'identify', 'instances', 'debug', 'ready', 'alias', 'group',
  'enablecookie', 'disablecookie', 'holdconsent', 'revokeconsent', 'grantconsent',
  'pageview', 'viewcontent', 'addtocart', 'initiatecheckout', 'completepayment',
  'purchase', 'function', 'script', 'window', 'document', 'https', 'analytics',
  'events', 'pixel', 'false', 'true', 'async', 'const', 'return', 'queue',
  'methods', 'fbq', 'ttq', 'snaptr', 'init', 'load', 'sdkid', 'content',
  'product', 'currency', 'example', 'optional', 'facebook', 'instagram',
  'tiktok', 'snapchat',
]);

export type PixelKind = 'meta' | 'tiktok' | 'snap';

function unique(ids: string[]) {
  const out: string[] = [];
  for (const id of ids) {
    if (id && !out.includes(id)) out.push(id);
  }
  return out.slice(0, 8);
}

export function isExamplePixel(value: string) {
  const text = value.trim().toLowerCase();
  if (!text) return true;
  if (PLACEHOLDERS.has(text)) return true;
  if (/^e\.g\.?/.test(text)) return true;
  if (/^x+(?:-x+)+$/.test(text)) return true;
  if (/^x{6,}$/.test(text)) return true;
  return false;
}

function unwrap(part: string) {
  return part.replace(/^['"`]+|['"`]+$/g, '').replace(/[),;]+$/g, '');
}

function partsOf(text: string) {
  return text
    .split(/[\s,;|]+/)
    .map((part) => unwrap(part.trim()))
    .filter(Boolean);
}

function looseToken(part: string, kind: PixelKind) {
  if (isExamplePixel(part) || NOISE.has(part.toLowerCase())) return '';
  if (kind === 'meta') return /^\d{8,20}$/.test(part) ? part : '';
  if (kind === 'snap') return /^[A-Za-z0-9-]{8,80}$/.test(part) ? part : '';
  return /^[A-Za-z0-9_-]{6,40}$/.test(part) ? part : '';
}

/** Pull every real pixel ID out of a field: one ID, a list, or a pasted pixel snippet. */
export function extractPixelIds(raw: unknown, kind: PixelKind): string[] {
  const text = String(raw ?? '').replace(INVISIBLE, '').replace(/[“”«»]/g, '"').trim();
  if (!text || isExamplePixel(text)) return [];

  const found: string[] = [];
  if (kind === 'meta') {
    for (const match of text.matchAll(/fbq\(\s*['"]init['"]\s*,\s*['"]?(\d{8,20})/gi)) found.push(match[1]);
  } else if (kind === 'tiktok') {
    for (const match of text.matchAll(/ttq\.load\(\s*['"]([A-Za-z0-9_-]{6,40})['"]/gi)) found.push(match[1]);
    for (const match of text.matchAll(/[?&]sdkid=([A-Za-z0-9_-]{6,40})/gi)) found.push(match[1]);
  } else {
    for (const match of text.matchAll(/snaptr\(\s*['"]init['"]\s*,\s*['"]([A-Za-z0-9-]{8,80})['"]/gi)) found.push(match[1]);
    for (const match of text.matchAll(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi)) {
      found.push(match[0]);
    }
  }
  if (found.length) return unique(found.filter((id) => !isExamplePixel(id)));

  const parts = partsOf(text);
  const loose = parts.map((part) => looseToken(part, kind)).filter(Boolean);
  if (kind === 'meta') return unique(loose);
  if (parts.length === 1) return unique(loose);
  return unique(loose.filter((id) => /\d/.test(id)));
}

export function joinPixelIds(ids: string[]) {
  return unique(ids).join(',');
}

export function splitStoredPixelIds(...values: Array<string | null | undefined>) {
  const ids: string[] = [];
  for (const value of values) {
    for (const part of String(value || '').split(',')) {
      const id = part.trim();
      if (id && !ids.includes(id)) ids.push(id);
    }
  }
  return ids;
}
