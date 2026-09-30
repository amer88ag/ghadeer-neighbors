const fs = require('fs');
const path = require('path');

const root = process.cwd();
const indexPath = path.join(root, 'index.html');
const index = fs.readFileSync(indexPath, 'utf8');

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
  'neighborhood-news-ticker.js'
];

if (!index.includes('GHADEER_SUPABASE_CONFIG')) {
  throw new Error('Missing GHADEER_SUPABASE_CONFIG in index.html');
}

for (const script of requiredScripts) {
  if (!index.includes(script)) {
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

// Production build is intentionally non-mutating. Vercel serves the repository
// root directly, so changing source files during build can create divergent
// artifacts and was a root cause of the previous deployment loop.
console.log('Ghadeer production build validation passed. Source tree left unchanged.');
