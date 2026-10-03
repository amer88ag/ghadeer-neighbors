/* Ghadeer final icon/service fixes v1 — no deployment logic. */
(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const toast=(m,ok=true)=>{if(typeof window.toast==='function')window.toast(m,ok);};

  function registerFootballAliases(){
    const R=window.GHADEER_SERVICE_ROUTES;
    if(!R) return;
    const openFootball=()=>{
      const fn=window.GhadeerFootballV2?.renderLeague;
      if(typeof fn==='function') return fn('spl');
      if(typeof window.openPage==='function' && document.getElementById('football')) return window.openPage('football');
      const page=document.getElementById('ghFootball');
      if(page){document.querySelectorAll('.page.active').forEach(x=>x.classList.remove('active'));page.classList.add('active');return true;}
      throw new Error('Football service unavailable');
    };
    if(!R.has('football')) R.register('football',openFootball);
    if(!R.has('sports')) R.register('sports',openFootball);
  }

  async function loadPrayerFixed(){
    const roots=[...document.querySelectorAll('.gh-home-widgets')];
    const root=roots[roots.length-1];
    if(!root){
      document.getElementById('ghLiveHome')?.scrollIntoView({behavior:'smooth',block:'start'});
      return false;
    }
    const grid=root.querySelector('[data-prayer-grid]'),next=root.querySelector('[data-prayer-next]');
    if(!grid||!next)return false;
    grid.innerHTML='<div class="ghw-next" style="grid-column:1/-1">جارٍ تحديث مواقيت أبها…</div>';
    try{
      const d=new Date();
      const key=String(d.getDate()).padStart(2,'0')+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+d.getFullYear();
      const urls=[
        `https://api.aladhan.com/v1/timingsByCity/${key}?city=Abha&country=Saudi%20Arabia&method=4&calendarMethod=UAQ&school=0&iso8601=false`,
        `https://api.aladhan.com/v1/timingsByAddress/${key}?address=Abha%2CSaudi%20Arabia&method=4&calendarMethod=UAQ&school=0&iso8601=false`
      ];
      let data=null;
      for(const u of urls){try{const r=await fetch(u,{cache:'no-store'});if(r.ok){const j=await r.json();if(j?.data?.timings){data=j.data;break;}}}catch{}}
      if(!data)throw new Error('Prayer API unavailable');
      const t=data.timings;
      const rows=[['الفجر',t.Fajr],['الظهر',t.Dhuhr],['العصر',t.Asr],['المغرب',t.Maghrib],['العشاء',t.Isha]].map(([n,v])=>[n,String(v||'—').slice(0,5)]);
      const now=d.getHours()*60+d.getMinutes();
      const mins=v=>{const [h,m]=v.split(':').map(Number);return h*60+m};
      let n=rows.find(x=>x[1]!=='—'&&mins(x[1])>now)||rows[0];
      grid.innerHTML=rows.map(x=>`<span>${x[0]}<b>${x[1]}</b></span>`).join('');
      next.textContent=`الصلاة القادمة: ${n[0]} ${n[1]}`;
      root.querySelector('[data-prayer-source]')?.replaceChildren(document.createTextNode('أوقات أبها • أم القرى'));
      return true;
    }catch(e){
      grid.innerHTML='<div class="ghw-next" style="grid-column:1/-1">تعذر تحديث المواقيت الآن. اضغط تحديث للمحاولة.</div>';
      next.textContent='أوقات أبها • أم القرى';
      return false;
    }
  }

  async function loadWeatherFixed(){
    const box=$('ghWeatherBox');
    const live=$('ghLiveHome');
    const targets=[box,live?.querySelector('#lhWeather')].filter(Boolean);
    if(!targets.length)return false;
    try{
      /* حي الغدير/أبها: لا نطلب إذن الموقع لعرض خدمة الحي الأساسية. */
      const lat=18.23,lon=42.51;
      const u=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=Asia%2FRiyadh`;
      const r=await fetch(u,{cache:'no-store'});if(!r.ok)throw new Error('Weather '+r.status);
      const w=(await r.json()).current;
      const icon=Number(w.weather_code)===0?'☀️':Number(w.weather_code)<=3?'🌤️':Number(w.weather_code)<=48?'🌫️':Number(w.weather_code)<=67?'🌧️':Number(w.weather_code)<=77?'🌨️':Number(w.weather_code)<=82?'🌦️':'⛈️';
      if(box){box.className='gh-weather gh-temp-mild';box.innerHTML=`<div><div class="gh-weather-temp">${Math.round(w.temperature_2m)}°</div><div class="gh-weather-meta">الطقس الآن في حي الغدير • المحسوسة ${Math.round(w.apparent_temperature)}°</div><div class="gh-weather-detail">💧 ${Math.round(w.relative_humidity_2m)}% • 💨 ${Math.round(w.wind_speed_10m)} كم/س</div></div><div class="gh-weather-icon">${icon}</div>`;box.onclick=loadWeatherFixed;}
      if(live?.querySelector('#lhDegree'))live.querySelector('#lhDegree').textContent=Math.round(w.temperature_2m)+'°';
      if(live?.querySelector('#lhWeather'))live.querySelector('#lhWeather').textContent=`${icon} حي الغدير • المحسوسة ${Math.round(w.apparent_temperature)}° • ${Math.round(w.wind_speed_10m)} كم/س`;
      return true;
    }catch(e){targets.forEach(t=>{t.textContent='تعذر تحديث الطقس الآن — اضغط تحديث';});return false;}
  }

  function wireHomeServiceTiles(){
    document.addEventListener('click',e=>{
      const tile=e.target.closest('.lh5-tile[data-service],.gh-launch-item[data-id]');
      if(!tile || document.body.classList.contains('gh5-editing') || tile.closest('.gh-picker'))return;
      const raw=tile.dataset.service||tile.dataset.id;
      if(!raw)return;
      const key=raw==='sports'?'football':raw==='quran'?'wardi':raw;
      const router=window.GHADEER_ICON_ROUTES;
      try{
        if(router?.open){e.preventDefault();e.stopImmediatePropagation();Promise.resolve(router.open(key)).catch(err=>{console.error(err);toast('تعذر فتح الخدمة.',false)});return;}
        if(window.GHADEER_SERVICE_ROUTES?.has?.(key)){e.preventDefault();e.stopImmediatePropagation();window.GHADEER_SERVICE_ROUTES.open(key);}
      }catch(err){e.preventDefault();e.stopImmediatePropagation();console.error(err);toast('تعذر فتح الخدمة.',false)}
    },true);
  }

  function fixLabels(){
    document.querySelectorAll('.lh5-label,.gh-launch-item strong,.lh5-tile').forEach(el=>{
      if(el.classList.contains('lh5-tile'))return;
      if(el.textContent.trim()==='وردي')el.textContent='قرآن';
    });
    document.querySelectorAll('[data-service="wardi"], [data-id="quran"]').forEach(el=>{
      el.setAttribute('aria-label','قرآن');
      const icon=el.querySelector('.lh5-icon,.gh-launch-icon');
      if(icon)icon.textContent='📖';
    });
  }

  function fixBottomNav(){
    document.querySelectorAll('.lh5-bottom [data-nav],#ghBottomNavV2 [data-bottom]').forEach(b=>{
      const k=b.dataset.nav||b.dataset.bottom;
      if(k==='settings' || k==='account'){
        b.onclick=(e)=>{e.preventDefault();e.stopImmediatePropagation();if(typeof window.showMemberAuth==='function')window.showMemberAuth();};
      }
      if(k==='wardi')b.onclick=(e)=>{e.preventDefault();e.stopImmediatePropagation();window.GHADEER_ICON_ROUTES?.open('wardi');};
      if(k==='messages')b.onclick=(e)=>{e.preventDefault();e.stopImmediatePropagation();window.GHADEER_ICON_ROUTES?.open('messages');};
    });
  }

  function hidePrayerProgress(){
    const style=document.createElement('style');style.id='ghFinalIconFixStyle';style.textContent='.lh5-progress,.lh5-times{display:none!important}.ghw-prayer.next{box-shadow:none!important}.ghw-card{animation:none!important}';document.head.appendChild(style);
  }

  function wireBackButtons(){
    document.addEventListener('click',e=>{
      const b=e.target.closest('button');if(!b)return;
      const text=(b.textContent||'').replace(/\s+/g,' ').trim();
      if(!/^(↩️?\s*)?رجوع$/.test(text))return;
      e.preventDefault();e.stopImmediatePropagation();
      if(window.GhadeerLiveHome?.open)window.GhadeerLiveHome.open();else window.openPage?.('home');
    },true);
  }

  function boot(){
    registerFootballAliases();
    wireHomeServiceTiles();
    wireBackButtons();
    hidePrayerProgress();
    document.addEventListener('click',e=>{
      const t=e.target.closest('[data-service="prayer"],[data-service="weather"],[data-nav="prayer"],[data-nav="weather"],#homePrayerBtn,#homeWeatherBtn');
      if(!t)return;
      if(t.id==='homePrayerBtn'||t.dataset.service==='prayer'||t.dataset.nav==='prayer'){e.preventDefault();e.stopImmediatePropagation();loadPrayerFixed();}
      else {e.preventDefault();e.stopImmediatePropagation();loadWeatherFixed();}
    },true);
    const obs=new MutationObserver(()=>{fixLabels();fixBottomNav();registerFootballAliases();});
    obs.observe(document.body,{childList:true,subtree:true});
    fixLabels();fixBottomNav();
    setTimeout(loadPrayerFixed,800);
    setTimeout(loadWeatherFixed,900);
    setInterval(()=>{if(document.visibilityState==='visible'){loadPrayerFixed();loadWeatherFixed();}},600000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else setTimeout(boot,0);
})();
