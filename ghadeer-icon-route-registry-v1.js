/* Ghadeer — canonical icon/route registry v7
   ONE source of truth for every clickable icon/control. */
(()=>{
'use strict';
const definitions=Object.freeze({
 home:{label:'الرئيسية',route:'live-home'},liveHome:{label:'الرئيسية',route:'live-home'},
 services:{label:'الخدمات',route:'services'},coffee:{label:'القهوة',route:'coffee'},outings:{label:'الطلعات',route:'outings'},
 members:{label:'الجيران',route:'neighbors'},neighbors:{label:'الجيران',route:'neighbors'},
 football:{label:'الكورة',route:'football'},news:{label:'أخبار الحي',route:'news'},
 neighborCheck:{label:'تفقد جار',route:'neighbor-check'},announcements:{label:'إعلانات الحي',route:'announcements'},lost:{label:'المفقودات',route:'lost'},housing:{label:'سكن الحي',route:'housing'},market:{label:'سوق الحي',route:'market'},jobs:{label:'الوظائف',route:'jobs'},occasions:{label:'مناسبات الحي',route:'occasions'},messages:{label:'تواصل الجيران',route:'messages'},hadith:{label:'الذكر',route:'hadith'},prayer:{label:'مواقيت الصلاة',route:'prayer'},weather:{label:'الطقس',route:'weather'},more:{label:'المزيد',route:'more'},developer:{label:'المطور',route:'developer'},manager:{label:'الإدارة',route:'manager'},settings:{label:'الإعدادات',route:'settings'},aboutProject:{label:'عن المشروع',route:'aboutProject'},logout:{label:'خروج',route:'logout'},
 quran:{label:'القرآن الكريم',route:'quran2'},read:{label:'المصحف',route:'quran2'},recite:{label:'تصحيح التلاوة',route:'quran2'},tajweed:{label:'التجويد',route:'quran2'},tafsir:{label:'التفسير',route:'quran2'},adhkar:{label:'الأذكار',route:'quran2'},hifz:{label:'اختبر حفظي',route:'quran2'},marks:{label:'علاماتي',route:'quran2'},download:{label:'تنزيل المصحف',route:'quran2'},
 spl:{label:'دوري روشن',route:'football'},uel:{label:'الدوري الأوروبي',route:'football'},world:{label:'الدوريات العالمية',route:'football'},king:{label:'كأس الملك',route:'football'},super:{label:'السوبر السعودي',route:'football'},ghadeer:{label:'كورة حي الغدير',route:'football'}
});
const aliases=Object.freeze({wardi:'quran',realEstate:'housing',neighborhoodEvents:'occasions','services:help':'services','services:market':'market'});
const canonicalKey=k=>aliases[String(k||'').trim()]||String(k||'').trim();
function bypassClick(el){if(!el)return false;el.dataset.ghCanonicalBypass='1';try{el.click();return true}finally{delete el.dataset.ghCanonicalBypass}}
function special(key){
 const k=canonicalKey(key);
 if(k==='developer'){if(typeof window.showManagerLogin==='function'){window.showManagerLogin();return true}return bypassClick(document.getElementById('developerAccessBtn'))}
 if(k==='liveHome'||k==='home')return window.GhadeerLiveHome?.open?.()||false;
 if(k==='news'){if(typeof window.openPage==='function')return window.openPage('news')!==false;return false}
 if(['football','spl','uel','world','king','super','ghadeer'].includes(k)){const fn=window.GhadeerFootballV2?.renderLeague;if(typeof fn!=='function')throw new Error('[Ghadeer] Football module unavailable');return fn(k==='football'?'spl':k)!==false}
 if(['quran','read','recite','tajweed','tafsir','adhkar','hifz','marks','download'].includes(k)){
   const mod=window.GhadeerQuran2Module;
   if(typeof mod?.mount!=='function'){if(typeof window.openPage==='function')return window.openPage('quran2')!==false;return !!document.getElementById('quran2')}
   return Promise.resolve(mod.mount()).then(()=>{const ids={tajweed:'tajweed',tafsir:'tafsir',adhkar:'adhkar',hifz:'hifz',marks:'bookmark',download:'offline'};const id=ids[k];if(id)document.getElementById('quran2-root')?.querySelector(`[data-q2="${id}"]`)?.click();return true})
 }
 if(k==='prayer'){
   if(typeof window.openPage==='function')return window.openPage('prayer')!==false;
   const root=document.querySelector('.gh-home-widgets');if(root&&typeof window.GhadeerHomeWidgets?.loadPrayer==='function'){root.scrollIntoView({behavior:'smooth',block:'start'});window.GhadeerHomeWidgets.loadPrayer(root);return true}return false;
 }
 if(k==='weather'){
   const b=document.querySelector('.gh-final-weather');
   if(b)return bypassClick(b);
   if(typeof window.openPage==='function')return window.openPage('weather')!==false;
   return false;
 }
 if(k==='logout'){if(typeof window.logout==='function'){window.logout();return true}if(typeof window.signOut==='function'){window.signOut();return true}return false}
 return false;
}
function open(key){const raw=String(key||'').trim(),k=canonicalKey(raw),def=definitions[k];if(!def)throw new Error('[Ghadeer] UNREGISTERED ICON/SERVICE: '+raw);const s=special(k);if(s)return s;const R=window.GHADEER_SERVICE_ROUTES;if(R?.has?.(def.route))return R.open(def.route);if(R?.has?.(k))return R.open(k);if(k==='manager'&&typeof window.openPage==='function')return window.openPage('manager');if(typeof window.openPage==='function')return window.openPage(def.route);throw new Error('[Ghadeer] ROUTE NOT IMPLEMENTED: '+k+' -> '+def.route)}
function targetFor(event){const el=event.target?.closest?.('#gh5Home .gh5-tile[data-gh5],.gh5-shell .gh5-tile[data-gh5],.gh5-nav [data-gh5],.bottom-nav [data-gh5],[data-service-route],[data-route],[data-gh-target="#__developer"],[data-gh-target="__developer"],#developerAccessBtn,.gh-final-weather');if(!el||el.dataset?.ghCanonicalBypass==='1')return null;if(el.closest('.gh5-remove,[data-custom-add],[data-custom-reset],[data-custom-done]'))return null;const raw=el.dataset?.gh5||el.dataset?.serviceRoute||el.dataset?.route;if(raw)return {el,key:raw};if(el.dataset?.ghTarget==='__developer'||el.id==='developerAccessBtn')return {el,key:'developer'};if(el.classList.contains('gh-final-weather'))return {el,key:'weather'};return null}
function audit(){const errors=[];for(const [key,def] of Object.entries(definitions)){if(!def.label||!def.route)errors.push(`${key}: incomplete definition`)}return {ok:errors.length===0,count:Object.keys(definitions).length,errors}}
if(!document.documentElement.dataset.ghCanonicalClickRouter){document.documentElement.dataset.ghCanonicalClickRouter='7';document.addEventListener('click',event=>{if(document.body.classList.contains('gh5-editing'))return;const target=targetFor(event);if(!target)return;try{const result=open(target.key);event.preventDefault();event.stopImmediatePropagation();if(result?.catch)result.catch(err=>{console.error('[Ghadeer] route failed',target.key,err);if(typeof window.toast==='function')window.toast('تعذر فتح هذه الخدمة.',false)})}catch(err){event.preventDefault();event.stopImmediatePropagation();console.error('[Ghadeer] route failed',target.key,err);if(typeof window.toast==='function')window.toast('تعذر فتح هذه الخدمة.',false)}},true)}
window.GHADEER_ICON_ROUTES=Object.freeze({definitions,open,keyFor:el=>el?.dataset?.gh5||el?.dataset?.serviceRoute||el?.dataset?.route||el?.dataset?.ghTarget||null,audit});
})();
