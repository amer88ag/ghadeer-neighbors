const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'index.html');
let text = fs.readFileSync(file, 'utf8');
for (const src of ['enhancements.js?v=20260928','quran-enhancement.js?v=20260928','runtime-fix.js?v=20260928','services-enhancement.js?v=20260928']) {
  if (!text.includes(src)) text = text.replace('</body>', `<script src="${src}"></script>\n</body>`);
}
text = text.replace('app.js?v=e1032958', 'app.js?v=20260928');
fs.writeFileSync(file, text, 'utf8');
