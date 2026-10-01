/* Ghadeer Service Refactor Plan v1 — reversible planning gate.
 * No files, routes, RPCs, data, permissions, or services are modified.
 */
(()=>{'use strict';
function run(){
 const pre=window.GhadeerServicePreflight;
 const map=window.GhadeerServiceExecutionMap;
 if(!pre||!map)return {ok:false,reason:'preflight-or-execution-map-unavailable'};
 const rows=(pre.rows||[]).map(p=>{
  const m=(map.rows||[]).find(x=>x.serviceKey===p.serviceKey);
  const steps=p.decision==='ALLOW_REFACTOR_REVIEW'?["snapshot-current-boundary","verify-route-and-public-api","verify-ui-actions","verify-backend-contract","prepare-isolated-adapter","run-static-regression","run-runtime-smoke","compare-before-after","rollback-if-any-failure"]:["resolve-hold-reason","re-run-preflight"];
  return Object.freeze({serviceKey:p.serviceKey,decision:p.decision,risk:p.risk,steps,rollbackRequired:true,mutationsAllowed:false,route:m?.route||p.route||''});
 });
 const result=Object.freeze({ok:true,total:rows.length,candidates:rows.filter(x=>x.decision==='ALLOW_REFACTOR_REVIEW').length,holds:rows.filter(x=>x.decision==='HOLD').length,rows,generatedAt:new Date().toISOString()});
 window.GhadeerServiceRefactorPlan=result;return result;
}
window.GhadeerBuildServiceRefactorPlan=run;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
})();
