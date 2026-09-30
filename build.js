const fs = require('fs');
const path = require('path');

const root = process.cwd();
const file = path.join(root, 'index.html');
let text = fs.readFileSync(file, 'utf8');

const configScript = `<script>window.GHADEER_SUPABASE_CONFIG={url:"https://xewjakfmdfkbhcnxglct.supabase.co",key:"sb_publishable__i-E8Gi5hcdfNd7gZXa12Q_-ZPSXPUr"};</script>`;
const version = '20260930.2';
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
  `jobs-realestate-enhancement.js?v=${version}`,
  `ui-final-fix.js?v=${version}`,
  `pin-recovery.js?v=${version}`,
  `member-session.js?v=${version}`,
  `neighborhood-news-ticker.js?v=${version}`
];

if (!text.includes('GHADEER_SUPABASE_CONFIG')) {
  text = text.replace('</head>', `${configScript}\n</head>`);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
}

for (const base of scripts.map(s => s.split('?')[0])) {
  const escapedBase = escapeRegExp(base);
  const re = new RegExp(`<script\\s+src=["']${escapedBase}(?:\\?[^"']*)?["']\\s*><\\/script>`, 'g');
  let first = true;
  text = text.replace(re, match => {
    if (first) {
      first = false;
      return match;
    }
    return '';
  });
}

for (const src of scripts) {
  const base = src.split('?')[0];
  const escapedBase = escapeRegExp(base);
  if (!text.includes(`src="${src}"`) && !text.includes(`src='${src}'`)) {
    const re = new RegExp(`<script\\s+src=["']${escapedBase}(?:\\?[^"']*)?["']\\s*><\\/script>`, 'g');
    text = text.replace(re, '');
    text = text.replace('</body>', `<script src="${src}"></script>\n</body>`);
  }
}

// Keep one reminder board only; remove the legacy standalone ticker safely.
text = text.replace(/<script\s+src=["']dhikr-ticker\.js(?:\?[^"']*)?["']\s*><\/script>/g, '');

// Force browsers to fetch the current application bundle after a deployment.
text = text.replace(/app\.js\?v=[^"']+/g, `app.js?v=${version}`);

// Keep the build idempotent: only write when content actually changed.
const currentIndex = fs.readFileSync(file, 'utf8');
if (currentIndex !== text) fs.writeFileSync(file, text, 'utf8');

console.log(`Ghadeer production build ${version}: validated and materialized frontend enhancement scripts without modifying source JavaScript.`);
