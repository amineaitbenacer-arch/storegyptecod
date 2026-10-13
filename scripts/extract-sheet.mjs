import fs from 'fs';
import vm from 'vm';

const src = fs.readFileSync('app/antichocBody.ts', 'utf8');
const sandbox = { module: { exports: {} }, exports: {} };
vm.runInNewContext(
  src.replace('export default antichocBody', 'module.exports = antichocBody'),
  sandbox
);
const body = sandbox.module.exports;

const marker = '<!-- 📝 CHECKOUT BOTTOM SHEET';
const sheetStart = body.indexOf(marker);
if (sheetStart < 0) throw new Error('sheet marker not found');

const divStart = body.lastIndexOf('<div class="sheet-bg"', sheetStart + 200);
const start = divStart >= 0 ? divStart : body.indexOf('<div class="sheet-bg"');

let pos = start;
let depth = 0;
while (pos < body.length) {
  const nextOpen = body.indexOf('<div', pos);
  const nextClose = body.indexOf('</div>', pos);
  if (nextClose === -1) break;
  if (nextOpen !== -1 && nextOpen < nextClose) {
    depth++;
    pos = nextOpen + 4;
  } else {
    depth--;
    pos = nextClose + 6;
    if (depth === 0) {
      fs.writeFileSync('scripts/antichoc-checkout-sheet.html', body.slice(start, pos), 'utf8');
      console.log('Wrote scripts/antichoc-checkout-sheet.html', body.slice(start, pos).length, 'chars');
      break;
    }
  }
}
