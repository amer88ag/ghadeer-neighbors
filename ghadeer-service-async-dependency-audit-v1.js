/* Ghadeer Service Async Dependency Audit v1 — conservative audit only.
 * Detects explicit timer/worker/storage-listener metadata when exposed at runtime.
 * No timers, listeners, workers, storage handlers, or behavior are changed.
 */
(()=>{'use strict';
function run(){
 const manifest=window.GhadeerServiceManifest;
 if(!manifest)return {ok:false,reason:'service-manifest-unavailable'};
 const sources=[
  ['timers',window.GhadeerServiceTimers],
  ['workers',window.GhadeerServiceWorkers],
  ['storageListeners',window.GhadeerServiceStorageListeners],
  ['asyncCallbacks',window.GhadeerServiceAsyncCallbacks]
 ];
 const rows=manifest.services.map(s=>{
  const key=String(s.serviceKey||'').trim(); const evidence={}; let count=0;
  for(const [kind,list] of sources){const items=Array.isArray(list)?list:[]; const hits=items.filter(x=>String(x?.serviceKey||x?.ownerServiceKey||'').trim()===key || ((x?.services||[]).map(String).includes(key))); evidence[kind]=hits.length; count+=hits.length;}
  return Object.freeze({serviceKey:key,evidence,asyncDependencyCount:count,status:count?'EVIDENCE':'UNVERIFIED'});
 });
 const result=Object.freeze({ok:true,total:rows.length,evidence:rows.filter(r=>r.status==='EVIDENCE').length,unverified:rows.filter(r=>r.status==='UNVERIFIED').length,rows,generatedAt:new Date().toISOString()});
 window.GhadeerServiceAsyncDependencyAudit=result;return result;
}
window.GhadeerBuildServiceAsyncDependencyAudit=run;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
})();
