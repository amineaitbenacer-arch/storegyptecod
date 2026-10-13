import { execSync } from 'child_process';
import fs from 'fs';

const s = execSync('git show 28ac589:lib/productPages.ts', { encoding: 'utf8' });
const marker = "id: 'produit-1'";
const idx = s.indexOf(marker);
const start = s.lastIndexOf('{', idx);
const end = s.indexOf("id: 'produit-2'");
const beforeEnd = s.lastIndexOf('},', end);
const block = s.slice(start, beforeEnd + 2);
fs.writeFileSync('scripts/produit1-restore.txt', block);
console.log('extracted', block.length, 'chars');
console.log(block.slice(0, 400));
