/* Ghadeer Service Refactor Transaction Gate v1 — non-mutating.
 * Requires the existing before/after/rollback record to remain untouched before any future refactor transaction.
 * This gate never performs the transaction itself.
 */
(()=>{'use strict';
function run(){
 const record=window.GhadeerServiceBeforeAfterRollback;
 const plan=window.GhadeerServiceRefactorPlan;
 if(!record||!plan)return {ok:false,reason:'before-after-record-or-refactor-plan-unavailable'};
 const rows=(record.rows||[]).map(r=>Object.freeze({serviceKey:r.serviceKey,transaction:'LOCKED',precondition:r.status==='NOT_EXECUTED'&&r.rollback?.required===true,rollback:r.rollback,decision:r.decision==='ALLOW_REFACTOR_REVIEW'?'READY_FOR_CONTROLLED_TRANSACTION':'HOLD'}));
 const result=Object.freeze({ok:true,total:rows.length,ready:rows.filter(x=>x.decision==='READY_FOR_CONTROLLED_TRANSACTION').length,hold:rows.filter(x=>x.decision==='HOLD').length,rows,mutationExecuted:false,generatedAt:new Date().toISOString()});
 window.GhadeerServiceRefactorTransactionGate=result;return result;
}
window.GhadeerBuildServiceRefactorTransactionGate=run;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
})();
