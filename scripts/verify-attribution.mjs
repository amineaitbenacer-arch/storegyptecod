/**
 * Quick regression checks for order source attribution.
 * Run: node scripts/verify-attribution.mjs
 */
import {
  cleanClickId,
  resolveAttributedSource,
  sourceFromClick,
} from '../lib/tracking.ts';

let failed = 0;
function check(name, got, expected) {
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  if (!ok) {
    failed += 1;
    console.error('FAIL', name, '\n  got     ', got, '\n  expected', expected);
  } else {
    console.log('ok  ', name);
  }
}

check('drop placeholder fbclid', cleanClickId('fbclid'), undefined);
check('drop short id', cleanClickId('abc'), undefined);
check(
  'keep real meta id',
  Boolean(cleanClickId('PAZXh0bgNhZW0BMABwZG9mAmZkaWQWUQIpVScdVfVT1L1YPL9KvSfMIAmSfmFkaWQBqzm')),
  true
);

check(
  'fake fbclid + real ttclid + tiktok utm → tiktok',
  sourceFromClick({
    fbclid: 'fbclid',
    ttclid: 'E_C_P_CuIBjIt9Q94lURJ5tXJ97Jl5YZpyy7hqWn',
    utm_source: 'tiktok',
  }),
  'tiktok'
);

check(
  'real ig fbclid → meta',
  sourceFromClick({
    fbclid: 'PAZXh0bgNhZW0BMABwZG9mAmZkaWQWUQIpVScdVfVT1L1YPL9KvSfMIAmSfmFkaWQBqzm',
    utm_source: 'ig',
  }),
  'meta'
);

check(
  'resolve strips fake fbclid',
  resolveAttributedSource({
    fbclid: 'fbclid',
    ttclid: 'E_C_P_CuIBjIt9Q94lURJ5tXJ97Jl5YZpyy7hqWn',
    utm_source: 'tiktok',
    bodySource: 'meta',
  }).source,
  'tiktok'
);

check(
  'resolve ignores sticky bodySource without proof',
  resolveAttributedSource({ bodySource: 'meta' }).source,
  'direct'
);

const stale = resolveAttributedSource({
  fbclid: 'PAZXh0bgNhZW0BMABwZG9mAmZkaWQWUQIpVScdVfVT1L1YPL9KvSfMIAmSfmFkaWQBqzm',
  utm_source: 'fb',
  clickAt: Date.now() - 8 * 24 * 60 * 60 * 1000,
  bodySource: 'meta',
});
check('stale click → direct', stale.source, 'direct');
check('stale click clears fbclid', stale.fbclid, '');

const fresh = resolveAttributedSource({
  fbclid: 'PAZXh0bgNhZW0BMABwZG9mAmZkaWQWUQIpVScdVfVT1L1YPL9KvSfMIAmSfmFkaWQBqzm',
  ttclid: 'E_C_P_CuIBjIt9Q94lURJ5tXJ97Jl5YZpyy7hqWn',
  utm_source: 'fb',
  clickAt: Date.now(),
});
check('meta win strips ttclid', fresh.ttclid, '');
check('meta win keeps fbclid', Boolean(fresh.fbclid), true);

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nAll attribution checks passed');
