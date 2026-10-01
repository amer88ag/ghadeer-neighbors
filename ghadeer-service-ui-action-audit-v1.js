/* Ghadeer Service UI Action Audit v1 — audit only.
 * Maps UI navigation/action metadata to service ownership and flags duplicates.
 * No UI handlers or icons are changed.
 */
(()=>{'use strict';
function run(){
 const manifest=window.GhadeerServiceManifest;
 const actionMap=window.GhadeerServiceActionMap;
 const nav=window.GhadeerServiceNavigation;
 if(!manifest||!actionMap||!nav)return {ok:false,reason:'manifest-action-map-navigation-unavailable'};
 const actions=Array.isArray(actionMap.rows)?actionMap.rows:[];
 const navRows=Array.isArray(nav.rows)?nav.rows:[];
 const rows=manifest.services.map(s=>{
  const key=String(s.serviceKey||'');
  const declared=actions.filter(x=>String(x.serviceKey||'')===key);
  const owned=declared.flatMap(x=>Array.isArray(x.actions)?x.actions:[]).filter(Boolean);
  const ui=navRows.filter(x=>String(x.serviceKey||'')===key);
  const uiActions=ui.flatMap(x=>Array.isArray(x.actions)?x.actions:[x.action]).filter(Boolean).map(String);
  const duplicates=[...new Set(uiActions)].filter(a=>uiActions.filter(x=>x===a).length>1);
  const unowned=uiActions.filter(a=>!owned.includes(a));
  return Object.freeze({serviceKey:key,declaredActions:[...new Set(owned)],uiActions:[...new Set(uiActions)],duplicateActions:duplicates,unownedActions:[...new Set(unowned)],status:duplicates.length||unowned.length?'REVIEW':'EVIDENCE'});
 });
 const result=Object.freeze({ok:true,total:rows.length,evidence:rows.filter(r=>r.status==='EVIDENCE').length,review:rows.filter(r=>r.status==='REVIEW').length,rows,generatedAt:new Date().toISOString()});
 window.GhadeerServiceUIActionAudit=result;return result;
}
window.GhadeerBuildServiceUIActionAudit=run;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
})();
