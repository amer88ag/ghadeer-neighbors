const fs = require('fs');
const path = require('path');

const root = process.cwd();
const indexPath = path.join(root, 'index.html');
let index = fs.readFileSync(indexPath, 'utf8');

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

if (!index.includes('GHADEER_SUPABASE_CONFIG')) {
  throw new Error('Missing GHADEER_SUPABASE_CONFIG in index.html');
}

for (const script of requiredScripts) {
  if (script !== 'runtime-hardening.js' && !index.includes(script)) {
    throw new Error(`Missing frontend script reference: ${script}`);
  }
  if (!fs.existsSync(path.join(root, script))) {
    throw new Error(`Missing frontend script file: ${script}`);
  }
}

const localScripts = [...index.matchAll(/<script[^>]+src=["']([^"']+)["']/g)]
  .map(match => match[1].split('?')[0])
  .filter(src => src && !/^(https?:)?\/\//.test(src));

for (const src of localScripts) {
  if (!fs.existsSync(path.join(root, src))) {
    throw new Error(`Missing local script file referenced by index.html: ${src}`);
  }
}

const scriptTags = [...index.matchAll(/<script[^>]+src=["']([^"']+)["'][^>]*><\/script>/g)]
  .map(match => match[1].split('?')[0]);
const counts = new Map();
for (const src of scriptTags) counts.set(src, (counts.get(src) || 0) + 1);
const duplicates = [...counts.entries()].filter(([, count]) => count > 1).map(([src]) => src);
if (duplicates.length) {
  throw new Error(`Duplicate frontend script references: ${duplicates.join(', ')}`);
}

// Inject the runtime hardening layer only inside platform build environments.
// The repository source remains unchanged; Vercel/Cloudflare receive the same
// generated page from main without requiring a second source tree.
const platformBuild = process.env.VERCEL === '1' || process.env.CF_PAGES === '1' || process.env.GHADEER_BUILD_INJECT === '1';
if (platformBuild && !index.includes('runtime-hardening.js')) {
  const appTag = '<script src="app.js"></script>';
  if (!index.includes(appTag)) throw new Error('Could not locate app.js script tag for runtime hardening injection');
  index = index.replace(appTag, '<script src="runtime-hardening.js"></script>' + appTag);
  fs.writeFileSync(indexPath, index, 'utf8');
  console.log('Ghadeer runtime hardening injected for production platform build.');
}

// Production build validates the complete source tree. Platform builds may
// materialize the runtime injection in the ephemeral build workspace only.
console.log('Ghadeer production build validation passed.');
