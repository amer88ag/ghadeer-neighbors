const fs = require('fs');
const path = require('path');

const root = process.cwd();
const file = path.join(root, 'index.html');
let text = fs.readFileSync(file, 'utf8');

const configScript = `<script>window.GHADEER_SUPABASE_CONFIG={url:"https://xewjakfmdfkbhcnxglct.supabase.co",key:"sb_publishable__i-E8Gi5hcdfNd7gZXa12Q_-ZPSXPUr"};</script>`;
const version = '20260930.1';
const scripts = [
  `enhancements.js?v=${version}`,
  `quran-enhancement.js?v=${version}`,
  `runtime-fix.js?v=${version}`,
  `services-enhancement.js?v=${version}`,
  `rental-enhancement.js?v=${version}`,
  `neighbor-connect.js?v=${version}`,
  `outing-events-enhancement.js?v=${version}`,
  `production-fixes.js?v=${version}`,
  `production-bridge.js?v=${version}`,
  'jobs-realestate-enhancement.js?v=20260930.1',
  'ui-final-fix.js?v=20260930.1',
  'pin-recovery.js?v=20260930.1',
  'member-session.js?v=20260930.1',
  'neighborhood-news-ticker.js?v=20260930.1',
  'notification-settings.js?v=20260930.1'
];

if (!text.includes('GHADEER_SUPABASE_CONFIG')) text = text.replace('</head>', `${configScript}\n</head>`);

for (const base of scripts.map(s => s.split('?')[0])) {
  const escapedBase = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`<script\\s+src=["']${escapedBase}(?:\\?[^"']*)?["']\\s*><\\/script>`, 'g');
  let first = true;
  text = text.replace(re, match => {
    if (first) { first = false; return match; }
    return '';
  });
}

for (const src of scripts) {
  const base = src.split('?')[0];
  const escapedBase = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!text.includes(`src="${src}"`) && !text.includes(`src='${src}'`)) {
    const re = new RegExp(`<script\\s+src=["']${escapedBase}(?:\\?[^"']*)?["']\\s*><\\/script>`, 'g');
    text = text.replace(re, '');
    text = text.replace('</body>', `<script src="${src}"></script>\n</body>`);
  }
}

// Keep one reminder board only. The legacy standalone ticker is never loaded.
text = text.replace(/<script\s+src=["']dhikr-ticker\.js(?:\?[^"']*)?["']\s*><\/script>/g, '');

// Force browsers to fetch the current application bundle after a production deployment.
text = text.replace(/app\.js\?v=[^"']+/g, 'app.js?v=20260930.1');

const appFile = path.join(root, 'app.js');
if (fs.existsSync(appFile)) {
  let app = fs.readFileSync(appFile, 'utf8');
  app = app.replace(/\n\/\/ ghadeer-enhancements-loader[\s\S]*?\}\)\(\);\s*$/m, '\n');
  // Public member reads must never expose the private PIN hash.
  app = app.replace('table("members",{order:"id"})', 'table("members",{select:"id,name,active",order:"id"})');
  const marker = 'function openPage(id){';
  if (!app.includes('window.GHADEER_CTX') && app.includes(marker)) {
    app = app.replace(marker, 'window.GHADEER_CTX=()=>({state,db,rpc,loadData,loadMembers});\n' + marker);
  }
  fs.writeFileSync(appFile, app, 'utf8');
}

fs.writeFileSync(file, text, 'utf8');
console.log('Ghadeer production build: deduplicated enhancement scripts, removed legacy duplicate dhikr ticker, forced fresh frontend assets, enabled PIN recovery/device session/news ticker/notification settings, and restricted public member reads to non-sensitive columns.');
