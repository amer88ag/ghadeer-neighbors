/* Canonical registry adapter — stable keys, single owner/entry, no UI behavior changes. */
(()=>{'use strict';
function stableKey(x){const raw=String(x?.name||'').trim().normalize('NFKC').toLowerCase();return 'svc_'+Array.from(raw).map(c=>c.codePointAt(0).toString(16)).join('_')}
function boot(){const R=window.GhadeerServiceRegistry;const C=window.GhadeerServicesV6?.catalog;if(!R||!Array.isArray(C))return;for(const x of C){const serviceKey=stableKey(x);if(R.get(serviceKey))continue;R.register({serviceKey,name:x.name,icon:x.icon,category:x.cat,description:x.desc,entry:'GhadeerServicesV6',ownerPage:'services',lifecycle:'ui'})}const result=R.validate();window.GhadeerServiceRegistryAudit=result;console.info('[Ghadeer] service registry',result)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,0),{once:true});else setTimeout(boot,0);
})();
