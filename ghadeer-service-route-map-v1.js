/* Canonical service route map — one deterministic route per serviceKey. */
(()=>{'use strict';
const R=window.GhadeerServiceRegistry;
const norm=s=>String(s||'').normalize('NFKC').replace(/[\sـ]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').toLowerCase();
const slug=s=>norm(s).replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-+|-+$/g,'').slice(0,70)||'service';
const fallbackKey=name=>'svc_'+Array.from(norm(name)).map(c=>c.codePointAt(0).toString(16)).join('_');
function build(){const C=window.GhadeerServicesV6?.catalog;if(!R||!Array.isArray(C))return;const routes={},seenRoutes=new Set(),seenKeys=new Set();for(const x of C){const role=R.normalizeRole(x.role??x.category??x.cat),serviceKey=String(x.serviceKey||fallbackKey(x.name)),route=`/services/${slug(role)}/${slug(x.name)}`;if(seenKeys.has(serviceKey))throw new Error('Duplicate serviceKey: '+serviceKey);if(seenRoutes.has(route))throw new Error('Duplicate service route: '+route);seenKeys.add(serviceKey);seenRoutes.add(route);routes[serviceKey]={...x,serviceKey,name:x.name,role,category:role,route,entry:x.entry||'GhadeerServicesV6',ownerPage:x.ownerPage||'services',lifecycle:x.lifecycle||'ui'};}
const quran={serviceKey:'svc_quran',name:'وردي / القرآن',role:'core',category:'core',route:'/quran',entry:'GhadeerQuranV5',ownerPage:'quran',lifecycle:'connected'};if(!R.get(quran.serviceKey))R.register(quran);if(seenRoutes.has(quran.route))throw new Error('Duplicate service route: '+quran.route);routes[quran.serviceKey]=quran;
window.GhadeerServiceRoutes=Object.freeze(routes);window.GhadeerResolveServiceRoute=k=>window.GhadeerServiceRoutes[String(k||'')]||null;console.info('[Ghadeer] canonical service routes',Object.keys(routes).length)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(build,0),{once:true});else setTimeout(build,0);
})();
