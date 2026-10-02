/* جيران حي الغدير — ربط صارم للمسارات المستقلة
 * لا fallback إلى open_<service> ولا إعادة توجيه صامت لخدمة أخرى.
 */
(function(){
  'use strict';
  const R=window.GHADEER_SERVICE_ROUTES;
  if(!R) throw new Error('GHADEER_SERVICE_ROUTES is not loaded');
  const map={
    services:'services',coffee:'coffee',outings:'outings',neighbors:'neighbors',
    messages:'messages',neighborCheck:'neighbor-check',housing:'housing',
    market:'market',jobs:'jobs',occasions:'occasions',lost:'lost',
    announcements:'announcements',news:'news',hadith:'hadith',prayer:'prayer',
    weather:'weather',quran:'quran',developer:'developer',more:'more',home:'home'
  };
  Object.keys(map).forEach(k=>{
    R.register(k,(payload)=>{
      const pageId=map[k];
      const el=document.getElementById(pageId);
      if(!el) throw new Error('Service page is not registered: '+k+' (#'+pageId+')');
      document.querySelectorAll('.page.active').forEach(x=>x.classList.remove('active'));
      el.classList.add('active');
      window.scrollTo({top:0,behavior:'smooth'});
      return true;
    });
  });
})();
