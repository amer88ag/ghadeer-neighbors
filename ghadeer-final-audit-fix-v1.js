/* جيران حي الغدير — final audit UI hardening */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const go=id=>{
  const R=window.GHADEER_SERVICE_ROUTES;
  if(R?.has?.(id)) return R.open(id);
  if(typeof window.openPage==='function') return window.openPage(id);
};
function ensureMorePage(){
  if($('more')) return;
  const main=document.querySelector('main.wrap'); if(!main)return;
  const s=document.createElement('section'); s.id='more'; s.className='page';
  s.innerHTML=`<div class="hero"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><div><h2>⋯ المزيد</h2><p class="muted">الخدمات الإضافية والميزات الأخرى.</p></div><button class="btn secondary" type="button" data-more-back>↩️ رجوع</button></div></div><div class="grid" data-more-grid></div>`;
  const grid=s.querySelector('[data-more-grid]');
  const items=[['🚐','الطلعات','outings'],['📰','أخبار الحي','news'],['📖','القرآن والأذكار','dhikr'],['⚽','الرياضة','sports'],['❤️','تفقد جار','neighborCheck'],['💬','الرسائل والاقتراحات','messages'],['🏘️','خدمات الحي','services']];
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
  window.addEventListener('ghadeer:pagechange',sync); sync();
}
function removeDuplicateWeather(){
  const card=$('homeWeatherBtn'); if(card){const parent=card.parentElement;card.remove();if(parent&&parent.children.length===0)parent.remove();}
  $('ghWeatherBox')?.remove();
  document.querySelectorAll('[data-weather-card],.weather-card,.home-weather-card,#weatherLauncher').forEach(x=>x.remove());
}
function weatherModal(){
  if($('weatherModal'))return $('weatherModal');
  const modal=document.createElement('div');modal.id='weatherModal';modal.className='modal hidden';modal.innerHTML='<div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="weatherTitle"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><h2 id="weatherTitle">🌤️ الطقس</h2><button type="button" class="btn secondary" data-weather-close>إغلاق</button></div><div id="weatherModalContent"><p class="muted">اسمح بموقع الجوال لجلب الطقس الحالي.</p></div></div>';
  document.body.appendChild(modal);
  const close=()=>modal.classList.add('hidden');modal.querySelector('[data-weather-close]').addEventListener('click',close);modal.addEventListener('click',e=>{if(e.target===modal)close();});
  return modal;
}
async function showWeather(){
  const modal=weatherModal(),content=$('weatherModalContent');modal.classList.remove('hidden');content.innerHTML='<p class="muted">جارٍ جلب الطقس من موقع الجوال…</p>';
  if(!navigator.geolocation){content.innerHTML='<p class="status bad">الموقع غير مدعوم في هذا المتصفح.</p>';return;}
  try{
    const pos=await new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:false,timeout:12000,maximumAge:300000}));
    const {latitude,longitude}=pos.coords;const u='https://api.open-meteo.com/v1/forecast?latitude='+encodeURIComponent(latitude)+'&longitude='+encodeURIComponent(longitude)+'&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto';
    const j=await fetch(u,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('weather');return r.json()});const c=j.current||{};
    const code=Number(c.weather_code);const desc=code===0?'صحـو':code<=3?'غائم جزئيًا':code<=48?'ضباب':code<=67?'أمطار':code<=77?'ثلوج':code<=82?'زخات مطر':'أجواء متقلبة';
    content.innerHTML=`<div style="text-align:center;padding:12px"><div style="font-size:48px">${code===0?'☀️':code<=3?'🌤️':code<=67?'🌧️':'🌥️'}</div><div style="font-size:42px;font-weight:900;color:var(--g)">${Math.round(c.temperature_2m)}°</div><h3>${desc}</h3><p>💧 الرطوبة ${Math.round(c.relative_humidity_2m??0)}%</p><p>💨 الرياح ${Math.round(c.wind_speed_10m??0)} كم/س</p><small class="muted">حسب موقع الجوال — لا يتم حفظ الإحداثيات.</small></div>`;
  }catch(e){content.innerHTML='<p class="status bad">تعذر جلب الطقس. تأكد من السماح بالموقع والاتصال بالإنترنت.</p>';}
}
function installWeatherLauncher(){
  removeDuplicateWeather();
  const chip=$('ghTempChip');const header=document.querySelector('.appbar');if(!chip||!header)return;
  const head=header.querySelector('.appbar-head');const right=header.querySelector('.appbar-login');
  chip.className='gh-temp-square';chip.title='الطقس — اضغط لفتح التفاصيل';chip.setAttribute('aria-label','فتح الطقس');
  chip.style.cssText='width:42px;height:42px;min-width:42px;padding:0;border-radius:11px;border:1px solid #ffffffaa;background:#fff;color:#176b45;font-size:20px;font-weight:900;display:grid;place-items:center;box-shadow:0 2px 8px #0002;cursor:pointer';
  let box=$('ghWeatherHeaderBox');if(!box){box=document.createElement('div');box.id='ghWeatherHeaderBox';box.style.cssText='display:flex;align-items:center;gap:8px;flex-shrink:0';if(head&&right)head.insertBefore(box,right);}
  if(box)box.appendChild(chip); if(right&&box&&!box.contains(right))box.appendChild(right);
  chip.onclick=showWeather;
}
function moveFooter(){
  const main=document.querySelector('main.wrap'),footer=document.querySelector('.footer');if(!main||!footer)return;
  main.appendChild(footer);footer.style.marginTop='36px';footer.style.paddingBottom='28px';
  if(!footer.querySelector('a[href^="mailto:"]'))footer.insertAdjacentHTML('beforeend','<div style="margin-top:6px">التواصل: <a href="mailto:amer88ag@gmail.com">amer88ag@gmail.com</a></div>');
}
function patchPageChange(){
  if(window.__ghadeerPagePatched)return;const original=window.openPage;if(typeof original!=='function')return;window.__ghadeerPagePatched=true;
  window.openPage=function(id){const result=original.apply(this,arguments);setTimeout(()=>{window.dispatchEvent(new Event('ghadeer:pagechange'));ensureMorePage();installWeatherLauncher();moveFooter();},30);return result;};
}
function boot(){ensureMorePage();normalizeNav();patchPageChange();installWeatherLauncher();moveFooter();setTimeout(()=>window.dispatchEvent(new Event('ghadeer:pagechange')),50);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
