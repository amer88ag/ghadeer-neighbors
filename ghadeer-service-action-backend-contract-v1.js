/* Ghadeer Action→Backend Contract v2 — audit only, fail-closed.
 * Navigation-only actions do not require a backend. Service/mutation actions do,
 * and the backend must be explicitly declared by data-backend/data-rpc/data-handler.
 */
(()=>{'use strict';
 const norm=v=>String(v??'').trim();
 function run(){
  const actionMap=window.GhadeerServiceActionMap;
  const classification=window.GhadeerServiceActionClassification;
  const base={ok:false,releaseAuthorized:false,mutationExecuted:false,generatedAt:new Date().toISOString()};
  if(!actionMap||!classification)return window.GhadeerServiceActionBackendContract=Object.freeze({...base,reason:'action-audit-input-unavailable'});
  const rows=Array.isArray(actionMap.rows)?actionMap.rows:[];
  const classified=Array.isArray(classification.rows)?classification.rows:[];
  const needsBackend=new Set(['service','mutation']);
  const missing=classified.filter(a=>needsBackend.has(a.category)&&!norm(a.backend)&&!norm(a.rpc)&&!norm(a.handler));
  const duplicates=Array.isArray(actionMap.duplicateActionGroups)?actionMap.duplicateActionGroups:[];
  const ok=rows.length>0&&missing.length===0&&duplicates.length===0;
  return window.GhadeerServiceActionBackendContract=Object.freeze({...base,ok,releaseAuthorized:ok,totalActions:rows.length,backendRequired:classified.filter(a=>needsBackend.has(a.category)).length,missingBackend:missing.map(a=>({serviceKey:a.serviceKey||'',actionKey:a.actionKey||'',category:a.category})),duplicateActionGroups:duplicates.length,reason:ok?'PASS':'HOLD'});
 }
 window.GhadeerBuildServiceActionBackendContract=run;
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,350),{once:true});else setTimeout(run,350);
})();
