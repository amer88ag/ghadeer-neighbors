/* Ghadeer Service Public API v1 — declarative contract only.
 * Exposes a stable, read-only description of what each service may publish.
 * No implementation is moved, deleted, or invoked by this audit layer.
 */
(()=>{'use strict';
function run(){
 const boundaries=window.GhadeerServiceBoundaries;
 const manifest=window.GhadeerServiceManifest;
 if(!boundaries||!manifest)return {ok:false,reason:'boundaries-or-manifest-unavailable'};
 const rows=boundaries.rows.map(b=>{
   const s=manifest.services.find(x=>x.serviceKey===b.serviceKey)||{};
   const publicApi=Object.freeze({
     serviceKey:b.serviceKey,
     route:b.route,
     entry:b.entry,
     ownerPage:b.ownerPage,
     exports:Object.freeze([]),
     accepts:Object.freeze([]),
     emits:Object.freeze([]),
     backend:Object.freeze([]),
     status:b.mutationPolicy==='LOCKED'?'LOCKED':b.mutationPolicy==='REVIEW'?'REVIEW':'DECLARATIVE'
   });
   return Object.freeze(publicApi);
 });
 const result=Object.freeze({ok:true,total:rows.length,locked:rows.filter(r=>r.status==='LOCKED').length,review:rows.filter(r=>r.status==='REVIEW').length,rows,generatedAt:new Date().toISOString()});
 window.GhadeerServicePublicAPI=result;return result;
}
window.GhadeerBuildServicePublicAPI=run;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
})();
