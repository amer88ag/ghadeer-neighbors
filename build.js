const fs = require('fs');
const path = require('path');

const root = process.cwd();
const file = path.join(root, 'index.html');
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
  'jobs-realestate-enhancement.js?v=20260929.2',
  'ui-final-fix.js?v=20260929.1',
  'pin-recovery.js?v=20260929.1',
  'member-session.js?v=20260929.1',
  'neighborhood-news-ticker.js?v=20260929.1'
];

if (!text.includes('GHADEER_SUPABASE_CONFIG')) text = text.replace('</head>', `${configScript}\n</head>`);

for (const base of scripts.map(s => s.split('?')[0])) {
  const re = new RegExp(`<script\\s+src=["']${base.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}(?:\\?[^"']*)?["']\\s*><\\/script>`, 'g');
  let first = true;
  text = text.replace(re, match => {
    if (first) { first = false; return match; }
    return '';
  });
}

for (const src of scripts) {
  const base = src.split('?')[0];
  if (!text.includes(`src="${src}"`) && !text.includes(`src='${src}'`)) {
    const re = new RegExp(`<script\\s+src=["']${base.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}(?:\\?[^"']*)?["']\\s*><\\/script>`, 'g');
    text = text.replace(re, '');
    text = text.replace('</body>', `<script src="${src}"></script>\n</body>`);
  }
}

text = text.replace(/app\.js\?v=[^"']+/g, 'app.js?v=20260929.2');

const appFile = path.join(root, 'app.js');
if (fs.existsSync(appFile)) {
  let app = fs.readFileSync(appFile, 'utf8');
  app = app.replace(/\n\/\/ ghadeer-enhancements-loader[\s\S]*?\}\)\(\);\s*$/m, '\n');
  const marker = 'function openPage(id){';
  if (!app.includes('window.GHADEER_CTX') && app.includes(marker)) {
    app = app.replace(marker, 'window.GHADEER_CTX=()=>({state,db,rpc,loadData,loadMembers});\n' + marker);
  }
  fs.writeFileSync(appFile, app, 'utf8');
}

fs.writeFileSync(file, text, 'utf8');
console.log('Ghadeer production build: deduplicated enhancement scripts, removed duplicate runtime loader, enabled PIN recovery, revocable device identity, and neighborhood news ticker.');
