/* Ghadeer Service Gate Self-Test v1 — non-mutating.
 * Validates that readiness/preflight/transaction gates fail closed on incomplete evidence.
 */
(()=>{'use strict';
function run(){
 const readiness=window.GhadeerServiceExecutionReadiness;
 const preflight=window.GhadeerServicePreflight;
 const transaction=window.GhadeerServiceRefactorTransactionGate;
 const checks=[];
 checks.push({name:'readiness-present',pass:Boolean(readiness&&Array.isArray(readiness.rows))});
 checks.push({name:'preflight-present',pass:Boolean(preflight&&Array.isArray(preflight.rows))});
 checks.push({name:'transaction-present',pass:Boolean(transaction&&Array.isArray(transaction.rows))});
 checks.push({name:'transaction-non-mutating',pass:Boolean(transaction&&transaction.mutationExecuted===false)});
 checks.push({name:'rollback-required',pass:Boolean(transaction&&transaction.rows.every(x=>x.rollback&&x.rollback.required===true))});
 checks.push({name:'preflight-fail-closed',pass:Boolean(preflight&&preflight.rows.every(x=>x.decision==='HOLD'||x.decision==='ALLOW_REFACTOR_REVIEW'))});
 const pass=checks.every(x=>x.pass);
 const result=Object.freeze({ok:pass,checks,mutationExecuted:false,generatedAt:new Date().toISOString()});
 window.GhadeerServiceGateSelfTest=result;return result;
}
window.GhadeerBuildServiceGateSelfTest=run;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
})();
