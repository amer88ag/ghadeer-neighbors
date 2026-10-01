/* Ghadeer Service Dependency Risk Matrix v1 — audit only.
 * Aggregates existing audit outputs conservatively. Unknown evidence never becomes SAFE.
 */
(()=>{'use strict';
function run(){
 const m=window.GhadeerServiceManifest;
 const audits={integration:window.GhadeerServiceIntegrationAudit,backend:window.GhadeerServiceBackendContract,isolation:window.GhadeerServiceIsolationAudit,shared:window.GhadeerSharedDependencyAudit,file:window.GhadeerServiceFileDependencyAudit,events:window.GhadeerServiceEventDependencyAudit,async:window.GhadeerServiceAsyncDependencyAudit};
 if(!m)return {ok:false,reason:'service-manifest-unavailable'};
 const rows=m.services.map(s=>{const key=String(s.serviceKey||'').trim();const get=(name)=>audits[name]?.rows?.find(r=>r.serviceKey===key);const i=get('integration'),b=get('backend'),iso=get('isolation'),sh=get('shared'),f=get('file'),ev=get('events'),as=get('async');const blockers=[];const reviews=[];if(i?.status==='REVIEW')reviews.push('integration');if(b?.contractStatus==='REVIEW')reviews.push('backend-contract');if(iso?.isolationStatus==='REVIEW')blockers.push('ownership-isolation');if(sh?.status==='REVIEW')blockers.push('shared-entry');if(f?.status==='REVIEW')reviews.push('file');if(ev?.status==='UNVERIFIED')reviews.push('events');if(as?.status==='UNVERIFIED')reviews.push('async');const risk=blockers.length?'BLOCKED':reviews.length?'REVIEW':'SAFE';return Object.freeze({serviceKey:key,risk,blockers,reviews});});
 const result=Object.freeze({ok:true,total:rows.length,safe:rows.filter(r=>r.risk==='SAFE').length,review:rows.filter(r=>r.risk==='REVIEW').length,blocked:rows.filter(r=>r.risk==='BLOCKED').length,rows,generatedAt:new Date().toISOString()});
 window.GhadeerServiceDependencyRiskMatrix=result;return result;
}
window.GhadeerBuildServiceDependencyRiskMatrix=run;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
})();
