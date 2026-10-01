/* Ghadeer Service Isolation Audit v1 — audit only.
 * Detects likely cross-service ownership collisions without mutating code.
 */
(()=>{'use strict';
function run(){
 const manifest=window.GhadeerServiceManifest, ownership=window.GhadeerServiceOwnership;
 if(!manifest||!ownership)return {ok:false,reason:'manifest-or-ownership-unavailable'};
 const byOwner=new Map();
 for(const o of ownership.ownership){const owner=String(o.canonicalOwner||'').trim();if(!owner)continue;if(!byOwner.has(owner))byOwner.set(owner,[]);byOwner.get(owner).push(o.serviceKey)}
 const rows=manifest.services.map(s=>{const owner=ownership.ownership.find(o=>o.serviceKey===s.serviceKey);const siblings=owner?byOwner.get(owner.canonicalOwner).filter(k=>k!==s.serviceKey):[];return Object.freeze({serviceKey:s.serviceKey,canonicalOwner:owner?.canonicalOwner||'',sharedOwnerServices:siblings,isolationStatus:siblings.length?'REVIEW':'ISOLATED'})});
 const conflicts=rows.filter(r=>r.isolationStatus==='REVIEW');
 const result=Object.freeze({ok:conflicts.length===0,total:rows.length,isolated:rows.length-conflicts.length,review:conflicts.length,rows,conflicts,generatedAt:new Date().toISOString()});
 window.GhadeerServiceIsolationAudit=result;return result;
}
window.GhadeerBuildServiceIsolationAudit=run;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
})();
