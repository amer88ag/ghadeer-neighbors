const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'index.html');
let text = fs.readFileSync(file, 'utf8');
const scripts = [
  'enhancements.js?v=20260928.2',
  'quran-enhancement.js?v=20260928.2',
  'runtime-fix.js?v=20260928.2',
  'services-enhancement.js?v=20260928.2',
  'rental-enhancement.js?v=20260928.2'
];
for (const src of scripts) {
  if (!text.includes(src)) text = text.replace('</body>', `<script src="${src}"></script>\n</body>`);
}
text = text.replace(/app\.js\?v=[^"']+/g, 'app.js?v=20260928.2');
fs.writeFileSync(file, text, 'utf8');
