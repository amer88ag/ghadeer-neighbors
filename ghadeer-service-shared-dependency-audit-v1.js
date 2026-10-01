/* Ghadeer Shared Dependency Audit v1 — audit only.
 * Builds a conservative dependency map from loaded service metadata and scripts.
 * It never deletes, rewires, or changes behavior.
 */
(()=>{'use strict';
function run(){
 const manifest=window.GhadeerServiceManifest, ownership=window.GhadeerServiceOwnership;
 if(!manifest||!ownership)return {ok:false,reason:'manifest-or-ownership-unavailable'};
 const services=manifest.services||[];
 const byEntry=new Map();
 for(const s of services){const e=String(s.entry||'').trim();if(!e)continue;if(!byEntry.has(e))byEntry.set(e,[]);byEntry.get(e).push(s.serviceKey)}
 const rows=services.map(s=>{const entry=String(s.entry||'').trim();const shared=entry?(byEntry.get(entry)||[]).filter(k=>k!==s.serviceKey):[];return Object.freeze({serviceKey:s.serviceKey,entry,sharedEntryServices:shared,status:shared.length?'REVIEW':'NO_SHARED_ENTRY'});});
 const conflicts=rows.filter(r=>r.status==='REVIEW');
 const result=Object.freeze({ok:conflicts.length===0,total:rows.length,shared:conflicts.length,review:conflicts.length,rows,conflicts,generatedAt:new Date().toISOString()});
 window.GhadeerSharedDependencyAudit=result;return result;
}
window.GhadeerBuildSharedDependencyAudit=run;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
})();
