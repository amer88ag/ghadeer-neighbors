const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'index.html');
let text = fs.readFileSync(file, 'utf8');
const configScript = `<script>window.GHADEER_SUPABASE_CONFIG={url:"https://xewjakfmdfkbhcnxglct.supabase.co",key:"sb_publishable__i-E8Gi5hcdfNd7gZXa12Q_-ZPSXPUr"};</script>`;
const scripts = [
  'enhancements.js?v=20260929.1',
  'quran-enhancement.js?v=20260929.1',
  'runtime-fix.js?v=20260929.1',
  'services-enhancement.js?v=20260929.1',
  'rental-enhancement.js?v=20260929.1',
  'neighbor-connect.js?v=20260929.1',
  'outing-events-enhancement.js?v=20260929.1'
];
if (!text.includes('GHADEER_SUPABASE_CONFIG')) text = text.replace('</head>', `${configScript}\n</head>`);
for (const src of scripts) {
  if (!text.includes(src)) text = text.replace('</body>', `<script src="${src}"></script>\n</body>`);
}
text = text.replace(/app\.js\?v=[^"']+/g, 'app.js?v=20260929.1');
// Expose a narrow runtime context for approved enhancement modules without exposing secrets beyond the existing client-side publishable key.
const marker = 'function openPage(id){';
if (!text.includes('window.GHADEER_CTX')) text = text.replace(marker, 'window.GHADEER_CTX=()=>({state,db,rpc,loadData,loadMembers});\n'+marker);
fs.writeFileSync(file, text, 'utf8');
