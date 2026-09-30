const fs = require('fs');
const path = require('path');

const root = process.cwd();
const indexPath = path.join(root, 'index.html');
const sourceIndex = fs.readFileSync(indexPath, 'utf8');
let deployIndex = sourceIndex;

const requiredScripts = [
  'app.js',
  'enhancements.js',
  'quran-enhancement.js',
  'runtime-fix.js',
  'services-enhancement.js',
  'rental-enhancement.js',
  'neighbor-connect.js',
  'outing-events-enhancement.js',
  'production-fixes.js',
  'production-bridge.js',
  'jobs-realestate-enhancement.js',
  'ui-final-fix.js',
  'pin-recovery.js',
  'member-session.js',
  'neighborhood-news-ticker.js',
  'runtime-hardening.js'
];

if (!sourceIndex.includes('GHADEER_SUPABASE_CONFIG')) {
  throw new Error('Missing GHADEER_SUPABASE_CONFIG in index.html');
}

for (const script of requiredScripts) {
  if (script !== 'runtime-hardening.js' && !sourceIndex.includes(script)) {
    throw new Error(`Missing frontend script reference: ${script}`);
  }
  if (!fs.existsSync(path.join(root, script))) {
    throw new Error(`Missing frontend script file: ${script}`);
  }
}

const localScripts = [...sourceIndex.matchAll(/<script[^>]+src=["']([^"']+)["']/g)]
  .map(match => match[1].split('?')[0])
  .filter(src => src && !/^(https?:)?\/\//.test(src));

for (const src of localScripts) {
  if (!fs.existsSync(path.join(root, src))) {
    throw new Error(`Missing local script file referenced by index.html: ${src}`);
  }
}

const scriptTags = [...sourceIndex.matchAll(/<script[^>]+src=["']([^"']+)["'][^>]*><\/script>/g)]
  .map(match => match[1].split('?')[0]);
const counts = new Map();
for (const src of scriptTags) counts.set(src, (counts.get(src) || 0) + 1);
const duplicates = [...counts.entries()].filter(([, count]) => count > 1).map(([src]) => src);
if (duplicates.length) {
  throw new Error(`Duplicate frontend script references: ${duplicates.join(', ')}`);
}

// Build one deterministic browser artifact from the same main-branch source.
// Vercel serves the root artifact; Cloudflare Worker serves dist/.
if (!deployIndex.includes('runtime-hardening.js')) {
  const appTag = '<script src="app.js"></script>';
  if (!deployIndex.includes(appTag)) throw new Error('Could not locate app.js script tag for runtime hardening injection');
  deployIndex = deployIndex.replace(appTag, '<script src="runtime-hardening.js"></script>' + appTag);
}

const dist = path.join(root, 'dist');
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
fs.writeFileSync(path.join(dist, 'index.html'), deployIndex, 'utf8');

// Copy browser-facing root assets only. Never publish migrations, CI files,
// .git data, secrets, or source-control configuration as static assets.
for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  if (!entry.isFile()) continue;
  if (entry.name === 'build.js' || entry.name === 'worker.js') continue;
  if (/^\u2060/.test(entry.name)) continue;
  if (!/\.(?:js|css)$/i.test(entry.name) && entry.name !== '_redirects') continue;
  fs.copyFileSync(path.join(root, entry.name), path.join(dist, entry.name));
}

// Vercel's existing production project serves the repository root. Materialize
// the generated index there only in Vercel's ephemeral build workspace.
if (process.env.VERCEL === '1') {
  fs.writeFileSync(indexPath, deployIndex, 'utf8');
}

console.log(`Ghadeer production artifact generated in ${dist}.`);
console.log('Ghadeer production build validation passed.');
