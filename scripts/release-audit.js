const fs=require('fs');
const path=require('path');
const errors=[];const warnings=[];
const root=process.cwd();
const build=fs.readFileSync(path.join(root,'build.js'),'utf8');
const service=fs.readFileSync(path.join(root,'ghadeer-services-v6.js'),'utf8');
const adapter=fs.readFileSync(path.join(root,'ghadeer-service-registry-adapter-v1.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');

// 1) Every script explicitly required by build.js must exist.
const buildScripts=[...build.matchAll(/const featureScripts=\[([\s\S]*?)\];/g)].flatMap(m=>[...m[1].matchAll(/["']([^"']+\.js)["']/g)].map(m=>m[1]));
for(const f of buildScripts) if(!fs.existsSync(path.join(root,f))) errors.push(`missing build file: ${f}`);

// 2) Local script references in index.html must exist (remote CDN assets are ignored).
for(const m of index.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)){
 const f=m[1].split('?')[0];
 if(/^(https?:)?\/\//.test(f)) continue;
 if(!fs.existsSync(path.join(root,f))) errors.push(`missing HTML script: ${f}`);
}

// 3) Detect duplicate static HTML ids.
const ids=[...index.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]);
const idCounts=new Map();for(const id of ids)idCounts.set(id,(idCounts.get(id)||0)+1);
for(const [id,n] of idCounts)if(n>1)errors.push(`duplicate HTML id: ${id} (${n})`);

// 4) Extract catalog service records and detect duplicate normalized names.
const records=[];const recRe=/\[\s*['"]([^'"]*)['"]\s*,\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]*)['"]\s*,\s*['"]([^'"]+)['"]\s*\]/g;let m;
while((m=recRe.exec(service)))records.push({icon:m[1],name:m[2],description:m[3],category:m[4]});
const normalize=s=>String(s).replace(/[\sـ]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').toLowerCase();
const names=new Map();for(const r of records){const k=normalize(r.name);if(names.has(k))errors.push(`duplicate service name: ${r.name} / ${names.get(k)}`);else names.set(k,r.name)}

// 5) Registry adapter must provide one entry and owner page for every catalog item.
if(!/R\.register\(\{serviceKey,name:x\.name/.test(adapter))errors.push('registry adapter does not register catalog services');
if(!/entry:'GhadeerServicesV6'/.test(adapter))errors.push('registry entry contract missing');
if(!/ownerPage:'services'/.test(adapter))errors.push('registry owner page contract missing');

// 6) Every catalog item currently resolves through the canonical services page.
// This is valid only as a single service renderer keyed by serviceKey; flag it for review,
// not as a failure, so independent ownership can be upgraded without breaking old links.
if(records.length && !/ownerPage:'services'/.test(adapter))warnings.push('catalog route ownership could not be verified');

const report={generatedAt:new Date().toISOString(),catalogCount:records.length,buildScriptCount:buildScripts.length,errors,warnings};
fs.writeFileSync(path.join(root,'RELEASE_AUDIT_REPORT.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(errors.length)process.exit(1);
