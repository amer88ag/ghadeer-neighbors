/* جيران حي الغدير — final audit UI hardening */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const go=id=>{if(typeof window.openPage==='function')window.openPage(id);};
function ensureMorePage(){
  if($('more')) return;
  const main=document.querySelector('main.wrap'); if(!main)return;
  const s=document.createElement('section'); s.id='more'; s.className='page';
  s.innerHTML=`<div class="hero"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><div><h2>⋯ المزيد</h2><p class="muted">الخدمات الإضافية والميزات الأخرى.</p></div><button class="btn secondary" type="button" data-more-back>↩️ رجوع</button></div></div><div class="grid" data-more-grid></div>`;
  const grid=s.querySelector('[data-more-grid]');
  const items=[
    ['🚐','الطلعات','outings'],['📰','أخبار الحي','news'],['📖','القرآن والأذكار','dhikr'],['⚽','الرياضة','sports'],['❤️','تفقد جار','neighborCheck'],['💬','الرسائل والاقتراحات','messages'],['🏘️','خدمات الحي','services']
  ];
  for(const [icon,title,id] of items){const b=document.createElement('button');b.className='card icon-card';b.type='button';b.innerHTML=`<span class="icon">${icon}</span><span><b>${title}</b><br><small>فتح المسار المستقل</small></span>`;b.addEventListener('click',()=>go(id));grid.appendChild(b);}
  s.querySelector('[data-more-back]').addEventListener('click',()=>go('home'));
  main.appendChild(s);
}
function normalizeNav(){
  const nav=document.querySelector('.bottom-nav'); if(!nav)return;
  nav.innerHTML='';
  const items=[['home','🏠','الرئيسية'],['services','🧰','الخدمات'],['coffee','☕','القهوة'],['members','👥','الجيران'],['more','⋯','المزيد']];
  for(const [id,icon,label] of items){const b=document.createElement('button');b.type='button';b.dataset.page=id;b.innerHTML=`${icon}<br>${label}`;b.addEventListener('click',()=>go(id));nav.appendChild(b);}
  const sync=()=>{const active=document.querySelector('.page.active')?.id;nav.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.page===active));};
  window.addEventListener('ghadeer:pagechange',sync);
  sync();
}
function removeDuplicateWeather(){
  const card=$('homeWeatherBtn');
  if(card){const parent=card.parentElement;card.remove();if(parent&&parent.children.length===0)parent.remove();}
  document.querySelectorAll('[data-weather-card],.weather-card,.home-weather-card').forEach(x=>x.remove());
}
function installWeatherLauncher(){
  removeDuplicateWeather();
  const header=document.querySelector('.appbar'); if(!header||$('weatherLauncher'))return;
  const btn=document.createElement('button');btn.id='weatherLauncher';btn.type='button';btn.setAttribute('aria-label','فتح الطقس');btn.title='الطقس';
  btn.style.cssText='width:42px;height:42px;border-radius:12px;border:1px solid #ffffff99;background:#ffffff;color:#176b45;font-size:21px;font-weight:800;display:grid;place-items:center;box-shadow:0 2px 8px #0002';
  btn.textContent='☀️';
  const head=header.querySelector('.appbar-head');const right=header.querySelector('.appbar-login');
  const box=document.createElement('div');box.style.cssText='display:flex;align-items:center;gap:8px;flex-shrink:0';box.appendChild(btn);if(right)box.appendChild(right);if(head&&right)head.appendChild(box);
  const modal=document.createElement('div');modal.id='weatherModal';modal.className='modal hidden';modal.innerHTML='<div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="weatherTitle"><div style="display:flex;justify-content:space-between;align-items:center"><h2 id="weatherTitle">🌤️ الطقس</h2><button type="button" class="btn secondary" data-weather-close>إغلاق</button></div><div id="weatherModalContent"><p class="muted">جارٍ تحميل بيانات الطقس…</p></div></div>';
  document.body.appendChild(modal);
  const content=modal.querySelector('#weatherModalContent');
  const close=()=>modal.classList.add('hidden');
  modal.querySelector('[data-weather-close]').addEventListener('click',close);modal.addEventListener('click',e=>{if(e.target===modal)close();});
  btn.addEventListener('click',async()=>{modal.classList.remove('hidden');content.innerHTML='<p class="muted">يتم تحديث الطقس…</p>';try{if(typeof window.openWeather==='function'){await window.openWeather();const source=document.querySelector('#weatherContent,#weatherDetails,#weatherPanel');if(source)content.innerHTML=source.innerHTML;}else{content.innerHTML='<p class="muted">الطقس متاح عند تحديث بيانات الموقع.</p>';}}catch(e){content.innerHTML='<p class="status bad">تعذر تحميل الطقس حاليًا.</p>';}});
}
function moveFooter(){
  const main=document.querySelector('main.wrap'),footer=document.querySelector('.footer');if(!main||!footer)return;
  main.appendChild(footer);footer.style.marginTop='28px';footer.style.paddingBottom='24px';
  if(!footer.querySelector('a[href^="mailto:"]'))footer.insertAdjacentHTML('beforeend','<div style="margin-top:6px">التواصل: <a href="mailto:amer88ag@gmail.com">amer88ag@gmail.com</a></div>');
}
function patchPageChange(){
  if(window.__ghadeerPagePatched)return;window.__ghadeerPagePatched=true;
  const original=window.openPage;
  if(typeof original!=='function')return;
  window.openPage=function(id){const result=original.apply(this,arguments);setTimeout(()=>window.dispatchEvent(new Event('ghadeer:pagechange')),0);return result;};
}
function boot(){ensureMorePage();normalizeNav();patchPageChange();installWeatherLauncher();moveFooter();setTimeout(()=>window.dispatchEvent(new Event('ghadeer:pagechange')),50);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
