/* Ghadeer — canonical icon/route registry v1
   One source of truth for home tiles, bottom navigation and direct controls. */
(()=>{
  'use strict';
  const definitions=Object.freeze({
    home:{label:'الرئيسية',route:'home'},services:{label:'الخدمات',route:'services'},coffee:{label:'القهوة',route:'coffee'},outings:{label:'الطلعات',route:'outings'},
    members:{label:'الجيران',route:'neighbors'},neighbors:{label:'الجيران',route:'neighbors'},football:{label:'الكورة',route:'football'},wardi:{label:'وردي',route:'wardi'},
    news:{label:'أخبار الحي',route:'news'},neighborCheck:{label:'تفقد جار',route:'neighbor-check'},announcements:{label:'إعلانات الحي',route:'announcements'},lost:{label:'المفقودات',route:'lost'},
    housing:{label:'سكن الحي',route:'housing'},market:{label:'سوق الحي',route:'market'},jobs:{label:'الوظائف',route:'jobs'},occasions:{label:'مناسبات الحي',route:'occasions'},
    messages:{label:'تواصل الجيران',route:'messages'},hadith:{label:'الذكر',route:'hadith'},prayer:{label:'مواقيت الصلاة',route:'prayer'},weather:{label:'الطقس',route:'weather'},
    more:{label:'المزيد',route:'more'},developer:{label:'المطور',route:'developer'},manager:{label:'الإدارة',route:'manager'},settings:{label:'الإعدادات',route:'settings'},aboutProject:{label:'عن المشروع',route:'aboutProject'},logout:{label:'خروج',route:'logout'}
  });
  const aliases=Object.freeze({realEstate:'housing',neighborhoodEvents:'occasions','services:help':'services','services:market':'market'});
  const normalize=k=>aliases[k]||String(k||'').trim();
  function open(key){
    const k=normalize(key),def=definitions[k];
    if(!def)throw new Error('[Ghadeer] Unregistered icon route: '+key);
    const R=window.GHADEER_SERVICE_ROUTES;
    if(R?.has?.(def.route))return R.open(def.route);
    if(R?.has?.(k))return R.open(k);
    if(k==='developer'&&typeof window.showManagerLogin==='function')return window.showManagerLogin();
    if(k==='developer')return document.getElementById('developerAccessBtn')?.click();
    if(typeof window.openPage==='function')return window.openPage(def.route);
    throw new Error('[Ghadeer] Route unavailable: '+def.route);
  }
  function keyFor(el){
    const raw=el?.dataset?.gh5||el?.dataset?.serviceRoute||el?.dataset?.route;
    if(raw)return raw;
    const id=el?.id;
    if(id==='developerAccessBtn')return'developer';
    if(id==='ghTempChip')return'weather';
    const text=String(el?.textContent||'').replace(/\s+/g,' ').trim();
    return Object.keys(definitions).find(k=>text.includes(definitions[k].label))||null;
  }
  function bind(){
    document.querySelectorAll('[data-gh5],[data-service-route],[data-route],#developerAccessBtn,#ghTempChip').forEach(el=>{
      if(el.dataset.ghCanonicalBound==='1')return;
      el.dataset.ghCanonicalBound='1';
      el.addEventListener('click',e=>{
        if(document.body.classList.contains('gh5-editing'))return;
        const key=keyFor(el);if(!key)return;
        e.preventDefault();e.stopImmediatePropagation();
        try{open(key)}catch(err){console.error('[Ghadeer] icon route failed',key,err)}
      },{capture:true});
    });
  }
  window.GHADEER_ICON_ROUTES=Object.freeze({definitions,open,bind,keyFor});
  bind();
  new MutationObserver(()=>bind()).observe(document.documentElement,{subtree:true,childList:true});
})();
