/* جيران حي الغدير — المسجل الوحيد لمسارات الخدمات المستقلة.
   Click ownership belongs exclusively to GHADEER_ICON_ROUTES.
   service-pages.js is loaded by build.js; this file must not inject it again. */
(function(){
  'use strict';
  const routes=Object.freeze({
    home:'home',services:'services',coffee:'coffee',neighbors:'neighbors',more:'more',
    housing:'housing',market:'market',jobs:'jobs',occasions:'occasions',outings:'outings',
    lost:'lost',announcements:'announcements',news:'news',messages:'messages',
    neighborCheck:'neighbor-check',hadith:'hadith',prayer:'prayer',weather:'weather',
    quran:'quran',football:'football',wardi:'wardi',developer:'developer',manager:'manager',
    settings:'settings',aboutProject:'aboutProject',logout:'logout'
  });
  const handlers=new Map();
  const normalize=k=>String(k||'').trim().toLowerCase();
  function register(key,handler){
    const k=normalize(key);
    if(!k||typeof handler!=='function')throw new TypeError('Invalid service route');
    if(handlers.has(k))throw new Error('Duplicate service route: '+k);
    handlers.set(k,handler);
  }
  function open(key,payload){
    const k=normalize(key),handler=handlers.get(k);
    if(!handler)throw new Error('Unregistered service route: '+k);
    return handler(payload);
  }
  window.GHADEER_SERVICE_ROUTES=Object.freeze({routes,register,open,go:open,has:key=>handlers.has(normalize(key)),list:()=>Object.freeze([...handlers.keys()])});
})();