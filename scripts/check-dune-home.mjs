import fs from 'fs';
const h = fs.readFileSync(process.env.TEMP + '/dune.html', 'utf8');
const links = [...h.matchAll(/href="(\/product\/[^"]+)"/g)].map((m) => m[1]);
console.log('product links:', [...new Set(links)]);
const i = h.indexOf('store-duo');
const chunk = h.slice(i, i + 5000);
for (const key of ['kalb-robot', 'robotdog', 'produit-', 'كلب', 'AntiChoc', 'STEM', 'duo-name']) {
  console.log(key, chunk.includes(key) || h.includes(key));
}
const names = [...chunk.matchAll(/duo-name[\s\S]*?<\/h3>/g)].map((m) =>
  m[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
);
console.log('names', names);
