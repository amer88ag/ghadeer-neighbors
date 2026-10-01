/* Ghadeer Service Backend API Audit v1 — audit only.
 * Compares service public API declarations with backend-contract metadata.
 * Unknown or missing evidence is REVIEW. No RPCs, routes, DB objects, or permissions are changed.
 */
(()=>{'use strict';
function run(){
 const apis=Array.isArray(window.GhadeerServicePublicAPIs)?window.GhadeerServicePublicAPIs:[];
 const contracts=window.GhadeerServiceBackendContract;
 if(!apis.length||!contracts)return {ok:false,reason:'public-api-or-backend-contract-unavailable'};
 const contractRows=Array.isArray(contracts.rows)?contracts.rows:[];
 const rows=apis.map(api=>{
   const key=String(api.serviceKey||'').trim();
   const c=contractRows.find(x=>String(x.serviceKey||'')===key);
   const declared=Array.isArray(api.backend)?api.backend.filter(Boolean):[];
   const actual=Array.isArray(c?.rpcNames)?c.rpcNames.filter(Boolean):Array.isArray(c?.rpcKeys)?c.rpcKeys.filter(Boolean):[];
   const missing=declared.filter(x=>!actual.includes(x));
   const status=!c?'REVIEW':missing.length?'REVIEW':'EVIDENCE';
   return Object.freeze({serviceKey:key,declaredBackend:declared,contractBackend:actual,missing,status});
 });
 const result=Object.freeze({ok:true,total:rows.length,evidence:rows.filter(r=>r.status==='EVIDENCE').length,review:rows.filter(r=>r.status==='REVIEW').length,rows,generatedAt:new Date().toISOString()});
 window.GhadeerServiceBackendAPIAudit=result;return result;
}
window.GhadeerBuildServiceBackendAPIAudit=run;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
})();
