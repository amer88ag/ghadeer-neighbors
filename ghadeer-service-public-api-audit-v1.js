/* Ghadeer Service Public API Audit v1 — audit only.
 * Matches declared service public APIs against existing action-map metadata.
 * Missing evidence is REVIEW; no implementation is changed.
 */
(()=>{'use strict';
function run(){
 const manifest=window.GhadeerServiceManifest;
 const boundaries=window.GhadeerServiceBoundaries;
 const actions=window.GhadeerServiceActionMap;
 if(!manifest||!boundaries||!actions)return {ok:false,reason:'manifest-boundary-action-map-unavailable'};
 const actionRows=Array.isArray(actions.rows)?actions.rows:[];
 const rows=boundaries.rows.map(b=>{
   const a=actionRows.find(x=>String(x.serviceKey||'')===String(b.serviceKey));
   const declared=Array.isArray(a?.actions)?a.actions.filter(Boolean):[];
   const api=window.GhadeerServicePublicAPIs?.find?.(x=>x.serviceKey===b.serviceKey);
   const apiActions=Array.isArray(api?.actions)?api.actions.filter(Boolean):[];
   const missing=declared.filter(x=>!apiActions.includes(x));
   const status=missing.length?'REVIEW':'EVIDENCE';
   return Object.freeze({serviceKey:b.serviceKey,declaredActions:declared,publicApiActions:apiActions,missingActions:missing,status});
 });
 const result=Object.freeze({ok:true,total:rows.length,evidence:rows.filter(r=>r.status==='EVIDENCE').length,review:rows.filter(r=>r.status==='REVIEW').length,rows,generatedAt:new Date().toISOString()});
 window.GhadeerServicePublicAPIAudit=result;return result;
}
window.GhadeerBuildServicePublicAPIAudit=run;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
})();
