/* Canonical service route map — one deterministic route per serviceKey. */
(()=>{'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').replace(/[\sـ]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').toLowerCase();
function slug(s){return norm(s).replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-+|-+$/g,'').slice(0,70)||'service'}
function build(){const R=window.GhadeerServiceRegistry,C=window.GhadeerServicesV6?.catalog;if(!R||!Array.isArray(C))return;const routes={};for(const x of C){const serviceKey='svc_'+Array.from(norm(x.name)).map(c=>c.codePointAt(0).toString(16)).join('_');if(routes[serviceKey])throw new Error('Duplicate service route: '+serviceKey);routes[serviceKey]={serviceKey,name:x.name,category:x.cat,route:`/services/${slug(x.cat)}/${slug(x.name)}`,entry:'GhadeerServicesV6',ownerPage:'services'};}
window.GhadeerServiceRoutes=Object.freeze(routes);window.GhadeerResolveServiceRoute=k=>window.GhadeerServiceRoutes[String(k||'')]||null;
for(const k of Object.keys(routes)){const d=R.get(k);if(d)R.register?null:null;}
console.info('[Ghadeer] service routes',Object.keys(routes).length)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(build,0),{once:true});else setTimeout(build,0);
})();
