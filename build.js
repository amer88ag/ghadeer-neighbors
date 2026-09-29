const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'index.html');
let text = fs.readFileSync(file, 'utf8');
const configScript = `<script>window.GHADEER_SUPABASE_CONFIG={url:"https://xewjakfmdfkbhcnxglct.supabase.co",key:"sb_publishable__i-E8Gi5hcdfNd7gZXa12Q_-ZPSXPUr"};</script>`;
const scripts = [
  'enhancements.js?v=20260929.2',
  'quran-enhancement.js?v=20260929.2',
  'runtime-fix.js?v=20260929.2',
  'services-enhancement.js?v=20260929.2',
  'rental-enhancement.js?v=20260929.2',
  'neighbor-connect.js?v=20260929.2',
  'outing-events-enhancement.js?v=20260929.2',
  'production-fixes.js?v=20260929.2',
  'production-bridge.js?v=20260929.2',
  'jobs-realestate-enhancement.js?v=20260929.2'
];
if (!text.includes('GHADEER_SUPABASE_CONFIG')) text = text.replace('</head>', `${configScript}\n</head>`);
for (const src of scripts) {
  if (!text.includes(src)) text = text.replace('</body>', `<script src="${src}"></script>\n</body>`);
}
text = text.replace(/app\.js\?v=[^"']+/g, 'app.js?v=20260929.2');
fs.writeFileSync(file, text, 'utf8');
const appFile = path.join(process.cwd(), 'app.js');
if (fs.existsSync(appFile)) {
  let app = fs.readFileSync(appFile, 'utf8');
  const marker = 'function openPage(id){';
  if (!app.includes('window.GHADEER_CTX') && app.includes(marker)) {
    app = app.replace(marker, 'window.GHADEER_CTX=()=>({state,db,rpc,loadData,loadMembers});\n'+marker);
    fs.writeFileSync(appFile, app, 'utf8');
  }
}
