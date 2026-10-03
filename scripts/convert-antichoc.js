const fs = require('fs');

const html = fs.readFileSync('c:/Users/hp/Downloads/antichoc/views/index.html', 'utf8');
const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
if (!bodyMatch) throw new Error('no body');
let body = bodyMatch[1];

body = body.replace(/<script[\s\S]*?<\/script>/gi, '');
body = body.replace(/src="images\//g, 'src="/images/');
body = body.replace(/src='images\//g, "src='/images/");
body = body.replace(/\sonclick="/gi, ' data-ac-click="');
body = body.replace(/\sonsubmit="/gi, ' data-ac-submit="');
body = body.replace(/\sonchange="/gi, ' data-ac-change="');
body = body.replace(/\soninput="/gi, ' data-ac-input="');
body = body.replace(/thankyou\.html/g, '/thankyou');

// Close emotional-box-enhanced before hero section end (original missing </div>)
body = body.replace(
  /(\s*)<\/div>\s*\n\s*<\/div>\s*\n\s*<\/section>\s*\n\s*<!-- 🚨 EMOTIONAL AGITATION/,
  '$1</div>\n$1</div>\n$1</div>\n  </section>\n\n  <!-- 🚨 EMOTIONAL AGITATION'
);

fs.writeFileSync(
  'c:/Users/hp/Downloads/storegyptecod/app/antichocBody.ts',
  `const antichocBody = ${JSON.stringify(body)};\nexport default antichocBody;\n`,
  'utf8'
);

const tsx = `'use client';

import antichocBody from '../antichocBody';

/** Full Antichoc HTML (100% source markup). Interactions via ProductShell. */
export default function AntichocMarkup() {
  return (
    <div
      id="antichoc-root"
      className="ac-root"
      dangerouslySetInnerHTML={{ __html: antichocBody }}
    />
  );
}
`;

fs.writeFileSync('c:/Users/hp/Downloads/storegyptecod/app/components/AntichocMarkup.tsx', tsx, 'utf8');
console.log('ok', body.length);
