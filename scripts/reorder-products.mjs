import fs from 'fs';

const path = 'lib/productPages.ts';
let s = fs.readFileSync(path, 'utf8');

const startMark = 'export const PRODUCT_PAGES: ProductPageConfig[] = [';
const start = s.indexOf(startMark) + startMark.length;
const end = s.search(/\r?\n\];\r?\n\r?\nexport function getProductPage/);
if (start < 0 || end < 0) throw new Error('bounds');

const body = s.slice(start, end);
// split top-level product objects by matching braces naive: find id markers
const robotStart = body.indexOf("id: 'kalb-robot-ai'");
const antiStart = body.indexOf("id: 'produit-1'");
if (robotStart < 0 || antiStart < 0) throw new Error('products missing');

function objectAround(idIdx) {
  const open = body.lastIndexOf('{', idIdx);
  // find matching close from open
  let depth = 0;
  for (let i = open; i < body.length; i++) {
    if (body[i] === '{') depth++;
    else if (body[i] === '}') {
      depth--;
      if (depth === 0) {
        // include trailing comma if present
        let endi = i + 1;
        while (endi < body.length && /[\s,]/.test(body[endi])) {
          if (body[endi] === ',') {
            endi++;
            break;
          }
          endi++;
        }
        return body.slice(open, endi);
      }
    }
  }
  throw new Error('unclosed');
}

const robot = objectAround(robotStart).trim().replace(/,$/, '');
const anti = objectAround(antiStart).trim().replace(/,$/, '');
const sep = s.includes('\r\n') ? '\r\n' : '\n';
const newBody = sep + '  ' + anti + ',' + sep + '  ' + robot + ',' + sep;
s = s.slice(0, start) + newBody + s.slice(end);
fs.writeFileSync(path, s);
console.log('reordered: AntiChoc first');
