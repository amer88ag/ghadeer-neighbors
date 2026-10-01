/* Candidate Certification Self-Test v1 — non-mutating, in-memory only. */
(()=>{'use strict';
function cert(x){return Boolean(x&&x.selected&&x.preflight==='ALLOW_REFACTOR_REVIEW'&&x.route&&x.owner&&x.actionCount>0&&x.backendCount>0&&x.rollbackRequired===true&&x.transactionReady===true);}
function run(){
 const base={selected:'svc-test',preflight:'ALLOW_REFACTOR_REVIEW',route:'/test',owner:'owner',actionCount:1,backendCount:1,rollbackRequired:true,transactionReady:true};
 const cases=[
 ['complete',base,true],['no-selection',{...base,selected:null},false],['preflight-failed',{...base,preflight:'HOLD'},false],['route-missing',{...base,route:''},false],['owner-missing',{...base,owner:''},false],['actions-missing',{...base,actionCount:0},false],['backend-missing',{...base,backendCount:0},false],['rollback-missing',{...base,rollbackRequired:false},false],['transaction-not-ready',{...base,transactionReady:false},false]
 ];
 const checks=cases.map(([name,input,expected])=>Object.freeze({name,expected,actual:cert(input),pass:cert(input)===expected}));
 const result=Object.freeze({ok:checks.every(x=>x.pass),checks,mutationAuthorized:false,mutationExecuted:false,source:'in-memory-only',generatedAt:new Date().toISOString()});
 window.GhadeerServiceCandidateCertificationSelfTest=result;return result;
}
window.GhadeerBuildServiceCandidateCertificationSelfTest=run;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
})();
