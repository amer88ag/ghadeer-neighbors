/* Ghadeer Service Boundary v1 — declarative boundary only.
 * Defines the canonical public surface of each service from existing manifest data.
 * It does not move, delete, or rewrite implementation code.
 */
(()=>{'use strict';
function run(){
 const manifest=window.GhadeerServiceManifest;
 const matrix=window.GhadeerServiceDependencyRiskMatrix;
 if(!manifest||!matrix)return {ok:false,reason:'manifest-or-risk-matrix-unavailable'};
 const rows=manifest.services.map(s=>{
   const risk=matrix.rows.find(r=>r.serviceKey===s.serviceKey);
   const boundary=Object.freeze({
     serviceKey:s.serviceKey,
     route:s.route||'',
     entry:s.entry||'',
     ownerPage:s.ownerPage||'',
     publicSurface:Object.freeze({route:s.route||'',entry:s.entry||''}),
     mutationPolicy:risk?.risk==='BLOCKED'?'LOCKED':risk?.risk==='REVIEW'?'REVIEW':'ISOLATED',
     risk:risk?.risk||'REVIEW'
   });
   return boundary;
 });
 const result=Object.freeze({ok:true,total:rows.length,isolated:rows.filter(r=>r.mutationPolicy==='ISOLATED').length,review:rows.filter(r=>r.mutationPolicy==='REVIEW').length,locked:rows.filter(r=>r.mutationPolicy==='LOCKED').length,rows,generatedAt:new Date().toISOString()});
 window.GhadeerServiceBoundaries=result;return result;
}
window.GhadeerBuildServiceBoundaries=run;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
})();
