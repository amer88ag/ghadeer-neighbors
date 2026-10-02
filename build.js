const fs=require('fs');
const path=require('path');
const root=process.cwd();
const indexPath=path.join(root,'index.html');
const dist=path.join(root,'dist');
if(!fs.existsSync(indexPath))throw new Error('Missing index.html');
let deployIndex=fs.readFileSync(indexPath,'utf8');
if(!deployIndex.includes('GHADEER_SUPABASE_CONFIG'))throw new Error('Missing GHADEER_SUPABASE_CONFIG in index.html');
const featureScripts=['dhikr-ticker.js','enhancements.js','jobs-realestate-enhancement.js','member-session.js','neighbor-connect.js','neighborhood-news-ticker.js','outing-events-enhancement.js','pin-recovery.js','production-bridge.js','production-fixes.js','quran-enhancement.js','rental-enhancement.js','runtime-fix.js','services-enhancement.js','ui-final-fix.js','ghadeer-members-public-bridge-v1.js','app.js','ghadeer-service-registry-v1.js','ghadeer-ui-v5.js','ghadeer-football-v2.js','ghadeer-football-bridge.js','ghadeer-final-labels.js','ghadeer-click-fix-v1.js','ghadeer-home-customizer-v1.js','ghadeer-home-widgets-v2.js','ghadeer-navigation-fix-v1.js','ghadeer-services-v6.js','ghadeer-service-entry-map-v1.js','ghadeer-service-route-map-v1.js','ghadeer-service-route-bridge-v1.js','ghadeer-service-registry-adapter-v1.js','ghadeer-service-audit-v1.js','service-routes.js','service-route-adapter.js','service-pages.js','quran2/index.js','ghadeer-final-ui-v6.js'];
const excludedFromProduction=new Set(['ghadeer-quran-v5.js','ghadeer-football-v1.js']);
function referencedScripts(){return new Set([...deployIndex.matchAll(/<script[^>]+src=[\"']([^\"']+)[\"'][^>]*>/gi)].map(m=>String(m[1]).split(/[?#]/,1)[0].replace(/^\.\//,'')))}
function injectIfPresent(scriptName){const filePath=path.join(root,scriptName);if(!fs.existsSync(filePath))return;const refs=referencedScripts();if(refs.has(scriptName.replace(/^\.\//,'')))return;const marker=/<script[^>]+src=[\"']runtime-hardening\.js(?:\?[^\"']*)?[\"'][^>]*><\/script>/i;const match=deployIndex.match(marker);if(match)deployIndex=deployIndex.replace(match[0],`${match[0]}<script src=\"${scriptName}\"></script>`);else deployIndex=deployIndex.replace(/<\/body>/i,`<script src=\"${scriptName}\"></script></body>`)}
for(const script of featureScripts)injectIfPresent(script);
fs.rmSync(dist,{recursive:true,force:true});fs.mkdirSync(dist,{recursive:true});fs.writeFileSync(path.join(dist,'index.html'),deployIndex,'utf8');
function copyTree(src,dst){fs.mkdirSync(dst,{recursive:true});for(const entry of fs.readdirSync(src,{withFileTypes:true})){const s=path.join(src,entry.name),d=path.join(dst,entry.name);if(entry.isDirectory())copyTree(s,d);else if(/\.(?:js|css|html|json|txt|md)$/i.test(entry.name)||entry.name==='_redirects')fs.copyFileSync(s,d)}}
const referencedRootAssets=new Set();
for(const match of deployIndex.matchAll(/<(?:script[^>]+src|link[^>]+href)=[\"']([^\"']+)[\"']/gi)){
  const asset=String(match[1]).split(/[?#]/,1)[0];
  if(!asset||asset.startsWith('/')||asset.includes('://'))continue;
  const relative=asset.replace(/^\.\//,'');
  if(relative.includes('/'))continue;
  if(excludedFromProduction.has(relative))continue;
  const filePath=path.join(root,relative);
  if(fs.existsSync(filePath)&&fs.statSync(filePath).isFile())referencedRootAssets.add(relative);
}
for(const script of featureScripts){if(script.includes('/'))continue;if(excludedFromProduction.has(script))continue;const filePath=path.join(root,script);if(fs.existsSync(filePath)&&fs.statSync(filePath).isFile())referencedRootAssets.add(script)}
for(const asset of referencedRootAssets)fs.copyFileSync(path.join(root,asset),path.join(dist,asset));
if(fs.existsSync(path.join(root,'quran2')))copyTree(path.join(root,'quran2'),path.join(dist,'quran2'));
console.log(`Ghadeer production artifact generated successfully: ${dist}`);
console.log(`Root production assets copied: ${[...referencedRootAssets].sort().join(', ')}`);