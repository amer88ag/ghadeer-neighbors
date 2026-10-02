/* Ghadeer Service Action Map v2 — audit only.
 * Builds a deterministic map of visible UI actions to service keys, routes and
 * explicit backend/RPC metadata when the UI declares it. It never mutates UI.
 */
(()=>{'use strict';
function norm(value){return String(value||'').replace(/\s+/g,' ').trim().toLowerCase().replace(/\b\d+\b/g,'#');}
function scan(root=document){
 const routeMap=window.GhadeerServiceRoutes||{};
 const nodes=[...root.querySelectorAll('button,a,[role="button"],input[type="button"],input[type="submit"]')];
 const rows=[], signatures=new Map();
 for(const node of nodes){
   const text=norm(node.textContent||node.value||'');
   const serviceKey=String(node.dataset?.serviceKey||'').trim();
   const route=serviceKey&&routeMap[serviceKey]?routeMap[serviceKey]:'';
   const onclick=String(node.getAttribute('onclick')||'').trim();
   const href=String(node.getAttribute('href')||'').trim();
   const id=String(node.id||'').trim();
   const backend=String(node.dataset?.backend||'').trim();
   const rpc=String(node.dataset?.rpc||'').trim();
   const handler=String(node.dataset?.handler||'').trim();
   const actionKey=String(node.dataset?.actionKey||id||text||'').trim();
   if(!text&&!onclick&&!href&&!serviceKey&&!backend&&!rpc&&!handler)continue;
   const signature=norm([onclick,href,serviceKey,actionKey].join('|'));
   const row={id,text,serviceKey,route,actionKey,onclick,href,backend,rpc,handler,signature};
   rows.push(row);
   if(signature){if(!signatures.has(signature))signatures.set(signature,[]);signatures.get(signature).push(row)}
 }
 const duplicateActions=[...signatures.values()].filter(group=>group.length>1);
 const result=Object.freeze({ok:true,total:nodes.length,actionCount:rows.length,serviceLinked:rows.filter(r=>r.serviceKey).length,backendDeclared:rows.filter(r=>r.backend||r.rpc||r.handler).length,duplicateActionGroups:duplicateActions.length,rows,duplicateActions,generatedAt:new Date().toISOString()});
 window.GhadeerServiceActionMap=result;return result;
}
window.GhadeerBuildServiceActionMap=scan;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(scan,0),{once:true});else setTimeout(scan,0);
})();
