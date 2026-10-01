/* Ghadeer Service Dedup Decisions v1 — audit/report only.
 * Converts exact duplicate candidates into deterministic decisions.
 * No UI mutation, deletion, merging, or navigation changes.
 */
(()=>{'use strict';
function decide(group){
 if(!Array.isArray(group)||group.length<2)return {decision:'KEEP',reason:'not-duplicate'};
 const keys=new Set(group.map(r=>String(r.serviceKey||'').trim()).filter(Boolean));
 const routes=new Set(group.map(r=>String(r.route||'').trim()).filter(Boolean));
 if(keys.size===1&&routes.size===1)return {decision:'MERGE',reason:'same-service-route-action'};
 if(keys.size===1&&routes.size>1)return {decision:'REVIEW',reason:'same-service-multiple-routes'};
 return {decision:'REVIEW',reason:'ambiguous-duplicate'};
}
function run(){
 const policy=window.GhadeerServiceDedupPolicy;
 if(!policy)return {ok:false,reason:'dedup-policy-unavailable'};
 const decisions=policy.candidates.map((group,index)=>({id:index+1,...decide(group),rows:group}));
 const counts={KEEP:0,MERGE:0,LEGACY:0,REVIEW:0};
 for(const d of decisions)counts[d.decision]=(counts[d.decision]||0)+1;
 const result=Object.freeze({ok:true,policy:'decision-only',total:decisions.length,counts,decisions,generatedAt:new Date().toISOString()});
 window.GhadeerServiceDedupDecisions=result;return result;
}
window.GhadeerBuildServiceDedupDecisions=run;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
})();
