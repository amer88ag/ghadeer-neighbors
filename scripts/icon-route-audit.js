const fs=require('fs');
const path=require('path');
const root=process.cwd();
const build=fs.readFileSync(path.join(root,'build.js'),'utf8');
const routerPath=path.join(root,'ghadeer-icon-route-registry-v1.js');
const router=fs.readFileSync(routerPath,'utf8');
const errors=[];
const specials=new Set(['developer','manager','weather','prayer','logout','football','wardi','spl','uel','world','king','super','ghadeer','read','recite','tajweed','tafsir','adhkar','hifz','marks','download']);
const routePairs=[...router.matchAll(/(\w+):\{label:'[^']*',route:'([^']+)'\}/g)].map(m=>[m[1],m[2]]);
if(!routePairs.length)errors.push('no icon route definitions found');
const routeFile=path.join(root,'service-routes.js');
const routeText=fs.readFileSync(routeFile,'utf8');
for(const [key,route] of routePairs){
  if(!route||!key)errors.push(`invalid route definition: ${key}`);
  if(!specials.has(key) && !new RegExp(`(?:register|routes|set).*['\"]${route}['\"]`).test(routeText) && !new RegExp(`['\"]${route}['\"]`).test(routeText)){
    errors.push(`icon route has no service-route declaration: ${key} -> ${route}`);
  }
}
const scripts=[...build.matchAll(/['\"]([^'\"]+\.js)['\"](?:,|\])/g)].map(m=>m[1]).filter(x=>!x.includes('/'));
const competitors=[];
for(const file of [...new Set(scripts)]){
  const p=path.join(root,file); if(!fs.existsSync(p))continue;
  if(file==='ghadeer-icon-route-registry-v1.js')continue;
  const t=fs.readFileSync(p,'utf8');
  if(/document\.addEventListener\(\s*['\"]click['\"]/.test(t))competitors.push(file);
}
if(competitors.length)errors.push(`competing global document click listeners: ${competitors.join(', ')}`);
if(errors.length){console.error(errors.map(e=>`ICON ROUTE AUDIT: ${e}`).join('\n'));process.exit(1)}
console.log(`Icon route audit PASS: ${routePairs.length} definitions; no competing global document click listener.`);
