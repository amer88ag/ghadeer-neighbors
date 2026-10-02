/* Ghadeer UI Release Gate v1 — non-mutating runtime audit.
 * Blocks release readiness when the interaction matrix is unavailable, duplicated,
 * or contains interactive elements without a resolvable target.
 */
(()=>{'use strict';
function run(){
 const matrix=window.GhadeerUIInteractionMatrix;
 const integrity=window.GhadeerUIIntegrityAudit;
 const resultBase={mutationExecuted:false,releaseAuthorized:false,generatedAt:new Date().toISOString()};
 if(!matrix)return window.GhadeerUIReleaseGate=Object.freeze({...resultBase,ok:false,reason:'interaction-matrix-unavailable'});
 const rows=Array.isArray(matrix.rows)?matrix.rows:[];
 const target=(r)=>String(r.dataPage||r.href||r.onclick||r.dataService||'').trim();
 const missing=rows.filter(r=>!target(r));
 const keys=rows.map(target).filter(Boolean);
 const counts=new Map();keys.forEach(k=>counts.set(k,(counts.get(k)||0)+1));
 const duplicates=[...counts].filter(([,n])=>n>1).map(([key,count])=>({key,count}));
 const integrityOk=integrity?.ok!==false;
 const ok=rows.length>0&&missing.length===0&&duplicates.length===0&&integrityOk;
 return window.GhadeerUIReleaseGate=Object.freeze({...resultBase,ok,rows:rows.length,missingTargets:missing.length,duplicates,integrityOk,reason:ok?'PASS':'HOLD'});
}
window.GhadeerBuildUIReleaseGate=run;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
})();
