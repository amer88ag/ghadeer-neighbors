/* Registers the existing canonical service catalog without changing its UI behavior. */
(()=>{'use strict';
function slug(s){return 'svc_'+Array.from(String(s||'')).map(c=>c.codePointAt(0).toString(16)).join('_')}
function boot(){const R=window.GhadeerServiceRegistry;const C=window.GhadeerServicesV6?.catalog;if(!R||!Array.isArray(C))return;for(const x of C){const serviceKey=slug(x.name);if(R.get(serviceKey))continue;R.register({serviceKey,name:x.name,icon:x.icon,category:x.cat,description:x.desc,entry:'GhadeerServicesV6.openService',ownerPage:'services',lifecycle:x.cat==='core'?'connected':'ui'})}const result=R.validate();window.GhadeerServiceRegistryAudit=result;console.info('[Ghadeer] service registry',result)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,0),{once:true});else setTimeout(boot,0);
})();
