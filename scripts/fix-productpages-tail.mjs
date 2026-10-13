import fs from 'fs';

const path = 'lib/productPages.ts';
let cur = fs.readFileSync(path, 'utf8');

const broken = cur.match(/export function getProductPage\s*$/);
if (broken) {
  cur = cur.replace(
    /export function getProductPage\s*$/,
    `export function getProductPage(id: string) {
  const alias = id === 'antichoc' ? 'produit-1' : id;
  return PRODUCT_PAGES.find((p) => p.id === alias);
}

export const PRODUCTS = PRODUCT_PAGES.filter((p) => p.listed !== false).map((p) => ({
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
  href: \`/product/\${p.id}\`,
  featured: true,
}));

export const FILTERS = [{ id: 'all', label: 'الكل' }];

export function getProduct(id: string) {
  const alias = id === 'antichoc' ? 'produit-1' : id;
  return PRODUCTS.find((p) => p.id === alias);
}
`
  );
  fs.writeFileSync(path, cur);
  console.log('tail fixed');
} else if (cur.includes("alias = id === 'produit-1' ? 'kalb-robot-ai'")) {
  cur = cur.replace(
    /const alias = id === 'produit-1' \? 'kalb-robot-ai' : id;/g,
    "const alias = id === 'antichoc' ? 'produit-1' : id;"
  );
  cur = cur.replace(
    'PRODUCT_PAGES.filter((p) => p.listed === true)',
    'PRODUCT_PAGES.filter((p) => p.listed !== false)'
  );
  fs.writeFileSync(path, cur);
  console.log('aliases fixed');
} else {
  console.log('file looks ok already');
}

// verify
const s = fs.readFileSync(path, 'utf8');
console.log('has getProduct:', s.includes('export function getProduct('));
console.log('has produit-1:', s.includes("id: 'produit-1'"));
console.log('has kalb:', s.includes("id: 'kalb-robot-ai'"));
console.log('tail:', JSON.stringify(s.slice(-120)));
