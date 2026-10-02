/* Ghadeer Service Catalog Route Audit v2 — read-only, fail-closed structural audit. */
(()=>{'use strict';
 const norm=s=>String(s??'').trim().toLowerCase();
 function run(){
  const registry=window.GhadeerServiceRegistry;
  const routeMap=window.GhadeerServiceRouteMap;
  const manifest=window.GhadeerServiceManifest;
  const catalog=window.GhadeerServicesCatalog||window.GhadeerServices||window.GhadeerServicesV6?.catalog;
  const base={ok:false,releaseAuthorized:false,mutationExecuted:false,generatedAt:new Date().toISOString()};
  if(!registry||!routeMap||!manifest||!catalog)return window.GhadeerServiceCatalogRouteAudit=Object.freeze({...base,reason:'audit-input-unavailable'});
  const services=Array.isArray(manifest.services)?manifest.services:[];
  const keys=services.map(x=>norm(x.serviceKey)).filter(Boolean);
  const routes=services.map(x=>norm(x.route)).filter(Boolean);
  const dup=(a)=>[...new Set(a.filter((v,i)=>a.indexOf(v)!==i))];
  const duplicateKeys=dup(keys),duplicateRoutes=dup(routes);
  const missingKey=services.filter(x=>!norm(x.serviceKey));
  const missingRoute=services.filter(x=>!norm(x.route));
  const missingEntry=services.filter(x=>!norm(x.entry||x.ownerPage));
  const routeObjectsMissing=services.filter(x=>!routeMap[String(x.serviceKey||'')]);
  const manifestOk=manifest.ok===true&&Array.isArray(manifest.services)&&manifest.errors?.length===0;
  const registryOk=typeof registry.validate==='function'?registry.validate()===true:true;
  const routeOk=typeof routeMap.validate==='function'?routeMap.validate()===true:true;
  const ok=services.length>0&&manifestOk&&duplicateKeys.length===0&&duplicateRoutes.length===0&&missingKey.length===0&&missingRoute.length===0&&missingEntry.length===0&&routeObjectsMissing.length===0&&registryOk&&routeOk;
  return window.GhadeerServiceCatalogRouteAudit=Object.freeze({...base,ok,releaseAuthorized:ok,totalServices:services.length,duplicateKeys,duplicateRoutes,missingKey:missingKey.map(x=>x.serviceKey||null),missingRoute:missingRoute.map(x=>x.serviceKey),missingEntry:missingEntry.map(x=>x.serviceKey),routeObjectsMissing:routeObjectsMissing.map(x=>x.serviceKey),manifestOk,registryOk,routeOk,reason:ok?'PASS':'HOLD'});
 }
 window.GhadeerBuildServiceCatalogRouteAudit=run;
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,250),{once:true});else setTimeout(run,250);
})();
