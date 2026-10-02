/* جيران حي الغدير — مسارات الخدمات المستقلة */
(function(){
  'use strict';
  const routes=Object.freeze({
    home:'home',services:'services',coffee:'coffee',neighbors:'neighbors',more:'more',
    housing:'housing',market:'market',jobs:'jobs',occasions:'occasions',outings:'outings',
    lost:'lost',announcements:'announcements',news:'news',messages:'messages',
    neighborCheck:'neighbor-check',hadith:'hadith',prayer:'prayer',weather:'weather',quran:'quran',developer:'developer'
  });
  const handlers=new Map();
  const normalize=k=>String(k||'').trim().toLowerCase();
  function register(key,handler){const k=normalize(key);if(!k||typeof handler!=='function')throw new TypeError('Invalid service route');if(handlers.has(k))throw new Error('Duplicate service route: '+k);handlers.set(k,handler);}
  function open(key,payload){const k=normalize(key),handler=handlers.get(k);if(!handler)throw new Error('Unregistered service route: '+k);return handler(payload);}
  window.GHADEER_SERVICE_ROUTES=Object.freeze({routes,register,open,go:open,has:key=>handlers.has(normalize(key))});
  // Load independent service pages after the route registry exists. Each page
  // owns its data loader and never falls back to another service.
  const s=document.createElement('script');s.src='service-pages.js?v=20261002';s.defer=false;document.head.appendChild(s);
})();
