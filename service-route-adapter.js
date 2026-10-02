/* جيران حي الغدير — ربط الواجهة بعقد المسارات المستقلة
 * لا ينشئ صفحات بديلة ولا ينسخ منطق البيانات. يمنع التوجيه الصامت لخدمة إلى خدمة أخرى.
 */
(function(){
  'use strict';
  const R=window.GHADEER_SERVICE_ROUTES;
  if(!R) return;
  const map={
    services:'services',coffee:'coffee',outings:'outings',neighbors:'neighbors',
    messages:'messages',neighborCheck:'neighbor-check',housing:'housing',
    market:'market',jobs:'jobs',occasions:'occasions',lost:'lost',
    announcements:'announcements',news:'news',hadith:'hadith',prayer:'prayer',
    weather:'weather',quran:'quran',developer:'developer',more:'more',home:'home'
  };
  Object.keys(map).forEach(k=>{
    R.register(k,(payload)=>{
      const page=map[k];
      const el=document.getElementById(page);
      if(el){
        document.querySelectorAll('.page.active').forEach(x=>x.classList.remove('active'));
        el.classList.add('active');
        window.scrollTo({top:0,behavior:'smooth'});
        return true;
      }
      const opener=window['open_'+k];
      if(typeof opener==='function') return opener(payload);
      throw new Error('Service page is not registered: '+k);
    });
  });
})();
