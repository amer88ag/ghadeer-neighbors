/* Ghadeer Service Event Dependency Audit v1 — conservative audit only.
 * Detects explicit service/event relationships exposed by runtime metadata.
 * It never subscribes, unsubscribes, rewires, or mutates event handlers.
 */
(()=>{'use strict';
function run(){
 const manifest=window.GhadeerServiceManifest;
 if(!manifest)return {ok:false,reason:'service-manifest-unavailable'};
 const registry=window.GhadeerServiceRegistry||{};
 const events=Array.isArray(registry.events)?registry.events:[];
 const rows=manifest.services.map(s=>{
   const key=String(s.serviceKey||'').trim();
   const related=events.filter(e=>String(e.serviceKey||e.ownerServiceKey||'').trim()===key||((e.services||[]).map(String).includes(key)));
   return Object.freeze({serviceKey:key,eventCount:related.length,events:related.map(e=>e.eventKey||e.name||'').filter(Boolean),status:related.length?'EVIDENCE':'UNVERIFIED'});
 });
 const result=Object.freeze({ok:true,total:rows.length,evidence:rows.filter(r=>r.status==='EVIDENCE').length,unverified:rows.filter(r=>r.status==='UNVERIFIED').length,rows,generatedAt:new Date().toISOString()});
 window.GhadeerServiceEventDependencyAudit=result;return result;
}
window.GhadeerBuildServiceEventDependencyAudit=run;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
})();
