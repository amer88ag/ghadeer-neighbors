/* Ghadeer Service Backend Contract v1 — audit/report only.
 * Turns backend evidence into an explicit contract state without changing RPCs,
 * permissions, tables, or data. Unknown items remain REVIEW.
 */
(()=>{'use strict';
function run(){
 const backend=window.GhadeerServiceBackendIntegrationAudit;
 if(!backend)return {ok:false,reason:'backend-integration-audit-unavailable'};
 const rows=backend.rows.map(r=>{
   const status=r.backendStatus==='POSSIBLE'?'REVIEW':'REVIEW';
   return Object.freeze({serviceKey:r.serviceKey,route:r.route,entry:r.entry,ui:r.ui,backendEvidence:r.possibleRuntimeRpcMatches,contractStatus:status,reason:r.backendStatus==='POSSIBLE'?'runtime name match is not proof of correct RPC, permission, or table':'no verified backend evidence'});
 });
 const result=Object.freeze({ok:true,total:rows.length,verified:0,review:rows.length,rows,generatedAt:new Date().toISOString()});
 window.GhadeerServiceBackendContract=result;return result;
}
window.GhadeerBuildServiceBackendContract=run;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
})();
