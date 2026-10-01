/* Ghadeer Service Manifest v1 — canonical, read-only service metadata.
 * The manifest validates identity and ownership; it does not mutate existing UI.
 */
(()=>{'use strict';
function run(){
 const registry=window.GhadeerServiceRegistry;
 const routes=window.GhadeerServiceRoutes;
 if(!registry||!routes)return {ok:false,reason:'registry-or-routes-unavailable'};
 const services=Array.isArray(registry.services)?registry.services:[];
 const manifest=[];const errors=[];const seen=new Set();
 for(const s of services){
   const key=String(s.serviceKey||'').trim();
   const route=routes[key]||routes[ String(s.name||'').trim().toLowerCase().replace(/\s+/g,'-') ];
   if(!key){errors.push({type:'missing-service-key',name:s.name||null});continue}
   if(seen.has(key)){errors.push({type:'duplicate-service-key',serviceKey:key});continue}
   seen.add(key);
   manifest.push(Object.freeze({serviceKey:key,name:s.name||'',description:s.description||'',icon:s.icon||'',route:route||'',entry:s.entry||'',ownerPage:s.ownerPage||'',lifecycle:s.lifecycle||'stable'}));
 }
 const result=Object.freeze({ok:errors.length===0,total:manifest.length,errors,services:Object.freeze(manifest),generatedAt:new Date().toISOString()});
 window.GhadeerServiceManifest=result;return result;
}
window.GhadeerBuildServiceManifest=run;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
})();
