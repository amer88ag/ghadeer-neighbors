const fs = require('fs');
const path = require('path');

const root = process.cwd();
const build = fs.readFileSync(path.join(root, 'build.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

// These files are historical implementations superseded by the canonical v6 service
// catalog / v5 UI / canonical icon-route registry. They must never enter production.
const legacy = [
  'ghadeer-services-v2.js',
  'ghadeer-services-v3.js',
  'ghadeer-services-v4.js',
  'ghadeer-services-v5.js',
  'ghadeer-ui-v3.js',
  'ghadeer-ui-v4.js',
  'ghadeer-home-widgets-v1.js'
];

const errors = [];
for (const file of legacy) {
  if (build.includes(`'${file}'`) || build.includes(`"${file}"`)) {
    errors.push(`legacy layer is still in build.js: ${file}`);
  }
  const tag = new RegExp(`<script[^>]+src=[\\"'](?:\\./)?${file.replace('.', '\\.')}(?:[?#][^\\"']*)?[\\"']`, 'i');
  if (tag.test(index)) errors.push(`legacy layer is directly referenced by index.html: ${file}`);
}

// Only the canonical icon router may own the global capture-phase click contract.
const canonical = 'ghadeer-icon-route-registry-v1.js';
if (!build.includes(canonical)) errors.push(`canonical icon router missing from build.js: ${canonical}`);

const productionScripts = [
  'ghadeer-icon-route-registry-v1.js',
  'service-routes.js',
  'service-route-adapter.js',
  'ghadeer-service-registry-v1.js',
  'ghadeer-service-route-map-v1.js',
  'ghadeer-services-v6.js',
  'ghadeer-ui-v5.js',
  'ghadeer-final-ui-v6.js'
];

for (const file of productionScripts) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) errors.push(`canonical production layer missing: ${file}`);
}

const routerText = fs.readFileSync(path.join(root, canonical), 'utf8');
const routerCount = (routerText.match(/document\.addEventListener\(['\"]click['\"]/g) || []).length;
if (routerCount !== 1) errors.push(`canonical router must contain exactly one global click listener; found ${routerCount}`);

if (errors.length) {
  console.error(errors.map(x => `LAYER AUDIT: ${x}`).join('\n'));
  process.exit(1);
}

console.log('Layer audit PASS');
console.log(`Canonical icon router: ${canonical}`);
console.log(`Canonical production layers checked: ${productionScripts.length}`);
console.log(`Historical layers blocked from production: ${legacy.length}`);
