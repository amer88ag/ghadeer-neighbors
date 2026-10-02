/* Ghadeer Action→Backend Contract v1 — audit only, fail-closed. */
(()=>{'use strict';
 const norm=v=>String(v??'').trim();
 function run(){
  const actionMap=window.GhadeerServiceActionMap;
  const backendAudit=window.GhadeerServiceBackendIntegrationAudit;
  const base={ok:false,releaseAuthorized:false,mutationExecuted:false,generatedAt:new Date().toISOString()};
  if(!actionMap)return window.GhadeerServiceActionBackendContract=Object.freeze({...base,reason:'action-map-unavailable'});
  const actions=Array.isArray(actionMap.actions)?actionMap.actions:[];
  const missing=actions.filter(a=>!norm(a.serviceKey)||!norm(a.actionKey)||(!norm(a.backend)&&!norm(a.rpc)&&!norm(a.handler)));
  const keys=actions.map(a=>`${norm(a.serviceKey)}:${norm(a.actionKey)}`).filter(Boolean);
  const dup=[...new Set(keys.filter((v,i)=>keys.indexOf(v)!==i))];
  const backendOk=backendAudit?.ok===true;
  const ok=actions.length>0&&missing.length===0&&dup.length===0&&backendOk;
  return window.GhadeerServiceActionBackendContract=Object.freeze({...base,ok,releaseAuthorized:ok,totalActions:actions.length,missingBackend:missing.map(a=>({serviceKey:a.serviceKey||'',actionKey:a.actionKey||''})),duplicateActions:dup,backendAuditOk:backendOk,reason:ok?'PASS':'HOLD'});
 }
 window.GhadeerBuildServiceActionBackendContract=run;
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,300),{once:true});else setTimeout(run,300);
})();
