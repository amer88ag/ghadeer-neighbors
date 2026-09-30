const fs = require('fs');
const path = require('path');
const root = process.cwd();
const indexPath = path.join(root, 'index.html');
const sourceIndex = fs.readFileSync(indexPath, 'utf8');
let deployIndex = sourceIndex;
const requiredScripts = [
  'app.js','enhancements.js','quran-enhancement.js','runtime-fix.js','services-enhancement.js','rental-enhancement.js','neighbor-connect.js','outing-events-enhancement.js','production-fixes.js','production-bridge.js','jobs-realestate-enhancement.js','ui-final-fix.js','pin-recovery.js','member-session.js','neighborhood-news-ticker.js','runtime-hardening.js','ghadeer-ui-v4.js','ghadeer-ui-v5.js','ghadeer-quran-v5.js','ghadeer-football-v1.js','ghadeer-football-bridge.js','ghadeer-final-labels.js'
];
if (!sourceIndex.includes('GHADEER_SUPABASE_CONFIG')) throw new Error('Missing GHADEER_SUPABASE_CONFIG in index.html');
for (const script of requiredScripts) if (!fs.existsSync(path.join(root, script))) throw new Error(`Missing frontend script file: ${script}`);
const localScripts=[...sourceIndex.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map(m=>m[1].split('?')[0]).filter(src=>src&&!/^(https?:)?\/\//.test(src));
for(const src of localScripts) if(!fs.existsSync(path.join(root,src))) throw new Error(`Missing local script file referenced by index.html: ${src}`);
const scriptTags=[...sourceIndex.matchAll(/<script[^>]+src=["']([^"']+)["'][^>]*><\/script>/g)].map(m=>m[1].split('?')[0]);
const counts=new Map();for(const src of scriptTags)counts.set(src,(counts.get(src)||0)+1);
const duplicates=[...counts.entries()].filter(([,count])=>count>1).map(([src])=>src);if(duplicates.length)throw new Error(`Duplicate frontend script references: ${duplicates.join(', ')}`);
function injectAfterRuntime(tag){if(!deployIndex.includes(`src="${tag}"`)){const p=/<script[^>]+src=["']runtime-hardening\.js(?:\?[^"']*)?["'][^>]*><\/script>/i;const m=deployIndex.match(p);if(!m)throw new Error('Could not locate runtime-hardening.js script tag');deployIndex=deployIndex.replace(m[0],m[0]+`<script src="${tag}"></script>`);}}
if(!deployIndex.includes('runtime-hardening.js')){const p=/<script[^>]+src=["']app\.js(?:\?[^"']*)?["'][^>]*><\/script>/i;const m=deployIndex.match(p);if(!m)throw new Error('Could not locate app.js script tag');deployIndex=deployIndex.replace(m[0],'<script src="runtime-hardening.js"></script>'+m[0]);}
['ghadeer-ui-v5.js','ghadeer-quran-v5.js','ghadeer-football-v1.js','ghadeer-football-bridge.js','ghadeer-final-labels.js'].forEach(injectAfterRuntime);
const dist=path.join(root,'dist');fs.rmSync(dist,{recursive:true,force:true});fs.mkdirSync(dist,{recursive:true});fs.writeFileSync(path.join(dist,'index.html'),deployIndex,'utf8');
for(const entry of fs.readdirSync(root,{withFileTypes:true})){
 if(!entry.isFile()||entry.name==='build.js'||entry.name==='worker.js'||/^\u2060/.test(entry.name))continue;
 if(!/\.(?:js|css)$/i.test(entry.name)&&entry.name!=='_redirects')continue;
 fs.copyFileSync(path.join(root,entry.name),path.join(dist,entry.name));
}
if(process.env.VERCEL==='1')fs.writeFileSync(indexPath,deployIndex,'utf8');
console.log(`Ghadeer production artifact generated in ${dist}.`);console.log('Ghadeer production build validation passed.');
