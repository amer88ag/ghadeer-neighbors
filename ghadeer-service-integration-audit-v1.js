/* Ghadeer Service Integration Audit v1 — audit only.
 * Checks canonical service ownership against UI/action/RPC evidence when available.
 */
(()=>{'use strict';
function run(){
 const manifest=window.GhadeerServiceManifest, ownership=window.GhadeerServiceOwnership;
 const actions=window.GhadeerServiceActionClassification;
 if(!manifest||!ownership)return {ok:false,reason:'manifest-or-ownership-unavailable'};
 const byKey=new Map((actions?.rows||[]).map(r=>[String(r.serviceKey||'').trim(),r]));
 const rows=[];const conflicts=[];
 for(const s of manifest.services){
   const o=ownership.ownership.find(x=>x.serviceKey===s.serviceKey);
   const a=byKey.get(s.serviceKey);
   const evidence={owner:!!o,ui:!!a,route:!!s.route,entry:!!s.entry};
   const missing=Object.entries(evidence).filter(([,v])=>!v).map(([k])=>k);
   const status=missing.length?'REVIEW':'LINKED';
   if(missing.length)conflicts.push({serviceKey:s.serviceKey,missing});
   rows.push(Object.freeze({serviceKey:s.serviceKey,status,missing,evidence}));
 }
 const result=Object.freeze({ok:conflicts.length===0,total:rows.length,linked:rows.filter(r=>r.status==='LINKED').length,review:conflicts.length,rows,conflicts,generatedAt:new Date().toISOString()});
 window.GhadeerServiceIntegrationAudit=result;return result;
}
window.GhadeerBuildServiceIntegrationAudit=run;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
})();
