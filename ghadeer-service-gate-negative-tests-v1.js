/* Ghadeer Service Gate Negative Tests v1 — non-mutating.
 * Deliberately tests incomplete evidence in memory only; production metadata is never modified.
 */
(()=>{'use strict';
function validCandidate(){return {serviceKey:'__test__',route:'/test',owner:'test-owner',actionCount:1,backendCount:1,decision:'CANDIDATE',risk:'SAFE'};}
function gate(r){const complete=Boolean(r&&r.route&&r.owner&&r.actionCount>0&&r.backendCount>0&&r.risk==='SAFE');return r?.decision==='CANDIDATE'&&complete?'ALLOW_REFACTOR_REVIEW':'HOLD';}
function run(){
 const base=validCandidate();
 const cases=[
  ['route-missing',{...base,route:''},'HOLD'],
  ['owner-missing',{...base,owner:''},'HOLD'],
  ['action-missing',{...base,actionCount:0},'HOLD'],
  ['backend-missing',{...base,backendCount:0},'HOLD'],
  ['risk-unsafe',{...base,risk:'REVIEW'},'HOLD'],
  ['candidate-complete',base,'ALLOW_REFACTOR_REVIEW']
 ];
 const checks=cases.map(([name,input,expected])=>Object.freeze({name,expected,actual:gate(input),pass:gate(input)===expected}));
 const result=Object.freeze({ok:checks.every(x=>x.pass),checks,mutationExecuted:false,source:'in-memory-only',generatedAt:new Date().toISOString()});
 window.GhadeerServiceGateNegativeTests=result;return result;
}
window.GhadeerBuildServiceGateNegativeTests=run;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
})();
