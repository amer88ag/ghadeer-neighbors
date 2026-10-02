const fs = require('fs');
const { spawnSync } = require('child_process');
const html = fs.readFileSync('index.html','utf8');
const build = fs.readFileSync('build.js','utf8');
const errors = [];
const jsFiles = new Set(['app.js']);

// build.js owns the canonical production script list. Support the current
// featureScripts contract and retain compatibility with the older scripts name.
const scriptsBlock =
  build.match(/const featureScripts\s*=\s*\[([\s\S]*?)\];/) ||
  build.match(/const scripts\s*=\s*\[([\s\S]*?)\];/);
if (!scriptsBlock) {
  errors.push('build.js does not expose a canonical featureScripts/scripts list');
} else {
  for (const m of scriptsBlock[1].matchAll(/["']([^"']+\.js)(?:\?[^"']*)?["']/g)) {
    if (fs.existsSync(m[1])) jsFiles.add(m[1]);
    else errors.push(`build references missing JavaScript file: ${m[1]}`);
  }
}

// Also include every JavaScript file directly referenced by index.html.
for (const m of html.matchAll(/(?:src|href)=["']([^"']+\.js)(?:\?[^"']*)?["']/gi)) {
  const f = m[1];
  if (/^(https?:)?\/\//i.test(f)) continue;
  if (fs.existsSync(f)) jsFiles.add(f);
  else errors.push(`HTML references missing JavaScript file: ${f}`);
}

// Canonical icon/service routing contract: exactly one click authority.
const iconRegistry = 'ghadeer-icon-route-registry-v1.js';
const routeAdapter = 'service-route-adapter.js';
if (!fs.existsSync(iconRegistry)) errors.push(`missing canonical icon registry: ${iconRegistry}`);
else {
  const s = fs.readFileSync(iconRegistry, 'utf8');
  if (!/GHADEER_ICON_ROUTES/.test(s) || !/UNREGISTERED ICON\/SERVICE/.test(s) || !/function audit\(/.test(s)) {
    errors.push('canonical icon registry is missing required open/audit contract');
  }
}
if (fs.existsSync(routeAdapter)) {
  const s = fs.readFileSync(routeAdapter, 'utf8');
  if (/addEventListener\s*\(\s*['"]click['"]/.test(s)) errors.push('service-route-adapter must not install a competing click listener');
}
if (!scriptsBlock?.[1]?.includes(iconRegistry)) errors.push('build.js must include the canonical icon registry');

const jsList = [...jsFiles];
const js = jsList.map(f => fs.readFileSync(f, 'utf8')).join('\n');
function count(re, s) { return (s.match(re) || []).length; }

const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m => m[1]);
const seen = new Map();
for (const id of ids) seen.set(id, (seen.get(id) || 0) + 1);
for (const [id, n] of seen) if (n > 1) errors.push(`duplicate id: ${id} (${n})`);

const runtimeReplacedIds = new Set([
  'homePrayerBtn','prayerRefreshBtn','startHifzBtn','startReadBtn',
  'quranOpenBtn','quranPrevBtn','quranNextBtn','quranBookmarksBtn',
  'checkHifzBtn','showHifzBtn','recordReadBtn','showReadTextBtn'
]);
const buttonRe = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
let m;
while ((m = buttonRe.exec(html))) {
  const attrs = m[1];
  const text = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
  const id = (attrs.match(/\bid=["']([^"']+)["']/i) || [])[1];
  if (id && runtimeReplacedIds.has(id)) continue;
  const onclick = /\bonclick=["']/i.test(attrs);
  const type = (attrs.match(/\btype=["']([^"']+)["']/i) || [])[1] || '';
  const localMarkup = onclick || /\bdata-page=["'][^"']+["']/i.test(attrs) ||
    /\bdata-mtab=["'][^"']+["']/i.test(attrs) ||
    /\bdata-(?:action|command|target)=["'][^"']+["']/i.test(attrs) || type === 'submit';
  if (!localMarkup && !id) errors.push(`button without wiring metadata: ${text || '(empty)'}`);
  if (id && !localMarkup) {
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!new RegExp(`\\b${escaped}\\b`).test(js)) {
      errors.push(`button id has no production-JS reference: ${id}`);
    }
  }
}

for (const f of jsList.concat(['build.js'])) {
  const r = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' });
  if (r.status !== 0) {
    errors.push(`syntax error in ${f}: ${(r.stderr || '').trim().slice(0, 300)}`);
  }
}

console.log(`Frontend audit: ${errors.length ? errors.length + ' issue(s)' : 'PASS'}`);
console.log(`Production JS files checked: ${jsList.length}`);
if (errors.length) {
  for (const e of errors) console.error(' - ' + e);
  process.exit(1);
}
console.log(`Static buttons checked: ${count(/<button\b/gi, html)}`);
console.log(`HTML ids checked: ${ids.length}`);
console.log('Canonical icon routing contract: PASS');
console.log('JavaScript syntax: PASS');
console.log('Production build wiring: PASS');
