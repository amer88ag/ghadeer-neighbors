/* Ghadeer Service Route/API Audit v1 — audit only.
 * Verifies that each declared service route points to the same service boundary/public API.
 * Missing or conflicting evidence is REVIEW; nothing is rerouted automatically.
 */
(()=>{'use strict';
function run(){
 const routes=window.GhadeerServiceRouteMap;
 const boundaries=window.GhadeerServiceBoundaries;
 const apis=Array.isArray(window.GhadeerServicePublicAPIs)?window.GhadeerServicePublicAPIs:[];
 if(!routes||!boundaries)return {ok:false,reason:'route-map-or-boundary-unavailable'};
 const routeRows=Array.isArray(routes.rows)?routes.rows:Array.isArray(routes)?routes:[];
 const rows=boundaries.rows.map(b=>{
  const key=String(b.serviceKey||'').trim();
  const candidates=routeRows.filter(r=>String(r.serviceKey||r.ownerServiceKey||'').trim()===key);
  const api=apis.find(x=>String(x.serviceKey||'').trim()===key);
  const declared=String(b.route||api?.route||'').trim();
  const matching=candidates.filter(r=>String(r.route||r.path||'').trim()===declared);
  const conflicting=candidates.filter(r=>String(r.route||r.path||'').trim()&&String(r.route||r.path||'').trim()!==declared);
  const status=!declared||conflicting.length?'REVIEW':matching.length?'EVIDENCE':'REVIEW';
  return Object.freeze({serviceKey:key,declaredRoute:declared,routeEvidence:matching.map(r=>r.route||r.path).filter(Boolean),conflicts:conflicting.map(r=>r.route||r.path).filter(Boolean),status});
 });
 const result=Object.freeze({ok:true,total:rows.length,evidence:rows.filter(r=>r.status==='EVIDENCE').length,review:rows.filter(r=>r.status==='REVIEW').length,rows,generatedAt:new Date().toISOString()});
 window.GhadeerServiceRouteAPIAudit=result;return result;
}
window.GhadeerBuildServiceRouteAPIAudit=run;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
})();
