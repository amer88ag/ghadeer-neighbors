/* Ghadeer Service Refactor Plan v1 — plan only.
 * Converts the dependency risk matrix into explicit next actions.
 * No files, routes, RPCs, data, permissions, or services are modified.
 */
(()=>{'use strict';
function run(){
 const matrix=window.GhadeerServiceDependencyRiskMatrix;
 const manifest=window.GhadeerServiceManifest;
 if(!matrix||!manifest)return {ok:false,reason:'risk-matrix-or-manifest-unavailable'};
 const rows=matrix.rows.map(r=>{
   const action=r.risk==='SAFE'?'PREPARE_ISOLATED_REFACTOR':r.risk==='REVIEW'?'MAP_UNRESOLVED_DEPENDENCIES':'DO_NOT_TOUCH';
   return Object.freeze({serviceKey:r.serviceKey,risk:r.risk,blockers:r.blockers,reviews:r.reviews,nextAction:action});
 });
 const result=Object.freeze({ok:true,total:rows.length,prepare:rows.filter(r=>r.nextAction==='PREPARE_ISOLATED_REFACTOR').length,review:rows.filter(r=>r.nextAction==='MAP_UNRESOLVED_DEPENDENCIES').length,blocked:rows.filter(r=>r.nextAction==='DO_NOT_TOUCH').length,rows,generatedAt:new Date().toISOString()});
 window.GhadeerServiceRefactorPlan=result;return result;
}
window.GhadeerBuildServiceRefactorPlan=run;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
})();
