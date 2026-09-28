(()=>{
  'use strict';
  function safe(fn){try{return fn()}catch(e){console.error('[ghadeer runtime]',e);return null}}
  function bind(){
    safe(()=>{
      const p=window.loadPrayerByMemberLocation;
      ['homePrayerBtn','prayerRefreshBtn'].forEach(id=>{const b=document.getElementById(id);if(b&&typeof p==='function'){b.onclick=null;b.addEventListener('click',p);}});
      const w=document.getElementById('homeWeatherBtn');
      if(w){w.onclick=null;w.addEventListener('click',()=>{const box=document.getElementById('ghWeatherBox');if(box&&typeof box.onclick==='function')box.onclick();else if(typeof window.loadWeather==='function')window.loadWeather();});}
      // Re-bind common navigation/action controls after enhancement scripts replace page markup.
      document.querySelectorAll('[data-page]').forEach(b=>{if(!b.dataset.runtimeBound){b.dataset.runtimeBound='1';b.addEventListener('click',()=>{const page=b.dataset.page;if(typeof window.openPage==='function')window.openPage(page);});}});
      document.querySelectorAll('[data-action]').forEach(b=>{if(!b.dataset.runtimeBound){b.dataset.runtimeBound='1';b.addEventListener('click',()=>{const fn=b.dataset.action;if(typeof window[fn]==='function')window[fn]();});}});
    });
  }
  function observe(){
    bind();
    const root=document.getElementById('app')||document.body;
    new MutationObserver(()=>bind()).observe(root,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observe,{once:true});else observe();
})();
