/* Ghadeer UI enhancements — sports, weather, prayer iqama/alerts, Quran source, neighborhood services */
(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const HOME='home';

  function injectStyle(){
    if($('ghadeerEnhStyle'))return;
    const s=document.createElement('style');s.id='ghadeerEnhStyle';s.textContent=`
      .gh-weather{display:flex;align-items:center;justify-content:space-between;gap:10px;border-radius:18px;padding:12px 14px;color:#fff;box-shadow:0 8px 22px #0002;margin:0 0 12px;cursor:pointer;transition:.25s}.gh-weather:hover{transform:translateY(-1px)}.gh-weather-temp{font-size:30px;font-weight:900}.gh-weather-meta{font-size:12px;opacity:.92}.gh-weather-icon{font-size:34px}.gh-weather-detail{font-size:12px;margin-top:4px}.gh-temp-cold{background:linear-gradient(135deg,#1767c8,#55b8ff)}.gh-temp-mild{background:linear-gradient(135deg,#1f8f72,#7fcf67)}.gh-temp-warm{background:linear-gradient(135deg,#d79b22,#ef6c2f)}.gh-temp-hot{background:linear-gradient(135deg,#d52b2b,#8d1515)}
      .gh-sport-tabs{display:flex;gap:7px;overflow:auto;margin-bottom:10px}.gh-sport-tabs button{white-space:nowrap;border:1px solid #d8ccbb;background:#fff;border-radius:999px;padding:8px 12px}.gh-sport-tabs button.active{background:#176b45;color:#fff}.gh-match{display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center;border:1px solid #e4dacb;border-radius:14px;padding:10px;margin:7px 0;background:#fff}.gh-team{text-align:center;font-weight:800}.gh-match-time{text-align:center;font-size:12px;color:#71695f}.gh-channel{font-size:11px;color:#176b45;text-align:center;margin-top:3px}.gh-news a{display:block;padding:9px 0;border-bottom:1px solid #eee4d5;text-decoration:none;color:#176b45}.gh-news a:last-child{border-bottom:0}.gh-service{display:flex;align-items:center;gap:10px}.gh-service .icon{font-size:25px}@media(max-width:650px){.gh-match{grid-template-columns:1fr}.gh-match-time{order:-1}.gh-channel{margin-bottom:3px}}
    `;document.head.appendChild(s);
  }

  function weatherClass(t){if(t<=12)return'gh-temp-cold';if(t<=25)return'gh-temp-mild';if(t<=35)return'gh-temp-warm';return'gh-temp-hot';}
  function weatherIcon(code){if(code===0)return'☀️';if(code<=3)return'🌤️';if(code<=48)return'🌫️';if(code<=67)return'🌧️';if(code<=77)return'🌨️';if(code<=82)return'🌦️';return'⛈️';}
  let lastWeather=null;
  async function getLocation(){return new Promise((resolve,reject)=>{if(!navigator.geolocation)return reject(new Error('geolocation'));navigator.geolocation.getCurrentPosition(p=>resolve(p.coords),reject,{enableHighAccuracy:false,timeout:12000,maximumAge:300000});});}
  async function loadWeather(){
    const box=$('ghWeatherBox');if(!box)return;
    box.innerHTML='<div><b>🌡️ الطقس</b><div class="gh-weather-meta">جارٍ تحديث موقعك والطقس…</div></div><div class="gh-weather-icon">⏳</div>';
    try{const c=await getLocation();const u='https://api.open-meteo.com/v1/forecast?latitude='+encodeURIComponent(c.latitude)+'&longitude='+encodeURIComponent(c.longitude)+'&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto';const j=await fetch(u,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('weather '+r.status);return r.json()});const w=j.current;lastWeather={...w,lat:c.latitude,lon:c.longitude};box.className='gh-weather '+weatherClass(Number(w.temperature_2m));box.innerHTML='<div><div class="gh-weather-temp">'+Math.round(w.temperature_2m)+'°</div><div class="gh-weather-meta">الحرارة الحالية • المحسوسة '+Math.round(w.apparent_temperature)+'°</div><div class="gh-weather-detail">💧 '+Math.round(w.relative_humidity_2m)+'% • 💨 '+Math.round(w.wind_speed_10m)+' كم/س</div></div><div class="gh-weather-icon">'+weatherIcon(Number(w.weather_code))+'</div>';
      box.onclick=()=>showWeatherDetails();
    }catch(e){box.className='gh-weather gh-temp-mild';box.innerHTML='<div><b>🌡️ الطقس</b><div class="gh-weather-meta">تعذر تحديد الموقع. فعّل الموقع ثم اضغط للتحديث.</div></div><div class="gh-weather-icon">📍</div>';box.onclick=loadWeather;}
  }
  function showWeatherDetails(){
    if(!lastWeather)return loadWeather();
    alert('الطقس الآن\n\nدرجة الحرارة: '+Math.round(lastWeather.temperature_2m)+'°\nالمحسوسة: '+Math.round(lastWeather.apparent_temperature)+'°\nالرطوبة: '+Math.round(lastWeather.relative_humidity_2m)+'%\nالرياح: '+Math.round(lastWeather.wind_speed_10m)+' كم/س\n\nيتحدث تلقائيًا كل 10 دقائق.');
  }
  function mountWeather(){const home=$('home');if(!home||$('ghWeatherBox'))return;const hero=home.querySelector('.hero');if(!hero)return;const box=document.createElement('div');box.id='ghWeatherBox';box.className='gh-weather gh-temp-mild';hero.insertAdjacentElement('afterend',box);loadWeather();setInterval(loadWeather,600000);}

  // Prayer times are already rendered once by the main page. The previous
  // enhancement injected a second prayer card, which duplicated the section
  // and consumed unnecessary mobile space. Keep the existing single card and
  // only augment its values/alerts; never create another card.
  function plusMinutes(hm,min){const [h,m]=String(hm).slice(0,5).split(':').map(Number);if(!Number.isFinite(h)||!Number.isFinite(m))return'—';const d=new Date();d.setHours(h,m+min,0,0);return d.toLocaleTimeString('ar-SA',{hour:'2-digit',minute:'2-digit',hour12:false});}
  function prayerAlert(prayer,time,type){if(Notification.permission==='granted')new Notification('جيران حي الغدير',{body:(type==='adhan'?'حان أذان ':'حان وقت الإقامة ')+prayer+' — '+time});}
  async function enablePrayerNotifications(){if(!('Notification'in window))return alert('المتصفح لا يدعم تنبيهات النظام.');const p=await Notification.requestPermission();if(p==='granted'){localStorage.setItem('gh_prayer_notify','1');alert('تم تفعيل تنبيهات الأذان والإقامة.');checkPrayerAlerts();}else alert('لم يتم السماح بالتنبيهات.');}
  let prayerCache={};
  function checkPrayerAlerts(){const t=prayerCache;const now=new Date();const mins=now.getHours()*60+now.getMinutes();for(const [name,time] of Object.entries(t)){if(!time||time==='—')continue;const [h,m]=time.split(':').map(Number),base=h*60+m,iq=name==='الفجر'?25:name==='المغرب'?10:20;if(mins===base)prayerAlert(name,time,'adhan');if(mins===base+iq)prayerAlert(name,plusMinutes(time,iq),'iqama');}}
  function patchPrayer(){
    const old=window.loadPrayerByMemberLocation;if(typeof old!=='function')return;
    window.loadPrayerByMemberLocation=async function(){try{await old();setTimeout(()=>{const map={الفجر:$('ptFajr')?.textContent,الظهر:$('ptDhuhr')?.textContent,العصر:$('ptAsr')?.textContent,المغرب:$('ptMaghrib')?.textContent,العشاء:$('ptIsha')?.textContent};prayerCache=map;checkPrayerAlerts();},500);}catch(e){}};
  }

  const sportsSources=[
    ['دوري روشن السعودي','https://www.spl.com.sa/ar'],['الاتحاد السعودي','https://www.saff.com.sa/'],['كأس الملك','https://www.saff.com.sa/'],['كأس السوبر السعودي','https://www.saff.com.sa/']
  ];
  function sportsHtml(){return '<div class="hero"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><div><h2>⚽ الرياضة السعودية</h2><p class="muted">المباريات القادمة، الترتيب، كأس الملك، كأس السوبر، وأخبار الفرق واللاعبين.</p></div><button class="btn secondary" onclick="openPage(\'home\')">↩️ رجوع</button></div></div><div class="card"><div class="gh-sport-tabs"><button class="active" data-sp="rsl">دوري روشن</button><button data-sp="king">كأس الملك</button><button data-sp="super">كأس السوبر</button><button data-sp="news">أخبار الفرق واللاعبين</button></div><div id="ghSportsContent">جارٍ تحديث البيانات…</div></div><div class="card"><h3>🔗 المصادر الرسمية</h3><div class="links">'+sportsSources.map(x=>'<a target="_blank" rel="noopener" href="'+x[1]+'">⚽ '+x[0]+'</a>').join('')+'</div></div>'}
  async function loadSports(){const page=$('sports');if(!page)return;page.innerHTML=sportsHtml();page.querySelectorAll('[data-sp]').forEach(b=>b.onclick=()=>loadSportsTab(b.dataset.sp));await loadSportsTab('rsl');}
  async function espn(path){const u='https://site.api.espn.com/apis/site/v2/sports/soccer/ksa.1/'+path;const r=await fetch(u,{cache:'no-store'});if(!r.ok)throw Error('ESPN '+r.status);return r.json();}
  function formatSportDate(v){try{return new Date(v).toLocaleString('ar-SA',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}catch{return v||'—'}}
  async function loadRsl(){const el=$('ghSportsContent');el.innerHTML='جارٍ جلب مباريات الأسبوع والترتيب…';try{const j=await espn('scoreboard?limit=100');const now=Date.now(),week=now+7*86400000;const events=(j.events||[]).filter(e=>{const d=new Date(e.date).getTime();return d>=now&&d<=week});let html='<h3>📅 المباريات القادمة خلال 7 أيام</h3>';html+=events.length?events.map(e=>{const c=e.competitions?.[0]||{},teams=c.competitors||[];const home=teams.find(t=>t.homeAway==='home')?.team?.displayName||'—',away=teams.find(t=>t.homeAway==='away')?.team?.displayName||'—';const b=(c.broadcasts||[]).map(x=>x.names?.join('،')).filter(Boolean).join('، ')||'غير محددة';return '<div class="gh-match"><div class="gh-team">'+esc(away)+'</div><div class="gh-match-time">'+formatSportDate(e.date)+'<div class="gh-channel">📺 '+esc(b)+'</div></div><div class="gh-team">'+esc(home)+'</div></div>'}).join(''):'<p class="muted">لا توجد مباريات خلال الأيام السبعة القادمة.</p>';el.innerHTML=html;}catch(e){el.innerHTML='<p class="muted">تعذر تحديث الرياضة حاليًا.</p>';}}
  async function loadSportsTab(tab){const el=$('ghSportsContent');if(!el)return;try{if(tab==='rsl')return loadRsl();if(tab==='king')return el.innerHTML='<p class="muted">يتم عرض بيانات كأس الملك من المصدر الرسمي عند توفرها.</p>';if(tab==='super')return el.innerHTML='<p class="muted">يتم عرض بيانات كأس السوبر من المصدر الرسمي عند توفرها.</p>';if(tab==='news')return el.innerHTML='<p class="muted">يتم عرض الأخبار من المصادر الرسمية.</p>';}catch(e){el.innerHTML='<p class="muted">تعذر تحديث البيانات.</p>';}}

  function patchQuran(){
    const oldEnsure=window.ensureQuranSurahLoaded;
    if(typeof oldEnsure!=='function')return;
    window.ensureQuranSurahLoaded=async function(id){try{const u='https://api.quran.com/api/v4/verses/by_chapter/'+id+'?language=ar&words=false&fields=text_uthmani&per_page=300';const j=await fetch(u,{cache:'force-cache'}).then(r=>{if(!r.ok)throw Error('Quran '+r.status);return r.json()});const s=(window.QURAN_DATA?.surahs||[]).find(x=>x.id===Number(id));if(s){s.verses=(j.verses||[]).map(v=>({id:Number(v.verse_number||v.id),text:String(v.text_uthmani||'')}));s.total_verses=s.verses.length;return s;}return oldEnsure(id);}catch(e){return oldEnsure(id)}};
  }

  function boot(){injectStyle();mountWeather();patchPrayer();patchQuran();loadSports();const sv=$('services');if(sv)sv.innerHTML=servicesHtml();setInterval(()=>{if(document.visibilityState==='visible')checkPrayerAlerts()},30000);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
(function(){var s=document.createElement('script');s.src='home-customizer.js?v=20260930';s.defer=false;document.head.appendChild(s);})();
