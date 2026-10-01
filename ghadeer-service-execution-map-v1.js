/* Ghadeer Service Execution Map v1 — audit/metadata only.
 * Builds one canonical execution map per service from existing metadata.
 * Does not move, delete, rename, or alter runtime handlers.
 */
(()=>{'use strict';
function run(){
 const manifest=window.GhadeerServiceManifest;
 const boundaries=window.GhadeerServiceBoundaries;
 const apis=Array.isArray(window.GhadeerServicePublicAPIs)?window.GhadeerServicePublicAPIs:[];
 const routes=window.GhadeerServiceRouteMap;
 const actions=window.GhadeerServiceActionMap;
 const backend=window.GhadeerServiceBackendContract;
 const risk=window.GhadeerServiceDependencyRiskMatrix;
 if(!manifest||!boundaries||!routes||!actions||!backend||!risk)return {ok:false,reason:'execution-map-input-unavailable'};
 const rows=manifest.services.map(s=>{
  const key=String(s.serviceKey||'');
  const b=boundaries.rows?.find(x=>x.serviceKey===key);
  const a=apis.find(x=>x.serviceKey===key);
  const r=routes.rows?.find(x=>x.serviceKey===key);
  const ac=actions.rows?.filter(x=>x.serviceKey===key).flatMap(x=>x.actions||[]).filter(Boolean)||[];
  const be=backend.rows?.find(x=>x.serviceKey===key);
  const rr=risk.rows?.find(x=>x.serviceKey===key);
  return Object.freeze({serviceKey:key,route:a?.route||r?.route||b?.route||'',entry:b?.entry||'',owner:b?.owner||'',publicSurface:a?.surface||a?.exports||[],actions:[...new Set(ac)],backend:be?.rpcNames||be?.rpcKeys||[],risk:rr?.risk||'REVIEW',ready:rr?.risk==='SAFE'});
 });
 const result=Object.freeze({ok:true,total:rows.length,ready:rows.filter(x=>x.ready).length,review:rows.filter(x=>!x.ready).length,rows,generatedAt:new Date().toISOString()});
 window.GhadeerServiceExecutionMap=result;return result;
}
window.GhadeerBuildServiceExecutionMap=run;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
})();
