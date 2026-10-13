import { execSync } from 'child_process';
import fs from 'fs';

const old = execSync('git show 28ac589:lib/productPages.ts', { encoding: 'utf8' });
const marker = "id: 'produit-1'";
const idx = old.indexOf(marker);
const start = old.lastIndexOf('{', idx);
const endMarker = old.indexOf("id: 'produit-2'");
const beforeEnd = old.lastIndexOf('},', endMarker);
let block = old.slice(start, beforeEnd + 2).trim();
if (!block.includes('listed:')) {
  block = block.replace(
    "badgeColor: '#D97706',",
    "badgeColor: '#D97706',\n    listed: true,"
  );
}

const path = 'lib/productPages.ts';
let cur = fs.readFileSync(path, 'utf8');

if (!cur.includes("id: 'produit-1'")) {
  const m = cur.match(/\r?\n\];\r?\n\r?\nexport function getProductPage/);
  if (!m || m.index == null) throw new Error('array end not found');
  const sep = cur.includes('\r\n') ? '\r\n' : '\n';
  cur = cur.slice(0, m.index) + sep + '  ' + block + m[0];
}

cur = cur.replace(
  /const alias = id === 'produit-1' \? 'kalb-robot-ai' : id;/g,
  "const alias = id === 'antichoc' ? 'produit-1' : id;"
);

cur = cur.replace(
  'PRODUCT_PAGES.filter((p) => p.listed === true)',
  'PRODUCT_PAGES.filter((p) => p.listed !== false)'
);

fs.writeFileSync(path, cur);
console.log('ok', (cur.match(/id: '/g) || []).length);
