/* Ghadeer Service Action Map v1 — audit only.
 * Builds a deterministic map of visible UI actions to service keys, handlers and routes.
 * It does not delete, replace, or disable any UI action.
 */
(()=>{'use strict';
function norm(value){return String(value||'').replace(/\s+/g,' ').trim().toLowerCase().replace(/\b\d+\b/g,'#');}
function scan(root=document){
 const nav=window.GhadeerServiceNavigation;
 const routeMap=window.GhadeerServiceRoutes||{};
 const nodes=[...root.querySelectorAll('button,a,[role="button"],input[type="button"],input[type="submit"]')];
 const rows=[], signatures=new Map();
 for(const node of nodes){
   const text=norm(node.textContent||node.value||'');
   const serviceKey=String(node.dataset?.serviceKey||'').trim();
   const route=serviceKey && routeMap[serviceKey] ? routeMap[serviceKey] : '';
   const onclick=String(node.getAttribute('onclick')||'').trim();
   const href=String(node.getAttribute('href')||'').trim();
   const id=String(node.id||'').trim();
   if(!text&&!onclick&&!href&&!serviceKey)continue;
   const signature=norm([onclick,href,serviceKey,text].join('|'));
   const row={id,text,serviceKey,route,onclick,href,signature};
   rows.push(row);
   if(signature){if(!signatures.has(signature))signatures.set(signature,[]);signatures.get(signature).push(row)}
 }
 const duplicateActions=[...signatures.values()].filter(group=>group.length>1);
 const result=Object.freeze({ok:true,total:nodes.length,actionCount:rows.length,serviceLinked:rows.filter(r=>r.serviceKey).length,duplicateActionGroups:duplicateActions.length,rows,duplicateActions,generatedAt:new Date().toISOString()});
 window.GhadeerServiceActionMap=result;
 return result;
}
window.GhadeerBuildServiceActionMap=scan;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(scan,0),{once:true});else setTimeout(scan,0);
})();
