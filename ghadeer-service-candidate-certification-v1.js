/* Ghadeer Service Candidate Certification v1 — non-mutating.
 * Certifies the selected candidate only when all required evidence is present.
 */
(()=>{'use strict';
function run(){
 const sel=window.GhadeerServiceCandidateSelection;
 const pre=window.GhadeerServicePreflight;
 const map=window.GhadeerServiceExecutionMap;
 const plan=window.GhadeerServiceRefactorPlan;
 const tx=window.GhadeerServiceRefactorTransactionGate;
 if(!sel||!pre||!map||!plan||!tx)return {ok:false,reason:'certification-input-unavailable'};
 const key=sel.selected;
 const p=(pre.rows||[]).find(x=>x.serviceKey===key);
 const m=(map.rows||[]).find(x=>x.serviceKey===key);
 const r=(plan.rows||[]).find(x=>x.serviceKey===key);
 const t=(tx.rows||[]).find(x=>x.serviceKey===key);
 const checks=[
  ['selected-candidate',Boolean(key)],
  ['preflight-allowed',Boolean(p&&p.decision==='ALLOW_REFACTOR_REVIEW')],
  ['route-present',Boolean(m&&m.route)],
  ['owner-present',Boolean(m&&m.owner)],
  ['actions-present',Boolean(m&&Array.isArray(m.actions)&&m.actions.length>0)],
  ['backend-present',Boolean(m&&Array.isArray(m.backend)&&m.backend.length>0)],
  ['rollback-required',Boolean(r&&r.rollbackRequired===true)],
  ['transaction-ready',Boolean(t&&t.decision==='READY_FOR_CONTROLLED_TRANSACTION')]
 ].map(([name,pass])=>Object.freeze({name,pass}));
 const certified=checks.every(x=>x.pass);
 const result=Object.freeze({ok:certified,certified,serviceKey:key,checks,mutationAuthorized:false,generatedAt:new Date().toISOString()});
 window.GhadeerServiceCandidateCertification=result;return result;
}
window.GhadeerBuildServiceCandidateCertification=run;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
})();
