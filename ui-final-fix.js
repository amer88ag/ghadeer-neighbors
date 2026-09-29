/* Ghadeer final UI pass — mobile-first home, working navigation, occasions/jobs, fixed neighborhood weather fallback */
(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function injectStyle(){
    if($('ghFinalUiStyle'))return;
    const s=document.createElement('style');s.id='ghFinalUiStyle';s.textContent=`
      :root{--gh-green:#176b45;--gh-green2:#0d4e34;--gh-cream:#f7f2e9;--gh-gold:#b98b35}
      body{background:var(--gh-cream)}
      .appbar{padding:10px 14px;box-shadow:0 4px 18px #0001}
      .appbar-head{max-width:1100px;margin:auto}
      .appbar h1{font-size:20px;letter-spacing:-.2px}
      .appbar .sub{font-size:12px}
      .appbar-login{display:flex;gap:6px;align-items:center}
      .top-login{padding:7px 9px;border-radius:999px}
      #notificationSettingsBtn{display:none!important}
      .gh-home-hero{position:relative;overflow:hidden;background:linear-gradient(135deg,#fffdf8 0%,#f0e8da 65%,#e5efe8 100%);border:1px solid #dfd1bc;border-radius:24px;padding:18px;margin-bottom:12px;box-shadow:0 10px 28px #0000000b}
      .gh-home-hero:before{content:'🏘️';position:absolute;left:-8px;bottom:-20px;font-size:110px;opacity:.08;transform:rotate(-8deg)}
      .gh-hero-row{display:flex;align-items:center;justify-content:space-between;gap:12px;position:relative;z-index:1}
      .gh-hero-title{margin:0 0 6px;font-size:27px;line-height:1.35}
      .gh-hero-sub{margin:0;color:#6d665e;font-size:13px;line-height:1.7}
      .gh-hero-actions{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}
      .gh-hero-actions .btn{border-radius:999px;padding:9px 12px;font-weight:800}
      .gh-date-chip{display:inline-flex;align-items:center;gap:5px;margin-top:9px;padding:5px 9px;border-radius:999px;background:#fff8e9;border:1px solid #ead7aa;color:#795b1d;font-size:11px;font-weight:800}
      .gh-stat-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px!important;margin-bottom:10px}
      .gh-stat{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid #e4dacb;border-radius:17px;padding:12px;box-shadow:0 5px 16px #00000008}
      .gh-stat-icon{width:43px;height:43px;border-radius:14px;background:#eef7f1;display:grid;place-items:center;font-size:23px;flex:none}
      .gh-stat b{display:block;font-size:22px;line-height:1.1}.gh-stat span{font-size:11px;color:#71695f}
      .gh-quick-title{display:flex;align-items:center;justify-content:space-between;margin:8px 2px 8px}.gh-quick-title h3{margin:0;font-size:18px}.gh-quick-title span{font-size:11px;color:#71695f}
      .gh-quick-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px!important}
      .gh-quick{min-height:76px!important;margin:0!important;border-radius:16px!important;padding:11px!important;display:flex!important;align-items:center;gap:9px;transition:transform .16s,box-shadow .16s}.gh-quick:active{transform:scale(.98)}
      .gh-quick .icon{font-size:25px}.gh-quick b{font-size:14px}.gh-quick small{color:#71695f;font-size:10px}
      .gh-prayer-compact{padding:10px;margin-bottom:10px}.gh-prayer-compact h3{margin:0 0 5px;font-size:15px}
      .gh-prayer-compact #prayerLocationLabel{font-size:11px;line-height:1.45;margin-bottom:4px}
      .gh-prayer-main-grid{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:5px!important;margin-top:5px!important}
      .gh-prayer-main-grid>div{padding:6px 3px;background:#f4faf6;border:1px solid #dcebe1;border-radius:9px;text-align:center;font-size:10px;line-height:1.35}.gh-prayer-main-grid b{font-size:14px}
      .gh-prayer-compact .top-actions{margin-top:5px;gap:5px}.gh-prayer-compact .top-actions .btn{padding:7px 9px;font-size:11px}
      .gh-weather-fixed{cursor:pointer}
      .gh-weather-fixed .gh-weather-meta{font-size:11px}
      .gh-occasion-card{background:linear-gradient(135deg,#fffdf7,#f7f0df);border-color:#e4d4af}
      .gh-occasion-list{display:grid;gap:8px}.gh-occasion-item{padding:11px;border:1px solid #e8ddc7;border-radius:13px;background:#fff}.gh-occasion-item b{display:block;margin-bottom:4px}.gh-occasion-item p{margin:0;font-size:12px;color:#71695f;line-height:1.7}
      .gh-source-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.gh-source-card{margin:0!important;text-decoration:none;color:inherit}.gh-source-card b{font-size:13px}.gh-source-card .pill{float:left}.gh-source-card .muted{font-size:11px;line-height:1.6;margin-top:6px}.gh-source-open{margin-top:7px;color:var(--gh-green);font-size:11px;font-weight:800}
      .gh-source-toolbar{display:flex;gap:8px;align-items:center;margin-bottom:9px}.gh-source-toolbar input{flex:1}
      .bottom-nav{padding-bottom:env(safe-area-inset-bottom);box-shadow:0 -5px 18px #0001}
      .bottom-nav button{min-height:58px;padding:7px 3px;font-size:11px;max-width:none}.bottom-nav button.active{background:#f4faf6}
      .bottom-nav button[data-page="jobs"]{color:#5b4b2b}
      .developer-access{bottom:calc(68px + env(safe-area-inset-bottom));left:9px}
      @media(min-width:651px){.gh-quick-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important}.gh-stat-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important}.gh-source-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
      @media(max-width:650px){.gh-hero-row{align-items:flex-start}.gh-hero-title{font-size:24px}.gh-hero-actions{flex-direction:column}.gh-hero-actions .btn{width:100%}.gh-source-grid{grid-template-columns:1fr}.gh-prayer-main-grid{grid-template-columns:repeat(5,minmax(48px,1fr))!important;overflow-x:auto}.gh-prayer-main-grid>div{min-width:48px}.appbar h1{font-size:17px}.appbar-login .top-login{font-size:10px}.bottom-nav button{font-size:10px}}
    `;document.head.appendChild(s);
  }

  function removeDuplicateDhikr(){
    document.querySelectorAll('#dhikrTicker,.dhikr-ticker').forEach(el=>el.remove());
    $('dhikrTickerStyles')?.remove();
  }

  function compactPrayer(){
    $('ghPrayerExtra')?.remove();
    const cards=[...document.querySelectorAll('.card')].filter(card=>/مواقيت الصلاة/.test(card.querySelector('h3')?.textContent||''));
    if(cards.length>1)cards.slice(1).forEach(card=>card.remove());
    const card=$('prayerTimesToday')?.closest('.card');
    if(!card)return;
    card.classList.add('gh-prayer-compact');$('prayerTimesToday')?.classList.add('gh-prayer-main-grid');
  }

  function makeHomeHero(){
    const home=$('home');if(!home)return;
    const old=home.querySelector('.hero');if(!old)return;
    if(old.dataset.ghHero==='1')return;
    old.dataset.ghHero='1';old.classList.add('gh-home-hero');
    const h2=old.querySelector('h2');const p=old.querySelector('p');const refresh=$('refreshBtn');
    if(!h2)return;
    h2.className='gh-hero-title';
    if(p)p.className='gh-hero-sub';
    const wrap=document.createElement('div');wrap.className='gh-hero-row';
    const text=document.createElement('div');
    while(h2.firstChild)text.appendChild(h2.firstChild);text.insertBefore(h2,null); // preserve node
    const date=document.createElement('div');date.className='gh-date-chip';date.textContent='📅 '+new Date().toLocaleDateString('ar-SA',{weekday:'long',day:'numeric',month:'long'});
    text.appendChild(date);
    const actions=document.createElement('div');actions.className='gh-hero-actions';
    if(refresh){refresh.className='btn secondary';refresh.textContent='🔄 تحديث';actions.appendChild(refresh);}
    const notify=document.createElement('button');notify.className='btn secondary';notify.textContent='🔔 الإشعارات';notify.onclick=()=>window.GhadeerNotifications?.openSettings?.();actions.appendChild(notify);
    wrap.appendChild(text);wrap.appendChild(actions);
    old.innerHTML='';old.appendChild(wrap);if(p)text.appendChild(p);text.appendChild(date);
  }

  function improveStats(){
    const home=$('home');if(!home||home.querySelector('.gh-stat-grid'))return;
    const candidates=[['memberCount','👥','الجيران النشطون'],['messageCount','💬','الرسائل']];
    const cards=[];
    candidates.forEach(([id,icon,label])=>{const el=$(id);const card=el?.closest('.card');if(card){cards.push(card);}});
    if(!cards.length)return;
    const grid=cards[0].parentElement;grid.classList.add('gh-stat-grid');cards.forEach(c=>{c.className='gh-stat';const id=c.querySelector('[id]')?.id;const val=c.querySelector('[id]')?.textContent||'—';const meta=c.querySelector('.muted')?.textContent||'';const map=c.querySelector('[id]')?.id==='memberCount'?['👥','الجيران النشطون']:['💬','الرسائل'];c.innerHTML='<div class="gh-stat-icon">'+map[0]+'</div><div><b id="'+id+'">'+esc(val)+'</b><span>'+esc(meta||map[1])+'</span></div>';});
    const more=[['nextCoffee','☕','القهوة القادمة'],['nextOuting','🚐','الطلعة القادمة']];
    const second=home.querySelector('.gh-stat-grid')?.nextElementSibling;
    if(second&&second.classList.contains('grid')){second.querySelectorAll('.card').forEach((c,i)=>{const id=more[i]?.[0];if(!id)return;c.style.margin=0;c.style.borderRadius='16px';});}
  }

  function buildQuickGrid(){
    const home=$('home');if(!home)return;
    const h3=[...home.querySelectorAll('h3')].find(x=>x.textContent.includes('الخدمات السريعة'));if(!h3)return;
    const box=h3.closest('.card');if(!box||box.dataset.ghQuick==='1')return;box.dataset.ghQuick='1';
    const old=box.querySelector('.grid');if(!old)return;
    old.classList.add('gh-quick-grid');
    const items=[
      ['coffee','☕','القهوة','الجدول والاعتذار'],['outings','🚐','الطلعات','التصويت والتقييم'],['members','👥','الجيران','الأعضاء والبطاقات'],['neighborCheck','❤️','تفقد جارك','مساعدة باحترام'],
      ['messages','💬','الرسائل','التواصل والاقتراحات'],['news','📰','أخبار الحي','إعلانات الجيران والصحف'],['dhikr','📖','القرآن والأذكار','المصحف والأذكار'],['sports','⚽','الرياضة','المصادر الرياضية'],['services','🏘️','خدمات الحي','الخدمات القريبة'],['jobs','💼','الوظائف','حكومي وخاص'],['realEstate','🏠','العقار','بيع وإيجار وخدمات'],['occasions','🎉','المناسبات','الدينية والوطنية']
    ];
    old.innerHTML=items.map(x=>`<button class="card icon-card gh-quick" data-gh-page="${x[0]}"><span class="icon">${x[1]}</span><span><b>${x[2]}</b><br><small>${x[3]}</small></span></button>`).join('');
    old.querySelectorAll('[data-gh-page]').forEach(b=>b.onclick=e=>{e.preventDefault();openPageSafe(b.dataset.ghPage);});
  }

  function ensureOccasionsPage(){
    if($('occasions'))return;
    const main=document.querySelector('main.wrap');if(!main)return;
    const footer=main.querySelector('.footer');
    const sec=document.createElement('section');sec.id='occasions';sec.className='page';sec.innerHTML=`<div class="hero"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><div><h2>🎉 المناسبات</h2><p class="muted">المناسبات الدينية والوطنية التي ينشرها مدير الحي، مع الرسائل المجدولة.</p></div><button class="btn secondary" data-gh-back>↩️ العودة</button></div></div><div class="card gh-occasion-card"><h3>📅 المناسبات القادمة</h3><div id="ghOccasionList" class="gh-occasion-list"></div></div>`;
    (footer||main.lastElementChild).insertAdjacentElement('beforebegin',sec);
    sec.querySelector('[data-gh-back]').onclick=()=>openPageSafe('home');
  }
  function renderOccasions(){
    ensureOccasionsPage();const box=$('ghOccasionList');if(!box)return;
    let rows=[];try{rows=window.GHADEER_CTX?.()?.state?.announcements||[]}catch{}
    rows=rows.filter(x=>x&&x.is_occasion).sort((a,b)=>new Date(a.scheduled_at||a.created_at)-new Date(b.scheduled_at||b.created_at));
    box.innerHTML=rows.length?rows.map(x=>`<div class="gh-occasion-item"><b>${x.occasion_type==='وطنية'?'🇸🇦':'🕌'} ${esc(x.title||'مناسبة')}</b><p>${esc(x.message||'')}</p><small class="muted">${new Date(x.scheduled_at||x.created_at).toLocaleString('ar-SA')}</small></div>`).join(''):'<p class="muted">لا توجد مناسبات منشورة حاليًا.</p>';
  }

  function ensureNav(){
    const nav=document.querySelector('.bottom-nav');if(!nav)return;
    const wanted=[['home','🏠','الرئيسية'],['coffee','☕','القهوة'],['outings','🚐','الطلعات'],['members','👥','الجيران'],['occasions','🎉','مناسبات'],['jobs','💼','الوظائف']];
    nav.innerHTML=wanted.map(x=>`<button data-page="${x[0]}">${x[1]}<br>${x[2]}</button>`).join('');
    nav.querySelectorAll('[data-page]').forEach(btn=>{btn.onclick=e=>{e.preventDefault();openPageSafe(btn.dataset.page);};});
    markActive();
  }
  function markActive(){const current=[...document.querySelectorAll('.page.active')][0]?.id||'home';document.querySelectorAll('.bottom-nav [data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===current));}
  function openPageSafe(id){
    if(id==='occasions')ensureOccasionsPage();
    if(id==='jobs'&&!$('jobs')){try{window.openPage?.('jobs')}catch{}}
    if(typeof window.openPage==='function')window.openPage(id);else{
      document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===id));
    }
    setTimeout(()=>{renderOccasions();markActive();window.scrollTo({top:0,behavior:'smooth'});},80);
  }

  async function loadFixedNeighborhoodWeather(){
    const box=$('ghWeatherBox');if(!box||box.dataset.ghFixed==='1')return;
    const text=box.textContent||'';
    if(!/تعذر تحديد الموقع|جارٍ تحديث موقعك/.test(text))return;
    box.dataset.ghFixed='1';
    const lat=18.2164,lon=42.5053;
    try{
      const u='https://api.open-meteo.com/v1/forecast?latitude='+lat+'&longitude='+lon+'&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=Asia%2FRiyadh';
      const j=await fetch(u,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('weather');return r.json()});const w=j.current||{};
      const code=Number(w.weather_code);const icon=code===0?'☀️':code<=3?'🌤️':code<=48?'🌫️':code<=67?'🌧️':code<=82?'🌦️':'⛈️';
      box.className='gh-weather gh-temp-mild gh-weather-fixed';
      box.innerHTML='<div><div class="gh-weather-temp">'+Math.round(Number(w.temperature_2m)||0)+'°</div><div class="gh-weather-meta">طقس حي الغدير بالمحالة • المحسوسة '+Math.round(Number(w.apparent_temperature)||0)+'°</div><div class="gh-weather-detail">💧 '+Math.round(Number(w.relative_humidity_2m)||0)+'% • 💨 '+Math.round(Number(w.wind_speed_10m)||0)+' كم/س</div></div><div class="gh-weather-icon">'+icon+'</div>';
      box.onclick=()=>loadFixedNeighborhoodWeather();
    }catch{box.dataset.ghFixed='0';}
  }

  function bindIds(){
    const map={
      refreshBtn:()=>window.loadData?.(),
      prayerRefreshBtn:()=>window.loadPrayerByMemberLocation?.(),
      homePrayerBtn:()=>window.loadPrayerByMemberLocation?.(),
      homeWeatherBtn:()=>document.getElementById('ghWeatherBox')?.click(),
      topMemberAccessBtn:()=>window.showMemberAuth?.(),
      memberAccessBtn:()=>window.showMemberAuth?.()
    };
    Object.entries(map).forEach(([id,fn])=>{const b=$(id);if(!b||b.dataset.ghIdBound)return;b.dataset.ghIdBound='1';b.addEventListener('click',e=>{try{e.preventDefault();fn()}catch(err){console.error('[ghadeer ui]',err)}},true);});
  }

  function run(){
    injectStyle();removeDuplicateDhikr();makeHomeHero();compactPrayer();buildQuickGrid();ensureOccasionsPage();ensureNav();bindIds();renderOccasions();loadFixedNeighborhoodWeather();
  }
  function boot(){run();[250,800,1600,3000,6000].forEach(ms=>setTimeout(run,ms));const root=document.getElementById('app')||document.body;new MutationObserver(()=>run()).observe(root,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
