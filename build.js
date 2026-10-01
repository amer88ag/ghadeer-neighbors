const fs=require('fs');
const path=require('path');
const root=process.cwd();
const indexPath=path.join(root,'index.html');
const dist=path.join(root,'dist');
if(!fs.existsSync(indexPath))throw new Error('Missing index.html');
let deployIndex=fs.readFileSync(indexPath,'utf8');
if(!deployIndex.includes('GHADEER_SUPABASE_CONFIG'))throw new Error('Missing GHADEER_SUPABASE_CONFIG in index.html');
// Canonical pipeline: registry -> feature modules -> canonical route map -> non-overwriting bridge -> registry adapter -> contract/audit.
const featureScripts=['ghadeer-service-registry-v1.js','ghadeer-ui-v5.js','ghadeer-quran-v5.js','ghadeer-football-v1.js','ghadeer-football-v2.js','ghadeer-football-bridge.js','ghadeer-final-labels.js','ghadeer-click-fix-v1.js','ghadeer-home-customizer-v1.js','ghadeer-home-widgets-v2.js','ghadeer-navigation-fix-v1.js','ghadeer-services-v6.js','ghadeer-service-route-map-v1.js','ghadeer-service-route-bridge-v2.js','ghadeer-service-registry-adapter-v1.js','ghadeer-service-contract-v1.js','ghadeer-service-audit-v1.js'];
function injectIfPresent(scriptName){const filePath=path.join(root,scriptName);if(!fs.existsSync(filePath)||deployIndex.includes(`src="${scriptName}"`))return;const marker=/<script[^>]+src=["']runtime-hardening\.js(?:\?[^"']*)?["'][^>]*><\/script>/i;const match=deployIndex.match(marker);if(match)deployIndex=deployIndex.replace(match[0],`${match[0]}<script src="${scriptName}"></script>`);else deployIndex=deployIndex.replace(/<\/body>/i,`<script src="${scriptName}"></script></body>`)}
for(const script of featureScripts)injectIfPresent(script);
fs.rmSync(dist,{recursive:true,force:true});fs.mkdirSync(dist,{recursive:true});fs.writeFileSync(path.join(dist,'index.html'),deployIndex,'utf8');
for(const entry of fs.readdirSync(root,{withFileTypes:true})){if(!entry.isFile())continue;if(entry.name==='build.js'||entry.name==='worker.js')continue;if(!/\.(?:js|css)$/i.test(entry.name)&&entry.name!=='_redirects')continue;fs.copyFileSync(path.join(root,entry.name),path.join(dist,entry.name));}
console.log(`Ghadeer production artifact generated successfully: ${dist}`);