const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'index.html');
let text = fs.readFileSync(file, 'utf8');
const configScript = `<script>window.GHADEER_SUPABASE_CONFIG={url:"https://xewjakfmdfkbhcnxglct.supabase.co",key:"sb_publishable__i-E8Gi5hcdfNd7gZXa12Q_-ZPSXPUr"};</script>`;
const scripts = [
  'enhancements.js?v=20260928.3',
  'quran-enhancement.js?v=20260928.3',
  'runtime-fix.js?v=20260928.3',
  'services-enhancement.js?v=20260928.3',
  'rental-enhancement.js?v=20260928.3',
  'neighbor-connect.js?v=20260928.3'
];
if (!text.includes('GHADEER_SUPABASE_CONFIG')) text = text.replace('</head>', `${configScript}\n</head>`);
for (const src of scripts) {
  if (!text.includes(src)) text = text.replace('</body>', `<script src="${src}"></script>\n</body>`);
}
text = text.replace(/app\.js\?v=[^"']+/g, 'app.js?v=20260928.3');
fs.writeFileSync(file, text, 'utf8');
