import fs from 'fs';
const path = 'lib/productPages.ts';
let s = fs.readFileSync(path, 'utf8');

const start = s.indexOf('export const PRODUCT_PAGES: ProductPageConfig[] = [') + 'export const PRODUCT_PAGES: ProductPageConfig[] = ['.length;
const end = s.indexOf('\n];\n\nexport function getProductPage');
const body = s.slice(start, end);

function extract(id) {
  const marker = `id: '${id}'`;
  const mi = body.indexOf(marker);
  if (mi < 0) throw new Error('missing ' + id);
  const open = body.lastIndexOf('{', mi);
  let depth = 0;
  for (let i = open; i < body.length; i++) {
    if (body[i] === '{') depth++;
    if (body[i] === '}') {
      depth--;
      if (depth === 0) return body.slice(open, i + 1);
    }
  }
  throw new Error('no close ' + id);
}

const anti = extract('produit-1');
const robot = extract('kalb-robot-ai');
const newBody = `\n  ${anti},\n  ${robot},\n`;
s = s.slice(0, start) + newBody + s.slice(end);
fs.writeFileSync(path, s);

// verify file still has exports
if (!s.includes('export function getProduct(')) throw new Error('truncated!');
console.log('order ok, length', s.length);
