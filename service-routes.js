/* جيران حي الغدير — مسارات الخدمات المستقلة
 * هذا الملف يعرّف عقدًا موحدًا للخدمات دون نقل منطق البيانات من app.js.
 * لا ينشئ صفحات بديلة ولا يكرر listeners؛ بل يوفر نقطة دخول مستقلة لكل خدمة.
 */
(function(){
  'use strict';
  const routes = Object.freeze({
    home:'home', services:'services', coffee:'coffee', neighbors:'neighbors', more:'more',
    housing:'housing', market:'market', jobs:'jobs', occasions:'occasions', outings:'outings',
    lost:'lost', announcements:'announcements', news:'news', messages:'messages',
    neighborCheck:'neighbor-check', hadith:'hadith', prayer:'prayer', weather:'weather', quran:'quran', developer:'developer'
  });
  const handlers = new Map();
  function normalize(key){ return String(key||'').trim().toLowerCase(); }
  function register(key, handler){
    const k=normalize(key);
    if(!k || typeof handler!=='function') throw new TypeError('Invalid service route');
    if(handlers.has(k)) throw new Error('Duplicate service route: '+k);
    handlers.set(k, handler);
  }
  function open(key, payload){
    const k=normalize(key), handler=handlers.get(k);
    if(!handler) throw new Error('Unregistered service route: '+k);
    return handler(payload);
  }
  function has(key){ return handlers.has(normalize(key)); }
  window.GHADEER_SERVICE_ROUTES = Object.freeze({routes,register,open,has});
})();
