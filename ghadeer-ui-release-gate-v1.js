/* Ghadeer UI Release Gate v2 — fail-closed, audit only.
 * Release is not authorized by DOM presence alone: every interactive control must
 * have one resolvable target, and duplicate target bindings are held for review.
 */
(()=>{'use strict';
function run(){
 const matrix=window.GhadeerUIInteractionMatrix;
 const integrity=window.GhadeerUIIntegrityAudit;
 const base={releaseAuthorized:false,mutationExecuted:false,generatedAt:new Date().toISOString()};
 if(!matrix)return window.GhadeerUIReleaseGate=Object.freeze({...base,ok:false,reason:'interaction-matrix-unavailable'});
 const rows=Array.isArray(matrix.rows)?matrix.rows:[];
 const missing=rows.filter(r=>!String(r.target||'').trim());
 const duplicateTargets=Array.isArray(matrix.duplicateTargets)?matrix.duplicateTargets:[];
 const duplicateIds=Array.isArray(integrity?.checks?.duplicateIds)?integrity.checks.duplicateIds:[];
 const unknownActions=Array.isArray(integrity?.checks?.unknownActions)?integrity.checks.unknownActions:[];
 const integrityOk=integrity?.ok===true;
 const ok=rows.length>0&&missing.length===0&&duplicateTargets.length===0&&duplicateIds.length===0&&unknownActions.length===0&&integrityOk;
 return window.GhadeerUIReleaseGate=Object.freeze({...base,ok,releaseAuthorized:ok,interactiveCount:rows.length,missingTargets:missing.length,duplicateTargets:duplicateTargets.length,duplicateIds:duplicateIds.length,unknownActions:unknownActions.length,integrityOk,reason:ok?'PASS':'HOLD'});
}
window.GhadeerBuildUIReleaseGate=run;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,150),{once:true});else setTimeout(run,150);
})();
