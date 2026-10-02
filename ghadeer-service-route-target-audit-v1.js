/* Ghadeer Route Target Audit v1 — read-only, fail-closed. */
(()=>{'use strict';
 const norm=v=>String(v??'').trim();
 function run(){
  const routes=window.GhadeerServiceRoutes;
  const manifest=window.GhadeerServiceManifest;
  const base={ok:false,releaseAuthorized:false,mutationExecuted:false,generatedAt:new Date().toISOString()};
  if(!routes||!manifest||!Array.isArray(manifest.services))return window.GhadeerServiceRouteTargetAudit=Object.freeze({...base,reason:'route-target-input-unavailable'});
  const missing=[];const mismatched=[];
  for(const s of manifest.services){
   const key=norm(s.serviceKey);const target=routes[key];
   if(!target){missing.push(key);continue;}
   if(norm(target.route)!==norm(s.route))mismatched.push({serviceKey:key,manifestRoute:s.route||'',routeMapRoute:target.route||''});
   if(!norm(target.entry||target.ownerPage))missing.push(key);
  }
  const ok=manifest.ok===true&&missing.length===0&&mismatched.length===0;
  return window.GhadeerServiceRouteTargetAudit=Object.freeze({...base,ok,releaseAuthorized:ok,totalServices:manifest.services.length,missingTargets:missing,mismatchedRoutes:mismatched,reason:ok?'PASS':'HOLD'});
 }
 window.GhadeerBuildServiceRouteTargetAudit=run;
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,250),{once:true});else setTimeout(run,250);
})();
