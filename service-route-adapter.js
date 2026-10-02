/* جيران حي الغدير — ربط صارم للمسارات المستقلة
   Route registration only. Click ownership belongs exclusively to
   GHADEER_ICON_ROUTES. This adapter must never install a competing click
   listener. */
(function(){
'use strict';
const R=window.GHADEER_SERVICE_ROUTES;
if(!R)throw new Error('GHADEER_SERVICE_ROUTES is not loaded');
const map={
  home:'home',services:'services','services:help':'services','services:market':'market',
  coffee:'coffee',outings:'outings',neighbors:'neighbors',members:'neighbors',messages:'messages',
  neighborCheck:'neighbor-check',housing:'housing',realEstate:'housing',market:'market',jobs:'jobs',
  occasions:'occasions',neighborhoodEvents:'occasions',lost:'lost',announcements:'announcements',news:'news',
  hadith:'hadith',prayer:'prayer',weather:'weather',quran:'quran',football:'football',wardi:'wardi',
  developer:'developer',manager:'manager',more:'more',settings:'settings',aboutProject:'aboutProject',logout:'logout'
};
const generic=new Set(['services','services:help','services:market','coffee','outings','neighbors','members','messages','neighborCheck','housing','realEstate','market','jobs','occasions','neighborhoodEvents','lost','announcements','news','hadith','prayer','weather','quran']);
function activate(id){const el=document.getElementById(id);if(!el)return false;document.querySelectorAll('.page.active').forEach(x=>x.classList.remove('active'));el.classList.add('active');const loader=window.GHADEER_INDEPENDENT_SERVICE_LOADERS?.[id];if(typeof loader==='function')loader();window.scrollTo({top:0,behavior:'smooth'});return true;}
function openSpecial(key){
  if(key==='developer'){if(typeof window.showManagerLogin==='function'){window.showManagerLogin();return true;}return false;}
  if(key==='manager'&&typeof window.openPage==='function'){window.openPage('manager');return true;}
  if(key==='more'){if(typeof window.GhadeerUIv5?.more==='function'){window.GhadeerUIv5.more();return true;}if(typeof window.openPage==='function'){window.openPage('more');return true;}}
  if((key==='settings'||key==='aboutProject')&&typeof window.openPage==='function'&&document.getElementById(key)){window.openPage(key);return true;}
  if(key==='logout'){if(typeof window.logout==='function'){window.logout();return true;}if(typeof window.signOut==='function'){window.signOut();return true;}}
  if(key==='prayer'){document.querySelector('.gh-home-widgets')?.scrollIntoView({behavior:'smooth',block:'start'});if(typeof window.loadPrayerByMemberLocation==='function')window.loadPrayerByMemberLocation();return true;}
  return false;
}
Object.entries(map).forEach(([key,pageId])=>{R.register(key,()=>{if(openSpecial(key))return true;if(activate(pageId))return true;if(generic.has(key)&&typeof window.openPage==='function'&&document.getElementById(pageId)){window.openPage(pageId);return true;}throw new Error('Service page is not registered: '+key+' (#'+pageId+')');});});
})();
