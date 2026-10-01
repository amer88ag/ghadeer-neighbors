const fs=require('fs');const path=require('path');
const root=process.cwd();
const required=['index.html','build.js','package.json','ghadeer-service-registry-v1.js','ghadeer-services-v6.js','ghadeer-service-route-map-v1.js','ghadeer-service-route-bridge-v1.js','ghadeer-service-registry-adapter-v1.js','ghadeer-service-audit-v1.js'];
const errors=[];for(const f of required)if(!fs.existsSync(path.join(root,f)))errors.push(`MISSING:${f}`);
for(const f of fs.readdirSync(root).filter(f=>f.endsWith('.js'))){const s=fs.readFileSync(path.join(root,f),'utf8');if(/<<<<<<<|=======|>>>>>>>/.test(s))errors.push(`CONFLICT:${f}`);}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');if(!html.includes('GHADEER_SUPABASE_CONFIG'))errors.push('MISSING:GHADEER_SUPABASE_CONFIG');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));if(pkg.scripts?.build!=='node build.js')errors.push('INVALID:build script');
if(errors.length){console.error(errors.join('\n'));process.exit(1)}console.log(JSON.stringify({ok:true,requiredFiles:required.length},null,2));
