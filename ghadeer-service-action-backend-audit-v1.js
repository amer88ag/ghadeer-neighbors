/* Ghadeer Service Action Backend Audit v1 — audit only.
 * Compares UI/service action metadata with backend contract evidence.
 * Missing evidence is REVIEW. No handlers, RPCs, routes, DB objects, or permissions are changed.
 */
(()=>{'use strict';
function run(){
 const actionMap=window.GhadeerServiceActionMap;
 const backend=window.GhadeerServiceBackendContract;
 const uiAudit=window.GhadeerServiceUIActionAudit;
 if(!actionMap||!backend||!uiAudit)return {ok:false,reason:'action-backend-ui-audit-unavailable'};
 const actionRows=Array.isArray(actionMap.rows)?actionMap.rows:[];
 const contractRows=Array.isArray(backend.rows)?backend.rows:[];
 const rows=uiAudit.rows.map(r=>{
  const declared=actionRows.filter(x=>String(x.serviceKey||'')===String(r.serviceKey)).flatMap(x=>Array.isArray(x.actions)?x.actions:[]).filter(Boolean);
  const c=contractRows.find(x=>String(x.serviceKey||'')===String(r.serviceKey));
  const rpc=Array.isArray(c?.rpcNames)?c.rpcNames:Array.isArray(c?.rpcKeys)?c.rpcKeys:[];
  const hasBackend=rpc.length>0 || Boolean(c);
  const status=hasBackend?'EVIDENCE':'REVIEW';
  return Object.freeze({serviceKey:r.serviceKey,actions:[...new Set(declared)],backendEvidence:rpc,status});
 });
 const result=Object.freeze({ok:true,total:rows.length,evidence:rows.filter(r=>r.status==='EVIDENCE').length,review:rows.filter(r=>r.status==='REVIEW').length,rows,generatedAt:new Date().toISOString()});
 window.GhadeerServiceActionBackendAudit=result;return result;
}
window.GhadeerBuildServiceActionBackendAudit=run;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
})();
