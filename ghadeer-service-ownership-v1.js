/* Ghadeer Service Ownership v1 — audit only.
 * Establishes one canonical owner for each service without changing existing behavior.
 */
(()=>{'use strict';
function run(){
 const manifest=window.GhadeerServiceManifest;
 if(!manifest)return {ok:false,reason:'service-manifest-unavailable'};
 const ownership=[];const conflicts=[];
 for(const s of manifest.services){
   const owners=[s.ownerPage,s.entry].map(v=>String(v||'').trim()).filter(Boolean);
   const unique=[...new Set(owners)];
   if(!s.serviceKey){conflicts.push({type:'missing-service-key',service:s});continue}
   if(unique.length===0)conflicts.push({type:'missing-owner',serviceKey:s.serviceKey});
   else ownership.push(Object.freeze({serviceKey:s.serviceKey,ownerPage:s.ownerPage||'',entry:s.entry||'',canonicalOwner:unique[0],ownerCandidates:unique}));
   if(unique.length>1)conflicts.push({type:'multiple-owners',serviceKey:s.serviceKey,owners:unique});
 }
 const result=Object.freeze({ok:conflicts.length===0,total:ownership.length,ownership:Object.freeze(ownership),conflicts,generatedAt:new Date().toISOString()});
 window.GhadeerServiceOwnership=result;return result;
}
window.GhadeerBuildServiceOwnership=run;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
})();
