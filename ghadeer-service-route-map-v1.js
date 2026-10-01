/* Canonical service route map — one deterministic route per serviceKey. */
(()=>{'use strict';
const norm=s=>String(s||'').replace(/[\sـ]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').toLowerCase();
const slug=s=>norm(s).replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-+|-+$/g,'').slice(0,70)||'service';
const keyFor=(role,name)=>`svc_${slug(role)}_${slug(name)}`;
function build(){
 const R=window.GhadeerServiceRegistry,C=window.GhadeerServicesV6?.catalog;
 if(!R||!Array.isArray(C))return;
 const routes={},seenRoutes=new Set(),seenKeys=new Set();
 for(const x of C){
   const role=R.normalizeRole(x.role??x.category??x.cat);
   const serviceKey=keyFor(role,x.name);
   const route=`/services/${slug(role)}/${slug(x.name)}`;
   if(seenKeys.has(serviceKey))throw new Error('Duplicate serviceKey: '+serviceKey);
   if(seenRoutes.has(route))throw new Error('Duplicate service route: '+route);
   const def={serviceKey,name:x.name,role,category:role,route,entry:'GhadeerServicesV6',ownerPage:'services',lifecycle:'ui'};
   R.register(def);
   seenKeys.add(serviceKey);seenRoutes.add(route);routes[serviceKey]=def;
 }
 const quran={serviceKey:'svc_quran2',name:'وردي / القرآن',role:'faith',category:'faith',route:'/quran2',entry:'GhadeerQuran2Module',ownerPage:'quran2',lifecycle:'ui'};
 if(seenKeys.has(quran.serviceKey))throw new Error('Duplicate serviceKey: '+quran.serviceKey);
 if(seenRoutes.has(quran.route))throw new Error('Duplicate service route: '+quran.route);
 R.register(quran);routes[quran.serviceKey]=quran;
 const validation=R.validate();
 if(!validation.ok)throw new Error('Service Registry validation failed: '+validation.errors.join('; '));
 window.GhadeerServiceRoutes=Object.freeze(routes);
 window.GhadeerResolveServiceRoute=k=>window.GhadeerServiceRoutes[String(k||'')]||null;
 console.info('[Ghadeer] canonical service routes',Object.keys(routes).length);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(build,0),{once:true});else setTimeout(build,0);
})();
