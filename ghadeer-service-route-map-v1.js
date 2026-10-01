/* Canonical service route map — one deterministic route per serviceKey. */
(()=>{'use strict';
const norm=s=>String(s||'').replace(/[\sـ]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').toLowerCase();
const slug=s=>norm(s).replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-+|-+$/g,'').slice(0,70)||'service';
const keyFor=(role,name)=>`svc_${slug(role)}_${slug(name)}`;
function build(){
 const R=window.GhadeerServiceRegistry,C=window.GhadeerServicesV6?.catalog,E=window.GhadeerServiceEntries;
 if(!R||!Array.isArray(C)||!E)return;
 const routes={},seenRoutes=new Set(),seenKeys=new Set();
 for(const x of C){
   const role=R.normalizeRole(x.role??x.category??x.cat);
   const serviceKey=keyFor(role,x.name);
   const route=`/services/${slug(role)}/${slug(x.name)}`;
   if(seenKeys.has(serviceKey))throw new Error('Duplicate serviceKey: '+serviceKey);
   if(seenRoutes.has(route))throw new Error('Duplicate service route: '+route);
   const entry=E.register(serviceKey).entry;
   const def={serviceKey,name:x.name,icon:x.icon,role,category:role,description:x.desc,route,entry,ownerPage:'services',lifecycle:'ui'};
   if(!R.get(serviceKey))R.register(def);else if(R.get(serviceKey).entry!==entry)throw new Error('Entry mismatch: '+serviceKey);
   seenKeys.add(serviceKey);seenRoutes.add(route);routes[serviceKey]=def;
 }
 const quranEntry='GhadeerQuran2Module';
 const quran={serviceKey:'svc_quran2',name:'وردي / القرآن',icon:'📖',role:'faith',category:'faith',route:'/quran2',entry:quranEntry,ownerPage:'quran2',lifecycle:'ui'};
 if(seenKeys.has(quran.serviceKey))throw new Error('Duplicate serviceKey: '+quran.serviceKey);
 if(seenRoutes.has(quran.route))throw new Error('Duplicate service route: '+quran.route);
 if(!R.get(quran.serviceKey))R.register(quran);
 routes[quran.serviceKey]=quran;
 const validation=R.validate();
 if(!validation.ok)throw new Error('Service Registry validation failed: '+validation.errors.join('; '));
 window.GhadeerServiceRoutes=Object.freeze(routes);
 window.GhadeerResolveServiceRoute=k=>window.GhadeerServiceRoutes[String(k||'')]||null;
 console.info('[Ghadeer] canonical service routes',Object.keys(routes).length);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(build,0),{once:true});else setTimeout(build,0);
})();
