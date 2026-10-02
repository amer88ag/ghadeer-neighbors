/* Ghadeer UI Release Gate v1 — fail-closed, audit only. */
(()=>{'use strict';
function run(){
 const matrix=window.GhadeerUIInteractionMatrix;
 const integrity=window.GhadeerUIIntegrityAudit;
 const base={releaseAuthorized:false,mutationExecuted:false,generatedAt:new Date().toISOString()};
 if(!matrix)return window.GhadeerUIReleaseGate=Object.freeze({...base,ok:false,reason:'interaction-matrix-unavailable'});
 const rows=Array.isArray(matrix.rows)?matrix.rows:[];
 const missing=rows.filter(r=>!String(r.target||'').trim());
 const duplicates=Array.isArray(matrix.duplicateTargets)?matrix.duplicateTargets:[];
 const integrityOk=integrity?.ok===true;
 const ok=rows.length>0&&missing.length===0&&duplicates.length===0&&integrityOk;
 return window.GhadeerUIReleaseGate=Object.freeze({...base,ok,releaseAuthorized:ok,interactiveCount:rows.length,missingTargets:missing.length,duplicateTargets:duplicates.length,integrityOk,reason:ok?'PASS':'HOLD'});
}
window.GhadeerBuildUIReleaseGate=run;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,150),{once:true});else setTimeout(run,150);
})();
