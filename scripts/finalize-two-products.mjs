import fs from 'fs';

const path = 'lib/productPages.ts';
let s = fs.readFileSync(path, 'utf8');

// Put AntiChoc (produit-1) before robot in PRODUCT_PAGES
const robotRe = /\n  \{\n    id: 'kalb-robot-ai',[\s\S]*?\n    ctaLabel: 'اطلب الآن',\n  \},/;
const antiRe = /\n  \{\n    id: 'produit-1',[\s\S]*?\n    ctaLabel: 'اشترِ الآن',\n  \},?/;

const robotM = s.match(robotRe);
const antiM = s.match(antiRe);
if (!robotM || !antiM) {
  console.log('robot', !!robotM, 'anti', !!antiM);
  throw new Error('blocks not found');
}

const robot = robotM[0].replace(/^\n/, '').replace(/,$/, '');
const anti = antiM[0].replace(/^\n/, '').replace(/,$/, '');

// Remove both then insert AntiChoc then robot before ];
s = s.replace(robotRe, '\n');
s = s.replace(antiRe, '\n');

const insertAt = s.search(/\n\];\n\nexport function getProductPage/);
if (insertAt < 0) throw new Error('array end missing');
s = s.slice(0, insertAt) + '\n  ' + anti + ',\n  ' + robot + ',\n' + s.slice(insertAt);

// Clean PRODUCTS export
s = s.replace(
  /export const PRODUCTS = PRODUCT_PAGES\.filter\([\s\S]*?export const FILTERS/,
  `export const PRODUCTS = PRODUCT_PAGES.filter((p) => p.listed !== false).map((p) => ({
  id: p.id,
  name: p.heroTitle,
  type: p.type,
  emoji: p.emoji,
  price: p.offers.find((o) => o.popular)?.price ?? p.offers[0].price,
  oldPrice: p.offers.find((o) => o.popular)?.oldPrice ?? p.offers[0].oldPrice,
  image: p.catalogImage,
  badge: p.badge,
  badgeColor: p.badgeColor,
  shortDesc: p.shortDesc,
  category: ['all'],
  tags: [p.brand, p.type],
  href: p.id === 'produit-1' ? '/product/antichoc' : \`/product/\${p.id}\`,
  featured: true,
}));

export const FILTERS`
);

// Aliases
s = s.replace(
  /const alias = id === 'antichoc' \? 'produit-1' : id;/g,
  "const alias = id === 'antichoc' || id === 'produit-1' ? 'produit-1' : id;"
);

// For getProductPage: antichoc shouldn't use ProductView - antichoc route is ProductShell.
// Keep getProductPage('produit-1') and getProductPage('antichoc') for catalog helpers.
s = s.replace(
  /export function getProductPage\(id: string\) \{[\s\S]*?\n\}/,
  `export function getProductPage(id: string) {
  if (id === 'antichoc') return PRODUCT_PAGES.find((p) => p.id === 'produit-1');
  return PRODUCT_PAGES.find((p) => p.id === id);
}`
);

s = s.replace(
  /export function getProduct\(id: string\) \{[\s\S]*?\n\}/,
  `export function getProduct(id: string) {
  if (id === 'antichoc') return PRODUCTS.find((p) => p.id === 'produit-1');
  return PRODUCTS.find((p) => p.id === id);
}`
);

fs.writeFileSync(path, s);

const { PRODUCTS, getProductPage } = await import('../lib/productPages.ts?t=' + Date.now()).catch(() => ({}));
console.log('written');
