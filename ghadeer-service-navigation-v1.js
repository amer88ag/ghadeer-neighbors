/* Ghadeer Service Navigation v1 — one entry point for every service. Read-only adapter until UI migration is complete. */
(()=>{'use strict';
function resolve(serviceKey){
  const routes=window.GhadeerServiceRoutes;
  if(!routes||typeof routes!=='object') throw new Error('Canonical service routes are unavailable');
  const key=String(serviceKey||'').trim();
  const route=routes[key];
  if(!route) throw new Error(`Unknown serviceKey: ${key}`);
  return route;
}
function open(serviceKey){
  const route=resolve(serviceKey);
  const path=String(route.route||'').trim();
  if(!path) throw new Error(`Service has no canonical route: ${serviceKey}`);
  if(typeof window.GhadeerOpenPage==='function') return window.GhadeerOpenPage(route.ownerPage||'services',{serviceKey:route.serviceKey,route:path});
  if(typeof window.openPage==='function') return window.openPage(route.ownerPage||'services');
  window.location.hash=path;
  return path;
}
window.GhadeerServiceNavigation=Object.freeze({resolve,open});
})();
