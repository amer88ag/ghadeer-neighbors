/* Ghadeer Service Dedup Policy v1 — audit only.
 * Produces candidates; never removes or changes UI actions.
 */
(()=>{'use strict';
function run(){
 const classified=window.GhadeerServiceActionClassification;
 if(!classified)return {ok:false,reason:'action-classification-unavailable'};
 const groups=new Map();
 for(const row of classified.rows){
   if(row.category!=='service')continue;
   const key=row.serviceKey||'';
   const sig=[key,row.route||'',row.onclick||'',row.href||''].join('|');
   if(!groups.has(sig))groups.set(sig,[]);groups.get(sig).push(row);
 }
 const exact=[...groups.values()].filter(g=>g.length>1);
 const result=Object.freeze({ok:true,serviceActions:classified.rows.filter(r=>r.category==='service').length,exactDuplicateGroups:exact.length,candidates:exact,policy:'candidate-only',generatedAt:new Date().toISOString()});
 window.GhadeerServiceDedupPolicy=result;return result;
}
window.GhadeerBuildServiceDedupPolicy=run;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
})();
