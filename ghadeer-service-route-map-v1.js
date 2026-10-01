/* Canonical service route map — one deterministic route per serviceKey. */
(()=>{'use strict';
const norm=s=>String(s||'').replace(/[\sـ]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').toLowerCase();
const slug=s=>norm(s).replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-+|-+$/g,'').slice(0,70)||'service';
function build(){const R=window.GhadeerServiceRegistry,C=window.GhadeerServicesV6?.catalog;if(!R||!Array.isArray(C))return;const routes={},seen=new Set();for(const x of C){const role=R.normalizeRole(x.role??x.category??x.cat);const serviceKey='svc_'+Array.from(norm(x.name)).map(c=>c.codePointAt(0).toString(16)).join('_');const route=`/services/${slug(role)}/${slug(x.name)}`;if(seen.has(route))throw new Error('Duplicate service route: '+route);seen.add(route);routes[serviceKey]={serviceKey,name:x.name,role,category:role,route,entry:'GhadeerServicesV6',ownerPage:'services',lifecycle:'ui'};}
const quran={serviceKey:'svc_quran',name:'وردي / القرآن',role:'core',category:'core',route:'/quran',entry:'GhadeerQuranV5',ownerPage:'quran',lifecycle:'connected'};if(!R.get(quran.serviceKey))R.register(quran);if(seen.has(quran.route))throw new Error('Duplicate service route: '+quran.route);routes[quran.serviceKey]=quran;
window.GhadeerServiceRoutes=Object.freeze(routes);window.GhadeerResolveServiceRoute=k=>window.GhadeerServiceRoutes[String(k||'')]||null;console.info('[Ghadeer] service routes',Object.keys(routes).length)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(build,0),{once:true});else setTimeout(build,0);
})();
