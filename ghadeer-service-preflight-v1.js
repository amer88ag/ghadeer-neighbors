/* Ghadeer Service Preflight v1 — non-mutating gate before first service refactor.
 * Fails closed: a service is eligible only when its execution/readiness evidence is present and consistent.
 */
(()=>{'use strict';
function run(){
 const readiness=window.GhadeerServiceExecutionReadiness;
 const map=window.GhadeerServiceExecutionMap;
 if(!readiness||!map)return {ok:false,reason:'execution-readiness-or-map-unavailable'};
 const rows=(readiness.rows||[]).map(r=>{
  const m=(map.rows||[]).find(x=>x.serviceKey===r.serviceKey);
  const complete=Boolean(m&&r.route&&r.owner&&r.actionCount>=0&&r.backendCount>=0);
  const decision=r.decision==='CANDIDATE'&&complete?'ALLOW_REFACTOR_REVIEW':'HOLD';
  return Object.freeze({serviceKey:r.serviceKey,decision,risk:r.risk,route:r.route,owner:r.owner,actionCount:r.actionCount,backendCount:r.backendCount});
 });
 const result=Object.freeze({ok:true,allowReview:rows.filter(x=>x.decision==='ALLOW_REFACTOR_REVIEW').length,hold:rows.filter(x=>x.decision==='HOLD').length,rows,generatedAt:new Date().toISOString()});
 window.GhadeerServicePreflight=result;return result;
}
window.GhadeerBuildServicePreflight=run;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
})();
