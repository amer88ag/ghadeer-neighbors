/* Ghadeer Service UI Route Audit v1 — audit only. */
(()=>{'use strict';
function run(){
 const routes=window.GhadeerServiceRouteMap;
 const apis=Array.isArray(window.GhadeerServicePublicAPIs)?window.GhadeerServicePublicAPIs:[];
 const nav=window.GhadeerServiceNavigation;
 if(!routes||!apis.length||!nav)return {ok:false,reason:'route-api-navigation-unavailable'};
 const routeRows=Array.isArray(routes.rows)?routes.rows:[];
 const navRows=Array.isArray(nav.rows)?nav.rows:[];
 const rows=apis.map(api=>{const key=String(api.serviceKey||'');const r=routeRows.find(x=>String(x.serviceKey||'')===key);const n=navRows.filter(x=>String(x.serviceKey||'')===key);const expected=String(api.route||r?.route||'').trim();const actual=[...new Set(n.map(x=>String(x.route||x.path||'').trim()).filter(Boolean))];const missing=expected&&!actual.includes(expected)?[expected]:[];const duplicate=actual.length>1;return Object.freeze({serviceKey:key,expectedRoute:expected,navigationRoutes:actual,missing,duplicate,status:missing.length||duplicate?'REVIEW':'EVIDENCE'});});
 const result=Object.freeze({ok:true,total:rows.length,evidence:rows.filter(r=>r.status==='EVIDENCE').length,review:rows.filter(r=>r.status==='REVIEW').length,rows,generatedAt:new Date().toISOString()});window.GhadeerServiceUIRouteAudit=result;return result;}
window.GhadeerBuildServiceUIRouteAudit=run;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
})();
