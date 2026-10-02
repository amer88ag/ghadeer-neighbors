/* جيران حي الغدير — ربط صارم للمسارات المستقلة */
(function(){
'use strict';
const R=window.GHADEER_SERVICE_ROUTES;
if(!R)throw new Error('GHADEER_SERVICE_ROUTES is not loaded');
const map={services:'services',coffee:'coffee',outings:'outings',neighbors:'neighbors',messages:'messages',neighborCheck:'neighbor-check',housing:'housing',market:'market',jobs:'jobs',occasions:'occasions',lost:'lost',announcements:'announcements',news:'news',hadith:'hadith',prayer:'prayer',weather:'weather',quran:'quran',developer:'developer',more:'more',home:'home'};
const generic=new Set(['services','coffee','outings','neighbors','messages','neighborCheck','housing','market','jobs','occasions','lost','announcements','news','hadith','quran']);
function activate(id){
  const el=document.getElementById(id);
  if(!el)return false;
  document.querySelectorAll('.page.active').forEach(x=>x.classList.remove('active'));
  el.classList.add('active');
  const loader=window.GHADEER_INDEPENDENT_SERVICE_LOADERS?.[id];
  if(typeof loader==='function')loader();
  window.scrollTo({top:0,behavior:'smooth'});
  return true;
}
function openSpecial(key){
  if(key==='developer'){
    if(typeof window.showManagerLogin==='function'){window.showManagerLogin();return true;}
    document.getElementById('developerAccessBtn')?.click();return true;
  }
  if(key==='manager'){
    if(typeof window.openPage==='function'){window.openPage('manager');return true;}
  }
  if(key==='more'){
    if(typeof window.GhadeerUIv5?.more==='function'){window.GhadeerUIv5.more();return true;}
    if(typeof window.openPage==='function'){window.openPage('more');return true;}
  }
  if(key==='weather'){
    document.getElementById('ghTempChip')?.click();return true;
  }
  if(key==='prayer'){
    const box=document.querySelector('.gh-home-widgets');
    box?.scrollIntoView({behavior:'smooth',block:'start'});
    if(typeof window.loadPrayerByMemberLocation==='function')window.loadPrayerByMemberLocation();
    return true;
  }
  if(key==='football'){
    if(typeof window.GhadeerFootballV2?.renderLeague==='function')return !!window.GhadeerFootballV2.renderLeague('spl');
  }
  if(key==='wardi'){
    const m=window.GhadeerQuran2Module;
    if(typeof m?.mount==='function'){Promise.resolve(m.mount()).catch(console.error);return true;}
    if(typeof window.openPage==='function'){window.openPage('quran2');return true;}
  }
  return false;
}
Object.keys(map).forEach(k=>{
 R.register(k,()=>{
  if(openSpecial(k))return true;
  const pageId=map[k];
  if(!generic.has(k) && activate(pageId))return true;
  if(activate(pageId))return true;
  if(typeof window.openPage==='function' && document.getElementById(pageId))return window.openPage(pageId),true;
  throw new Error('Service page is not registered: '+k+' (#'+pageId+')');
 });
});
})();
