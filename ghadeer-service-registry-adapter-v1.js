/* Canonical registry adapter — one canonical key algorithm shared with route/audit layers. */
(()=>{'use strict';
function canonicalName(value){return String(value??'').normalize('NFKC').replace(/[\sـ]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').toLowerCase()}
function stableKey(x){const explicit=String(x?.serviceKey||'').trim();if(explicit)return explicit;const raw=canonicalName(x?.name);return 'svc_'+Array.from(raw).map(c=>c.codePointAt(0).toString(16)).join('_')}
function boot(){const R=window.GhadeerServiceRegistry;const C=window.GhadeerServicesV6?.catalog;if(!R||!Array.isArray(C))return;const seen=new Set();for(const x of C){const serviceKey=stableKey(x);if(seen.has(serviceKey))continue;seen.add(serviceKey);if(R.get(serviceKey))continue;const role=R.normalizeRole(x.role??x.category??x.cat);R.register({serviceKey,name:x.name,icon:x.icon,role,category:role,description:x.desc,entry:'GhadeerServicesV6',ownerPage:'services',lifecycle:'ui'})}const result=R.validate();window.GhadeerServiceRegistryAudit=result;console.info('[Ghadeer] service registry',result)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,0),{once:true});else setTimeout(boot,0);
})();
