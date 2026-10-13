import fs from 'fs';

const h = fs.readFileSync(process.env.TEMP + '/dune2.html', 'utf8');
const checks = [
  'store-duo-head',
  'duo-card-slot',
  'duo-name',
  'kalb-robot-ai',
  'produit-1',
  'اختر منتجك',
  'منتجاتنا',
  'كلب روبوت',
  'عازل',
  'AntiChoc',
];
for (const k of checks) console.log(k, h.includes(k));

const duo = h.match(/id="products"[\s\S]{0,2500}/);
if (duo) {
  console.log(
    '\nPRODUCTS CHUNK:\n',
    duo[0]
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 500),
  );
}
