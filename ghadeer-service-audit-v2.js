/* Service audit v2 — uses the same explicit/stable serviceKey algorithm as registry and route layers. Read-only. */
(()=>{'use strict';
const norm=v=>String(v??'').normalize('NFKC').replace(/[\sـ]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').toLowerCase();
const stableKey=x=>{const explicit=String(x?.serviceKey||'').trim();if(explicit)return explicit;const raw=norm(x?.name);return 'svc_'+Array.from(raw).map(c=>c.codePointAt(0).toString(16)).join('_')};
function run(){
 const R=window.GhadeerServiceRegistry,C=window.GhadeerServicesV6?.catalog,routes=window.GhadeerServiceRoutes||{};
 if(!R||!Array.isArray(C))return null;
 const errors=[],seenKeys=new Set(),seenRoutes=new Set();
 for(const x of C){const name=String(x?.name||'').trim(),key=stableKey(x),role=R.normalizeRole(x?.role??x?.category??x?.cat),r=routes[key];if(seenKeys.has(key))errors.push(`duplicate serviceKey: ${key}`);seenKeys.add(key);if(role==='other')errors.push(`unmapped role: ${name}`);if(!r)errors.push(`missing route: ${name}`);if(r&&!r.route)errors.push(`empty route: ${name}`);if(r&&seenRoutes.has(r.route))errors.push(`duplicate route: ${r.route}`);if(r)seenRoutes.add(r.route);const d=R.get(key);if(!d)errors.push(`missing registry entry: ${name}`);if(d&&d.entry!=='GhadeerServicesV6')errors.push(`wrong entry: ${name}`);if(d&&d.ownerPage!=='services')errors.push(`wrong ownerPage: ${name}`)}
 const report={ok:errors.length===0,total:C.length,registered:R.list().length,routed:Object.keys(routes).length,errors};window.GhadeerServiceAudit=Object.freeze(report);console.info('[Ghadeer] service audit v2',report);return report;
}
window.GhadeerRunServiceAudit=run;if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
})();
