/* Ghadeer Backend Declaration Audit v1 — audit only, fail-closed. */
(()=>{'use strict';
 const norm=v=>String(v??'').trim();
 function run(){
  const map=window.GhadeerServiceActionMap;
  const backend=window.GhadeerServiceBackendIntegrationAudit;
  const base={ok:false,releaseAuthorized:false,mutationExecuted:false,generatedAt:new Date().toISOString()};
  if(!map)return window.GhadeerServiceBackendDeclarationAudit=Object.freeze({...base,reason:'action-map-unavailable'});
  const rows=Array.isArray(map.rows)?map.rows:[];
  const serviceRows=rows.filter(r=>norm(r.serviceKey));
  const missing=serviceRows.filter(r=>!norm(r.backend)&&!norm(r.rpc)&&!norm(r.handler));
  const backendPossible=backend?.rows||[];
  const backendUnverified=backendPossible.filter(r=>r.backendStatus==='UNVERIFIED');
  const ok=serviceRows.length>0&&missing.length===0&&backend?.ok===true&&backendUnverified.length===0;
  return window.GhadeerServiceBackendDeclarationAudit=Object.freeze({...base,ok,releaseAuthorized:ok,totalServiceActions:serviceRows.length,missingDeclarations:missing.map(r=>({serviceKey:r.serviceKey,actionKey:r.actionKey})),unverifiedServices:backendUnverified.map(r=>r.serviceKey),reason:ok?'PASS':'HOLD'});
 }
 window.GhadeerBuildServiceBackendDeclarationAudit=run;
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,350),{once:true});else setTimeout(run,350);
})();
