/* Ghadeer — canonical icon/route registry v2
   ONE source of truth for every clickable icon/control.
   The registry is deliberately loaded last by build.js so it can arbitrate
   legacy click handlers without changing the underlying service code. */
(()=>{
  'use strict';

  const definitions=Object.freeze({
    home:{label:'الرئيسية',route:'home'},
    services:{label:'الخدمات',route:'services'},
    coffee:{label:'القهوة',route:'coffee'},
    outings:{label:'الطلعات',route:'outings'},
    members:{label:'الجيران',route:'neighbors'},
    neighbors:{label:'الجيران',route:'neighbors'},
    football:{label:'الكورة',route:'football'},
    wardi:{label:'وردي',route:'wardi'},
    news:{label:'أخبار الحي',route:'news'},
    neighborCheck:{label:'تفقد جار',route:'neighbor-check'},
    announcements:{label:'إعلانات الحي',route:'announcements'},
    lost:{label:'المفقودات',route:'lost'},
    housing:{label:'سكن الحي',route:'housing'},
    market:{label:'سوق الحي',route:'market'},
    jobs:{label:'الوظائف',route:'jobs'},
    occasions:{label:'مناسبات الحي',route:'occasions'},
    messages:{label:'تواصل الجيران',route:'messages'},
    hadith:{label:'الذكر',route:'hadith'},
    prayer:{label:'مواقيت الصلاة',route:'prayer'},
    weather:{label:'الطقس',route:'weather'},
    more:{label:'المزيد',route:'more'},
    developer:{label:'المطور',route:'developer'},
    manager:{label:'الإدارة',route:'manager'},
    settings:{label:'الإعدادات',route:'settings'},
    aboutProject:{label:'عن المشروع',route:'aboutProject'},
    logout:{label:'خروج',route:'logout'},
    // Football sub-routes
    spl:{label:'دوري روشن',route:'football'},
    uel:{label:'الدوري الأوروبي',route:'football'},
    world:{label:'الدوريات العالمية',route:'football'},
    king:{label:'كأس الملك',route:'football'},
    super:{label:'السوبر السعودي',route:'football'},
    ghadeer:{label:'كورة حي الغدير',route:'football'},
    // Quran sub-routes
    read:{label:'المصحف',route:'wardi'},
    recite:{label:'تصحيح التلاوة',route:'wardi'},
    tajweed:{label:'التجويد',route:'wardi'},
    tafsir:{label:'التفسير',route:'wardi'},
    adhkar:{label:'الأذكار',route:'wardi'},
    hifz:{label:'اختبر حفظي',route:'wardi'},
    marks:{label:'علاماتي',route:'wardi'},
    download:{label:'تنزيل المصحف',route:'wardi'}
  });

  const aliases=Object.freeze({
    realEstate:'housing',
    neighborhoodEvents:'occasions',
    'services:help':'services',
    'services:market':'market',
    members:'members',
    quran:'wardi'
  });

  const normalize=k=>String(k||'').trim();
  const canonicalKey=k=>aliases[k]||k;

  function special(key){
    const k=canonicalKey(key);

    if(k==='developer'){
      if(typeof window.showManagerLogin==='function'){window.showManagerLogin();return true;}
      document.getElementById('developerAccessBtn')?.click();
      return true;
    }

    if(['spl','uel','world','king','super','ghadeer'].includes(k)){
      const fn=window.GhadeerFootballV2?.renderLeague;
      if(typeof fn!=='function')throw new Error('[Ghadeer] Football module unavailable');
      const ok=fn(k);
      return ok!==false;
    }

    if(['wardi','read','recite','tajweed','tafsir','adhkar','hifz','marks','download'].includes(k)){
      const mod=window.GhadeerQuran2Module;
      if(typeof mod?.mount!=='function'){
        if(typeof window.openPage==='function')window.openPage('quran2');
        return !!document.getElementById('quran2');
      }
      return Promise.resolve(mod.mount()).then(()=>{
        const ids={tajweed:'tajweed',tafsir:'tafsir',adhkar:'adhkar',hifz:'hifz',marks:'bookmark',download:'offline'};
        const id=ids[k];
        if(id)document.getElementById('quran2-root')?.querySelector(`[data-q2="${id}"]`)?.click();
        return true;
      });
    }

    if(k==='weather'){
      const chip=document.getElementById('ghTempChip');
      if(chip){chip.click();return true;}
      document.querySelector('.gh-final-weather')?.click();
      return true;
    }

    if(k==='prayer'){
      const root=document.querySelector('.gh-home-widgets');
      root?.scrollIntoView({behavior:'smooth',block:'start'});
      if(typeof window.GhadeerHomeWidgets?.loadPrayer==='function'){
        window.GhadeerHomeWidgets.loadPrayer(root);
      }
      return true;
    }

    if(k==='logout'){
      if(typeof window.logout==='function'){window.logout();return true;}
      if(typeof window.signOut==='function'){window.signOut();return true;}
      return false;
    }

    return false;
  }

  function open(key){
    const raw=normalize(key);
    const k=canonicalKey(raw);
    const def=definitions[k];
    if(!def)throw new Error('[Ghadeer] UNREGISTERED ICON/SERVICE: '+raw);

    const s=special(k);
    if(s)return s;

    const R=window.GHADEER_SERVICE_ROUTES;
    if(R?.has?.(def.route))return R.open(def.route);
    if(R?.has?.(k))return R.open(k);

    if(k==='manager'&&typeof window.openPage==='function')return window.openPage('manager');
    if(typeof window.openPage==='function'&&document.getElementById(def.route))return window.openPage(def.route);

    throw new Error('[Ghadeer] ROUTE NOT IMPLEMENTED: '+k+' -> '+def.route);
  }

  function targetFor(event){
    const el=event.target?.closest?.(
      '#gh5Home .gh5-tile[data-gh5],'+
      '.gh5-shell .gh5-tile[data-gh5],'+
      '.gh5-nav [data-gh5],'+
      '.bottom-nav [data-gh5],'+
      '[data-service-route],'+
      '[data-route],'+
      '#developerAccessBtn,'+
      '#ghTempChip'
    );
    if(!el)return null;
    if(el.closest('.gh5-remove,[data-custom-add],[data-custom-reset],[data-custom-done]'))return null;
    const raw=el.dataset?.gh5||el.dataset?.serviceRoute||el.dataset?.route;
    if(raw)return {el,key:raw};
    if(el.id==='developerAccessBtn')return {el,key:'developer'};
    if(el.id==='ghTempChip')return {el,key:'weather'};
    return null;
  }

  // One delegated capture handler is more reliable than attaching competing
  // onclick handlers to every tile. It also catches dynamically-created tiles.
  if(!document.documentElement.dataset.ghCanonicalClickRouter){
    document.documentElement.dataset.ghCanonicalClickRouter='2';
    document.addEventListener('click',event=>{
      if(document.body.classList.contains('gh5-editing'))return;
      const target=targetFor(event);
      if(!target)return;
      try{
        const result=open(target.key);
        event.preventDefault();
        event.stopImmediatePropagation();
        if(result?.catch)result.catch(err=>console.error('[Ghadeer] route failed',target.key,err));
      }catch(err){
        event.preventDefault();
        event.stopImmediatePropagation();
        console.error('[Ghadeer] route failed',target.key,err);
        if(typeof window.toast==='function')window.toast('تعذر فتح هذه الخدمة. راجع مسار الخدمة.',false);
      }
    },true);
  }

  window.GHADEER_ICON_ROUTES=Object.freeze({definitions,open,keyFor:el=>el?.dataset?.gh5||el?.dataset?.serviceRoute||el?.dataset?.route||null});
})();
