/* Ghadeer Service Before/After/Rollback Record v1 — non-mutating.
 * Creates a verification record from existing service metadata. No runtime mutation.
 */
(()=>{'use strict';
function run(){
 const plan=window.GhadeerServiceRefactorPlan;
 const map=window.GhadeerServiceExecutionMap;
 if(!plan||!map)return {ok:false,reason:'refactor-plan-or-execution-map-unavailable'};
 const rows=(plan.rows||[]).map(p=>{const m=(map.rows||[]).find(x=>x.serviceKey===p.serviceKey);return Object.freeze({serviceKey:p.serviceKey,decision:p.decision,risk:p.risk,before:{route:m?.route||'',owner:m?.owner||'',actions:[...(m?.actions||[])],backend:[...(m?.backend||[])]},after:{route:m?.route||'',owner:m?.owner||'',actions:[...(m?.actions||[])],backend:[...(m?.backend||[])]},rollback:{required:true,trigger:'any-regression-or-contract-mismatch',strategy:'restore-before-state'},status:'NOT_EXECUTED'});});
 const result=Object.freeze({ok:true,total:rows.length,rows,generatedAt:new Date().toISOString()});window.GhadeerServiceBeforeAfterRollback=result;return result;
}
window.GhadeerBuildServiceBeforeAfterRollback=run;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
})();
