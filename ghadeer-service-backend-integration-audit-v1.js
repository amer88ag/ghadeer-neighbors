/* Ghadeer Service Backend Integration Audit v1 — audit/report only.
 * Maps canonical services to backend/RPC evidence when discoverable at runtime.
 * Never mutates data, permissions, RPCs, or UI.
 */
(()=>{'use strict';
function run(){
 const manifest=window.GhadeerServiceManifest;
 const integration=window.GhadeerServiceIntegrationAudit;
 if(!manifest)return {ok:false,reason:'service-manifest-unavailable'};
 const rpcNames=Object.keys(window).filter(k=>/^rpc|.*RPC|supabase/i.test(k));
 const rows=manifest.services.map(s=>{
   const key=String(s.serviceKey||'').trim();
   const candidates=rpcNames.filter(n=>n.toLowerCase().includes(key.toLowerCase().replace(/[^a-z0-9]/g,'')));
   const integrationRow=integration?.rows?.find(r=>r.serviceKey===key);
   return Object.freeze({serviceKey:key,route:!!s.route,entry:!!s.entry,ui:integrationRow?.evidence?.ui===true,possibleRuntimeRpcMatches:candidates,backendStatus:candidates.length?'POSSIBLE':'UNVERIFIED'});
 });
 const result=Object.freeze({ok:true,total:rows.length,possible:rows.filter(r=>r.backendStatus==='POSSIBLE').length,unverified:rows.filter(r=>r.backendStatus==='UNVERIFIED').length,rows,generatedAt:new Date().toISOString()});
 window.GhadeerServiceBackendIntegrationAudit=result;return result;
}
window.GhadeerBuildServiceBackendIntegrationAudit=run;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
})();
