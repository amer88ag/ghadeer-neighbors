/* Ghadeer production fixes — navigation, live prayer/weather, sports, Quran, external-return UX */
(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const arabicTime=t=>{if(!t)return'—';const m=String(t).slice(0,5).match(/^(\d{1,2}):(\d{2})$/);if(!m)return String(t).slice(0,5);let h=Number(m[1]),mm=m[2],p=h>=12?'م':'ص';h=h%12||12;return h+':'+mm+' '+p;};
  const dateKey=d=>{const x=new Date(d);return x.getFullYear()+String(x.getMonth()+1).padStart(2,'0')+String(x.getDate()).padStart(2,'0');};
  const isoDate=d=>{const x=new Date(d);return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');};
  function style(){if($('ghProdStyle'))return;const s=document.createElement('style');s.id='ghProdStyle';s.textContent=`
    .gh-temp-chip{display:inline-flex;align-items:center;gap:7px;background:#fff;border:1px solid #e4dacb;border-radius:999px;padding:7px 12px;font-weight:900;box-shadow:0 4px 14px #0001;cursor:pointer}.gh-temp-chip small{font-weight:600;color:#71695f}.gh-home-icons{margin:10px 0}.gh-home-icons .icon-card{min-height:86px}.gh-return{display:flex;justify-content:space-between;align-items:center;gap:8px;background:#f4faf6;border:1px solid #dcebe1;border-radius:12px;padding:9px 11px;margin-bottom:10px}.gh-external-note{font-size:11px;color:#71695f}.gh-prayer-live{margin-top:8px}.gh-prayer-live .pbox{background:#f4faf6;border:1px solid #dcebe1;border-radius:12px;padding:8px;text-align:center}.gh-prayer-live .pbox b{font-size:17px}.gh-iq{font-size:11px;color:#71695f;margin-top:3px}.gh-quran-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:10px 0}.gh-quran-actions button{min-height:52px}.gh-quran-tools{display:flex;gap:7px;flex-wrap:wrap;margin:8px 0}.gh-quran-tools .small-btn{flex:1;min-width:130px}.gh-quran-note{background:#f4faf6;border:1px solid #dcebe1;border-radius:12px;padding:10px;font-size:12px}.gh-owner-card{line-height:1.9}.gh-sport-head{display:flex;justify-content:space-between;align-items:center;gap:8px}.gh-sport-date{font-size:11px;color:#71695f}.gh-loading{padding:12px;text-align:center;color:#71695f}@media(max-width:650px){.gh-quran-actions{grid-template-columns:1fr}.gh-home-icons{grid-template-columns:1fr 1fr}}
  `;document.head.appendChild(s);}

  async function coords(){return new Promise((resolve,reject)=>{if(!navigator.geolocation)return reject(Error('الموقع غير مدعوم'));navigator.geolocation.getCurrentPosition(p=>resolve(p.coords),e=>reject(e),{enableHighAccuracy:false,timeout:12000,maximumAge:300000});});}
  async function weather(){
    let c;try{c=await coords();}catch(e){return {error:'الموقع غير متاح'}}
    try{const u='https://api.open-meteo.com/v1/forecast?latitude='+encodeURIComponent(c.latitude)+'&longitude='+encodeURIComponent(c.longitude)+'&current=temperature_2m&timezone=auto';const j=await fetch(u,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('weather');return r.json()});return {temp:Math.round(j.current.temperature_2m),lat:c.latitude,lon:c.longitude};}catch(e){return {error:'تعذر جلب الحرارة'}}
  }
  async function mountTemperature(){
    const hero=$('home')?.querySelector('.hero');if(!hero)return;
    $('homeWeatherBtn')?.classList.add('hidden');$('ghWeatherBox')?.classList.add('hidden');
    let chip=$('ghTempChip');if(!chip){chip=document.createElement('button');chip.id='ghTempChip';chip.type='button';chip.className='gh-temp-chip';hero.querySelector('div')?.appendChild(chip)||hero.appendChild(chip);}
    chip.textContent='🌡️ —';chip.title='درجة حرارة موقع الجوال — اضغط لفتح الطقس';
    const r=await weather();
    if(r.temp!==undefined){chip.innerHTML='🌡️ '+r.temp+'° <small>اضغط للطقس</small>';chip.onclick=()=>window.open('https://www.google.com/search?q='+encodeURIComponent('الطقس '+r.lat+','+r.lon),'_blank','noopener,noreferrer');}
    else {chip.innerHTML='🌡️ — <small>السماح بالموقع مطلوب</small>';chip.onclick=mountTemperature;}
  }

  const iqama={Fajr:25,Dhuhr:20,Asr:20,Maghrib:10,Isha:20};
  function addM(hm,min){const m=String(hm).slice(0,5).match(/^(\d{1,2}):(\d{2})$/);if(!m)return'—';const d=new Date();d.setHours(Number(m[1]),Number(m[2])+min,0,0);return d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0');}
  async function livePrayer(){
    const card=$('prayerTimesToday')?.parentElement;if(!card)return;
    const label=$('prayerLocationLabel');if(label)label.textContent='جارٍ جلب المواقيت مباشرة حسب موقع الجوال…';
    let c;try{c=await coords();}catch(e){if(label)label.textContent='اسمح بالموقع ليتم جلب المواقيت مباشرة.';return;}
    try{const today=new Date();const url='https://api.aladhan.com/v1/timings/'+dateKey(today)+'?latitude='+encodeURIComponent(c.latitude)+'&longitude='+encodeURIComponent(c.longitude)+'&method=4';const j=await fetch(url,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('prayer');return r.json()});const t=j?.data?.timings||{};const names={Fajr:'الفجر',Dhuhr:'الظهر',Asr:'العصر',Maghrib:'المغرب',Isha:'العشاء'};
      let box=$('ghPrayerLive');if(!box){box=document.createElement('div');box.id='ghPrayerLive';box.className='gh-prayer-live grid3';card.querySelector('#prayerTimesToday')?.replaceWith(box)||card.appendChild(box);}
      box.innerHTML=Object.keys(names).map(k=>'<div class="pbox">'+names[k]+'<br><b>'+arabicTime(t[k])+'</b><div class="gh-iq">الإقامة '+arabicTime(addM(t[k],iqama[k]))+'</div></div>').join('');
      if(label)label.textContent='مواقيت اليوم حسب موقع الجوال • ١٢ ساعة';
      const old=$('prayerStatus');if(old)old.textContent='تم التحديث مباشرة.';
    }catch(e){if(label)label.textContent='تعذر جلب المواقيت الآن. اضغط تحديث.';}
  }

  function addHomeIcons(){
    const quick=[...document.querySelectorAll('#home .card h3')].find(x=>x.textContent.includes('الخدمات السريعة'))?.parentElement;if(!quick||$('ghHomeIcons'))return;
    const box=document.createElement('div');box.id='ghHomeIcons';box.className='card gh-home-icons';box.innerHTML='<h3>🧭 أقسام الحي</h3><div class="grid">'+[
      ['🚌','الطلعات الشهرية','outingAdvanced'],['🎉','مناسبات الحي','neighborhoodEvents'],['🛠️','المطور','__developer'],['©️','الملكية والحقوق','__owner']
    ].map(x=>'<button type="button" class="card icon-card" data-gh-target="'+x[2]+'"><span class="icon">'+x[0]+'</span><span><b>'+x[1]+'</b><br><small>فتح القسم</small></span></button>').join('')+'</div>';
    quick.insertAdjacentElement('afterend',box);
    box.querySelectorAll('[data-gh-target]').forEach(b=>b.onclick=()=>{const t=b.dataset.ghTarget;if(t==='__developer')window.showManagerLogin?.();else if(t==='__owner')ownerPage();else window.openPage?.(t);});
  }
  function ownerPage(){
    let p=$('ghOwnership');if(!p){p=document.createElement('section');p.id='ghOwnership';p.className='page';p.innerHTML='<div class="hero"><div class="gh-return"><b>©️ الملكية والحقوق</b><button class="btn secondary" id="ghOwnerBack">↩️ العودة للبرنامج</button></div><div class="card gh-owner-card"><h2>حقوق مشروع جيران حي الغدير</h2><p><b>اسم المشروع:</b> جيران حي الغدير بالمحالة</p><p><b>المشروع:</b> برنامج مجتمعي للجيران وإدارة خدمات ومناسبات وطلعات الحي.</p><p><b>حقوق التصميم والبرمجة والمحتوى المخصص:</b> محفوظة لصاحب المشروع.</p><p class="muted">لا يترتب على فتح هذه الصفحة تغيير البيانات أو الصلاحيات.</p></div></div>';document.querySelector('#app')?.appendChild(p);p.querySelector('#ghOwnerBack').onclick=()=>window.openPage?.('home');}
    window.openPage?.('ghOwnership');
  }

  async function sports(){
    const page=$('sports');if(!page)return;
    page.innerHTML='<div class="hero"><div class="gh-sport-head"><div><h2>⚽ الرياضة السعودية</h2><p class="muted">المباريات القادمة والترتيب من مصدر بيانات رياضي مباشر.</p></div><button class="btn secondary" onclick="openPage(\'home\')">↩️ رجوع</button></div></div><div class="card"><div id="ghSportsLive" class="gh-loading">جارٍ جلب المباريات القادمة والترتيب…</div></div><div class="card"><div class="gh-external-note">للمصادر الرسمية: افتح الرابط في نافذة جديدة، ويبقى برنامج جيران مفتوحًا في النافذة الأصلية.</div><div class="links"><a target="_blank" rel="noopener" href="https://www.spl.com.sa/ar">دوري روشن</a><a target="_blank" rel="noopener" href="https://www.saff.com.sa/">الاتحاد السعودي</a></div></div>';
    const out=$('ghSportsLive');
    try{
      const now=new Date(),end=new Date(now.getTime()+30*86400000),range=dateKey(now)+'-'+dateKey(end);
      const base='https://site.api.espn.com/apis/site/v2/sports/soccer/ksa.1/';
      const j=await fetch(base+'scoreboard?dates='+range+'&limit=1000',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('matches');return r.json()});
      const ev=(j.events||[]).filter(e=>new Date(e.date).getTime()>=Date.now()).sort((a,b)=>new Date(a.date)-new Date(b.date));
      let html='<h3>📅 المباريات القادمة</h3>'+(ev.length?ev.map(e=>{const c=e.competitions?.[0]||{},ts=c.competitors||[];const h=ts.find(x=>x.homeAway==='home')?.team?.displayName||'—',a=ts.find(x=>x.homeAway==='away')?.team?.displayName||'—';return '<div class="gh-match"><div class="gh-team">'+esc(a)+'</div><div class="gh-match-time">'+new Date(e.date).toLocaleString('ar-SA',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})+'</div><div class="gh-team">'+esc(h)+'</div></div>';}).join(''):'<p class="muted">لا توجد مباريات منشورة في الثلاثين يومًا القادمة من المصدر الحالي.</p>');
      try{const st=await fetch('https://site.api.espn.com/apis/v2/sports/soccer/ksa.1/standings',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('standings');return r.json()});const entries=st?.standings?.entries||st?.children?.flatMap(x=>x.standings?.entries||[])||[];const val=(r,n)=>r.stats?.find(s=>s.name===n||s.abbreviation===n)?.value??'—';entries.sort((a,b)=>Number(val(b,'points'))-Number(val(a,'points')));html+='<h3>🏆 الترتيب</h3><div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>الفريق</th><th>ل</th><th>ف</th><th>ت</th><th>خ</th><th>ن</th></tr></thead><tbody>'+entries.map((r,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(r.team?.displayName||'—')+'</td><td>'+val(r,'gamesPlayed')+'</td><td>'+val(r,'wins')+'</td><td>'+val(r,'ties')+'</td><td>'+val(r,'losses')+'</td><td><b>'+val(r,'points')+'</b></td></tr>').join('')+'</tbody></table></div>';}catch(e){html+='<p class="muted">تعذر جلب الترتيب المباشر الآن.</p>'}
      out.innerHTML=html;
    }catch(e){out.innerHTML='<p class="muted">تعذر جلب المباريات الآن. تحقق من الاتصال ثم افتح الرياضة مرة أخرى.</p>'}
  }

  function externalReturnUX(){
    document.querySelectorAll('a[href^="http"]').forEach(a=>{if(a.dataset.ghExternal)return;a.dataset.ghExternal='1';a.target='_blank';a.rel='noopener noreferrer';});
  }

  function quranEnhance(){
    const page=$('dhikr');if(!page||$('ghQuranActions'))return;
    const panel=page.querySelector('.quran-panel');if(!panel)return;
    const actions=document.createElement('div');actions.id='ghQuranActions';actions.className='gh-quran-actions';actions.innerHTML='<button class="btn primary" id="ghReadCorrect">🎙️ تصحيح القراءة</button><button class="btn secondary" id="ghTajweed">📗 تدريب التجويد</button><button class="btn secondary" id="ghTafsir">📚 تفسير الآية</button>';
    panel.parentElement.insertBefore(actions,panel);
    const tools=document.createElement('div');tools.className='gh-quran-tools';tools.innerHTML='<button class="small-btn" id="ghQuranDownload">⬇️ تنزيل السورة الحالية</button><button class="small-btn" id="ghQuranOffline">📴 فتح المحفوظات دون إنترنت</button>';panel.insertBefore(tools,panel.firstChild);
    $('ghReadCorrect').onclick=()=>{document.getElementById('startReadBtn')?.click();document.getElementById('readTestArea')?.scrollIntoView({behavior:'smooth'});};
    $('ghTajweed').onclick=()=>showTajweed();
    $('ghTafsir').onclick=()=>{const s=window.QURAN_SURAH||Number($('quranSurah')?.value||1);const q=prompt('أدخل رقم الآية للتفسير:','1');if(q)window.open('https://tafsir.app/'+s+':'+Number(q),'_blank','noopener');};
    $('ghQuranDownload').onclick=downloadCurrentSurah;$('ghQuranOffline').onclick=offlineQuran;
    try{const f=document.createElement('style');f.textContent='@font-face{font-family:UthmanicHafs;src:url(https://verses.quran.foundation/fonts/quran/hafs/uthmanic_hafs/UthmanicHafs1Ver18.woff2) format("woff2");font-display:swap}.quran-ayah{font-family:UthmanicHafs,"Amiri Quran","Amiri",serif!important}';document.head.appendChild(f);}catch(e){}
  }
  function showTajweed(){
    let box=$('ghTajweedBox');if(!box){box=document.createElement('div');box.id='ghTajweedBox';box.className='card';$('ghQuranActions').after(box);}box.innerHTML='<h3>📗 تدريب التجويد</h3><p class="muted">هذا تدريب مساعد على قواعد التجويد وليس حكمًا آليًا متخصصًا على صحة التلاوة.</p><div class="grid"><button class="small-btn" onclick="GhTajRule(\'النون الساكنة والتنوين\',\'الإظهار، الإدغام، الإقلاب، الإخفاء\')">النون الساكنة والتنوين</button><button class="small-btn" onclick="GhTajRule(\'الميم الساكنة\',\'الإظهار الشفوي، الإدغام الشفوي، الإخفاء الشفوي\')">الميم الساكنة</button><button class="small-btn" onclick="GhTajRule(\'المدود\',\'مد طبيعي ومدود فرعية بحسب الموضع\')">المدود</button><button class="small-btn" onclick="GhTajRule(\'القلقلة\',\'قطب جد عند السكون\')">القلقلة</button></div><div id="ghTajRuleResult" class="gh-quran-note">اختر قاعدة لعرض التدريب.</div>';}
  window.GhTajRule=(title,desc)=>{const el=$('ghTajRuleResult');if(el)el.innerHTML='<b>'+esc(title)+'</b><br>'+esc(desc)+'<br><small>راجع المثال من المصحف واقرأه بصوتك ثم استخدم «تصحيح القراءة» للمطابقة النصية.</small>';};
  async function downloadCurrentSurah(){const id=Number($('quranSurah')?.value||window.QURAN_SURAH||1);try{const u='https://api.quran.com/api/v4/verses/by_chapter/'+id+'?language=ar&words=false&fields=text_uthmani,text_qpc_hafs&per_page=300';const data=await fetch(u,{cache:'no-store'}).then(r=>r.json());localStorage.setItem('gh_quran_offline_'+id,JSON.stringify({savedAt:Date.now(),data}));alert('تم حفظ نص السورة على الجهاز للاستخدام دون اتصال.');}catch(e){alert('تعذر تنزيل السورة الآن.');}}
  async function offlineQuran(){const id=Number($('quranSurah')?.value||window.QURAN_SURAH||1);const raw=localStorage.getItem('gh_quran_offline_'+id);if(!raw)return alert('لا توجد سورة محفوظة حاليًا. استخدم «تنزيل السورة الحالية».');const d=JSON.parse(raw);const verses=d.data?.verses||[];const c=$('quranContent');if(c)c.innerHTML='<div class="quran-title">📴 نسخة دون اتصال</div>'+verses.map(v=>'<div class="quran-ayah"><span class="ayah-no">﴿'+(v.verse_number||v.id)+'﴾</span>'+esc(v.text_qpc_hafs||v.text_uthmani||'')+'</div>').join('');}

  function patchOpenPage(){
    if(window.__ghProdOpenPatched||typeof window.openPage!=='function')return;window.__ghProdOpenPatched=true;const old=window.openPage;window.openPage=function(id){old(id);if(id==='sports')setTimeout(sports,40);if(id==='dhikr')setTimeout(quranEnhance,40);if(id==='home')setTimeout(()=>{addHomeIcons();mountTemperature();livePrayer();externalReturnUX();},40);};
  }
  function boot(){style();addHomeIcons();mountTemperature();livePrayer();externalReturnUX();patchOpenPage();setTimeout(()=>{quranEnhance();},150);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
