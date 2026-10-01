/* Canonical service routing bridge — maps service identities to existing app modules without replacing the app router. */
(()=>{'use strict';
const routes=new Map([
 ['سكن الحي',{kind:'page',keys:['housing','residential','sakan']}],
 ['تواصل الجيران',{kind:'page',keys:['neighbors','messages','chat']}],
 ['الوظائف',{kind:'page',keys:['jobs','employment','work']}],
 ['سوق الحي',{kind:'page',keys:['market','shop','store']}],
 ['مناسبات الحي',{kind:'page',keys:['events','occasions']}],
 ['أخبار الحي',{kind:'page',keys:['news','announcements']}],
 ['كورة حي الغدير',{kind:'module',module:'football'}],
 ['وردي',{kind:'module',module:'quran'}],
 ['القرآن',{kind:'module',module:'quran'}],
 ['الطقس',{kind:'module',module:'weather'}],
 ['مواقيت الصلاة',{kind:'module',module:'prayer'}],
 ['الذكر',{kind:'module',module:'dhikr'}]
]);
function candidates(key){return routes.get(key)?.keys||[]}
function pageOpen(keys){
 const fnNames=['openPage','navigateTo','goToPage','showPage'];
 for(const n of fnNames){const fn=window[n];if(typeof fn!=='function')continue;for(const k of keys){try{fn(k);return true}catch(_){}}}
 for(const k of keys){const el=document.getElementById(k);if(!el)continue;document.querySelectorAll('.page.active').forEach(x=>x.classList.remove('active'));el.classList.add('active');return true}
 return false
}
function moduleOpen(module){
 const candidatesByModule={
  football:[['GhadeerFootballV2','open'],['GhadeerFootball','open'],['GhadeerFootballV2','show'],['GhadeerFootball','show']],
  quran:[['GhadeerQuranV5','open'],['GhadeerQuran','open'],['GhadeerQuranV5','show']],
  weather:[['GhadeerWeather','open'],['GhadeerWeather','show']],
  prayer:[['GhadeerPrayer','open'],['GhadeerPrayer','show']],
  dhikr:[['GhadeerDhikr','open'],['GhadeerDhikr','show']]
 };
 for(const [obj,method] of (candidatesByModule[module]||[])){const api=window[obj];if(api&&typeof api[method]==='function'){try{api[method]();return true}catch(_){}}}
 return false
}
window.GhadeerServiceRoutes={routes,resolve(name){return routes.get(String(name||''))||null},open(name,fallback){const r=routes.get(String(name||''));if(r?.kind==='module'&&moduleOpen(r.module))return true;if(r?.kind==='page'&&pageOpen(candidates(name)))return true;return typeof fallback==='function'?fallback():false}};
})();
