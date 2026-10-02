/* Ghadeer Service Catalog Route Audit v1 — read-only runtime audit.
 * Verifies the catalog is structurally unique and flags services that cannot be
 * mapped to a canonical route/entry without mutating the catalog or runtime.
 */
(()=>{'use strict';
 const norm=s=>String(s??'').trim().toLowerCase();
 function run(){
  const registry=window.GhadeerServiceRegistry;
  const routeMap=window.GhadeerServiceRouteMap;
  const manifest=window.GhadeerServiceManifest;
  const catalog=window.GhadeerServicesCatalog||window.GhadeerServices;
  const base={ok:false,releaseAuthorized:false,mutationExecuted:false,generatedAt:new Date().toISOString()};
  if(!registry||!routeMap||!manifest||!catalog)return window.GhadeerServiceCatalogRouteAudit=Object.freeze({...base,reason:'audit-input-unavailable'});
  const services=Array.isArray(manifest.services)?manifest.services:[];
  const keys=services.map(x=>norm(x.serviceKey)).filter(Boolean);
  const routes=services.map(x=>norm(x.route)).filter(Boolean);
  const dup=(a)=>[...new Set(a.filter((v,i)=>a.indexOf(v)!==i))];
  const duplicateKeys=dup(keys),duplicateRoutes=dup(routes);
  const missingRoute=services.filter(x=>!norm(x.route));
  const missingEntry=services.filter(x=>!norm(x.entry||x.ownerPage));
  const registryOk=typeof registry.validate==='function'?registry.validate()===true:true;
  const routeOk=typeof routeMap.validate==='function'?routeMap.validate()===true:true;
  const ok=services.length>0&&duplicateKeys.length===0&&duplicateRoutes.length===0&&missingRoute.length===0&&missingEntry.length===0&&registryOk&&routeOk;
  return window.GhadeerServiceCatalogRouteAudit=Object.freeze({...base,ok,releaseAuthorized:ok,totalServices:services.length,duplicateKeys,duplicateRoutes,missingRoute:missingRoute.map(x=>x.serviceKey),missingEntry:missingEntry.map(x=>x.serviceKey),registryOk,routeOk,reason:ok?'PASS':'HOLD'});
 }
 window.GhadeerBuildServiceCatalogRouteAudit=run;
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,200),{once:true});else setTimeout(run,200);
})();
