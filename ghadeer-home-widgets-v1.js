/* Ghadeer Home Widgets v1 — weather, prayer times, next prayer, dhikr ticker on the canonical home. */
(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const WEATHER={lat:18.2164,lon:42.5053,label:'الغدير — المحالة، أبها'};
  const dhikr=[
    'سبحان الله وبحمده',
    'سبحان الله العظيم',
    'لا إله إلا الله وحده لا شريك له',
    'اللهم صل وسلم على نبينا محمد',
    'أستغفر الله وأتوب إليه',
    'لا حول ولا قوة إلا بالله'
  ];
  let dhikrIndex=0, weatherTimer=null, prayerTimer=null;

  function style(){
    if($('ghHomeWidgetsStyle'))return;
    const s=document.createElement('style');s.id='ghHomeWidgetsStyle';s.textContent=`
      .gh-home-widgets{display:grid;gap:10px;margin:10px 0 12px}
      .ghw-card{background:#fff;border:1px solid var(--line);border-radius:18px;overflow:hidden;box-shadow:0 5px 18px #00000008}
      .ghw-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 13px;border-bottom:1px solid var(--line)}
      .ghw-head b{color:var(--g);font-size:15px}.ghw-head small{color:var(--muted);font-size:10px}
      .ghw-weather{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px;color:#fff;background:linear-gradient(135deg,#1f8f72,#74ca69);cursor:pointer}
      .ghw-weather.temp-cold{background:linear-gradient(135deg,#1767c8,#55b8ff)}.ghw-weather.temp-hot{background:linear-gradient(135deg,#d79b22,#ef6c2f)}
      .ghw-temp{font-size:34px;font-weight:900;line-height:1}.ghw-meta{font-size:11px;margin-top:5px;opacity:.95}.ghw-weather-icon{font-size:39px}
      .ghw-prayers{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;padding:10px}.ghw-prayer{border:1px solid var(--line);border-radius:13px;padding:8px 4px;text-align:center;background:#fff}.ghw-prayer b{display:block;font-size:11px}.ghw-prayer span{display:block;margin-top:4px;color:var(--g);font-weight:900;font-size:14px}.ghw-prayer.next{background:#eef8f1;border-color:#a9cfb5;box-shadow:inset 0 0 0 1px #d8ecde}.ghw-next{padding:0 10px 10px;color:var(--muted);font-size:12px;text-align:center}.ghw-actions{display:flex;gap:6px;padding:0 10px 10px}.ghw-actions button{flex:1;border:1px solid var(--line);background:#fff;border-radius:10px;padding:7px;color:var(--g);font-size:11px}
      .ghw-dhikr{display:flex;align-items:center;gap:8px;padding:8px 11px;background:#f4faf6;border:1px solid #dcebe1;border-radius:14px;color:var(--g)}.ghw-dhikr strong{white-space:nowrap;font-size:12px}.ghw-dhikr span{min-width:0;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:800;font-size:13px}.ghw-dhikr button{border:0;background:transparent;color:var(--g);font-size:17px;padding:1px 4px}
      @media(max-width:650px){.ghw-prayers{grid-template-columns:repeat(5,1fr);gap:4px}.ghw-prayer{padding:7px 2px}.ghw-prayer b{font-size:10px}.ghw-prayer span{font-size:12px}.ghw-next{font-size:11px}}
    `;document.head.appendChild(s);
  }
  function timeNow(){return new Date();}
  function todayKey(){const d=new Date();return String(d.getDate()).padStart(2,'0')+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+d.getFullYear()}
  function weatherIcon(code){code=Number(code);if(code===0)return'☀️';if(code<=3)return'🌤️';if(code<=48)return'🌫️';if(code<=67)return'🌧️';if(code<=77)return'🌨️';if(code<=82)return'🌦️';return'⛈️'}
  function weatherClass(t){return t<=12?'temp-cold':t>=35?'temp-hot':''}
  async function loadWeather(box){
    try{
      const u=`https://api.open-meteo.com/v1/forecast?latitude=${WEATHER.lat}&longitude=${WEATHER.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=Asia%2FRiyadh`;
      const r=await fetch(u,{cache:'no-store'});if(!r.ok)throw Error('weather');const j=await r.json();const w=j.current||{};const t=Math.round(Number(w.temperature_2m));
      box.className='ghw-weather '+weatherClass(t);box.innerHTML=`<div><div class="ghw-temp">${Number.isFinite(t)?t:'—'}°</div><div class="ghw-meta">الحرارة الحالية • المحسوسة ${Math.round(Number(w.apparent_temperature)||0)}°</div><div class="ghw-meta">💧 ${Math.round(Number(w.relative_humidity_2m)||0)}% • 💨 ${Math.round(Number(w.wind_speed_10m)||0)} كم/س</div><div class="ghw-meta">${esc(WEATHER.label)}</div></div><div class="ghw-weather-icon">${weatherIcon(w.weather_code)}</div>`;
    }catch(e){box.innerHTML='<div><b>🌡️ الطقس</b><div class="ghw-meta">تعذر تحديث الطقس حاليًا — اضغط لإعادة المحاولة.</div></div><div class="ghw-weather-icon">↻</div>';box.className='ghw-weather'}
  }
  function normalizeTime(v){const m=String(v||'').match(/(\d{1,2}):(\d{2})/);return m?`${String(Number(m[1])).padStart(2,'0')}:${m[2]}`:'—'}
  function mins(hm){const [h,m]=hm.split(':').map(Number);return h*60+m}
  function fmtRemaining(n){if(n<=0)return'الآن';const h=Math.floor(n/60),m=n%60;return h?`بعد ${h} ساعة${m?` و${m} دقيقة`:''}`:`بعد ${m} دقيقة`}
  async function loadPrayer(root){
    const grid=root.querySelector('[data-prayer-grid]'), next=root.querySelector('[data-prayer-next]');if(!grid||!next)return;
    try{
      const u=`https://api.aladhan.com/v1/timingsByCity/${todayKey()}?city=Abha&country=Saudi%20Arabia&method=4&calendarMethod=UAQ&school=0&iso8601=false`;
      const r=await fetch(u,{cache:'no-store'});if(!r.ok)throw Error('prayer');const j=await r.json();const t=j?.data?.timings||{};
      const rows=[['الفجر',t.Fajr],['الظهر',t.Dhuhr],['العصر',t.Asr],['المغرب',t.Maghrib],['العشاء',t.Isha]].map(([n,v])=>[n,normalizeTime(v)]);
      const now=timeNow();const cur=now.getHours()*60+now.getMinutes();let nextRow=rows.find(x=>x[1]!=='—'&&mins(x[1])>cur);if(!nextRow)nextRow=rows[0];
      grid.innerHTML=rows.map(x=>`<div class="ghw-prayer ${x[0]===nextRow[0]?'next':''}"><b>${x[0]}</b><span>${x[1]}</span></div>`).join('');
      const delta=nextRow[1]==='—'?0:((mins(nextRow[1])-cur+1440)%1440);next.textContent=`الصلاة القادمة: ${nextRow[0]} ${nextRow[1]} — ${fmtRemaining(delta)}`;
      root.querySelector('[data-prayer-source]').textContent='أوقات أبها • أم القرى';
    }catch(e){grid.innerHTML='<div class="ghw-next" style="grid-column:1/-1">تعذر تحميل مواقيت الصلاة حاليًا.</div>';next.textContent='اضغط تحديث للمحاولة مرة أخرى';}
  }
  function mount(){
    const home=$('gh5Home');if(!home)return;
    style();let root=home.querySelector('.gh-home-widgets');
    if(!root){root=document.createElement('div');root.className='gh-home-widgets';const shell=home.querySelector('.gh5-shell');if(!shell)return;const grid=shell.querySelector('.gh5-grid');if(grid)grid.insertAdjacentElement('afterend',root);else shell.appendChild(root);}
    root.innerHTML=`
      <div class="ghw-card"><div class="ghw-head"><b>🌤️ الطقس</b><small>الغدير — المحالة</small></div><div class="ghw-weather" data-weather role="button" tabindex="0" aria-label="تحديث الطقس"></div></div>
      <div class="ghw-card"><div class="ghw-head"><b>🕌 مواقيت الصلاة</b><small data-prayer-source>أبها • أم القرى</small></div><div class="ghw-prayers" data-prayer-grid></div><div class="ghw-next" data-prayer-next>جارٍ تحميل المواقيت…</div><div class="ghw-actions"><button type="button" data-prayer-refresh>🔄 تحديث</button><button type="button" data-prayer-notify>🔔 تنبيهات</button></div></div>
      <div class="ghw-dhikr"><strong>🤲 الذكر</strong><span data-dhikr-text></span><button type="button" data-dhikr-next aria-label="ذكر آخر">›</button></div>`;
    const wb=root.querySelector('[data-weather]');wb.onclick=()=>loadWeather(wb);wb.onkeydown=e=>{if(e.key==='Enter'||e.key===' ')loadWeather(wb)};loadWeather(wb);
    loadPrayer(root);root.querySelector('[data-prayer-refresh]').onclick=()=>loadPrayer(root);root.querySelector('[data-prayer-notify]').onclick=enablePrayerNotifications;
    const dt=root.querySelector('[data-dhikr-text]'),dn=root.querySelector('[data-dhikr-next]');dhikrIndex=Math.floor(Date.now()/60000)%dhikr.length;dt.textContent=dhikr[dhikrIndex];dn.onclick=()=>{dhikrIndex=(dhikrIndex+1)%dhikr.length;dt.textContent=dhikr[dhikrIndex]};
    clearInterval(weatherTimer);weatherTimer=setInterval(()=>loadWeather(wb),600000);clearInterval(prayerTimer);prayerTimer=setInterval(()=>loadPrayer(root),60000);
  }
  async function enablePrayerNotifications(){if(!('Notification' in window)){alert('المتصفح لا يدعم تنبيهات النظام.');return}const p=await Notification.requestPermission();if(p==='granted')alert('تم تفعيل تنبيهات الصلاة من المتصفح عند دعمه لها.');else alert('لم يتم السماح بالتنبيهات.');}
  function boot(){mount();const obs=new MutationObserver(()=>{if($('gh5Home')&&!$('gh5Home').querySelector('.gh-home-widgets'))setTimeout(mount,40)});obs.observe(document.body,{childList:true,subtree:true});[500,1200,2500,4500].forEach(ms=>setTimeout(mount,ms))}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.GhadeerHomeWidgets={mount,loadPrayer,loadWeather};
})();
