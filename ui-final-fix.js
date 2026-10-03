/* Ghadeer final UI integrity pass — no DB changes */
(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  function injectStyle(){
    if($('ghFinalUiStyle'))return;
    const s=document.createElement('style');
    s.id='ghFinalUiStyle';
    s.textContent=`
      .gh-prayer-compact{padding:10px;margin-bottom:10px}
      .gh-prayer-compact h3{margin:0 0 5px;font-size:15px}
      .gh-prayer-compact #prayerLocationLabel{font-size:11px;line-height:1.45;margin-bottom:4px}
      .gh-prayer-main-grid{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:5px!important;margin-top:5px!important}
      .gh-prayer-main-grid>div{padding:5px 3px;background:#f4faf6;border:1px solid #dcebe1;border-radius:9px;text-align:center;font-size:11px;line-height:1.35}
      .gh-prayer-main-grid b{font-size:15px}
      .gh-prayer-compact .top-actions{margin-top:5px;gap:5px}
      .gh-prayer-compact .top-actions .btn{padding:7px 9px;font-size:11px}
      .gh-service-fallback{padding:16px;border:1px solid #e4dacb;border-radius:18px;background:#fff}
      .gh-service-fallback h2{margin-top:0;color:#176b45}
      .gh-service-fallback .gh-member-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px;margin-top:10px}
      .gh-service-fallback .gh-member-item{padding:10px;border:1px solid #e4dacb;border-radius:13px;background:#fff}
      @media(max-width:650px){.gh-prayer-main-grid{grid-template-columns:repeat(5,minmax(48px,1fr))!important;overflow-x:auto}.gh-prayer-main-grid>div{min-width:48px}.gh-service-fallback .gh-member-list{grid-template-columns:1fr}}
    `;
    document.head.appendChild(s);
  }
  function removeDuplicateDhikr(){
    document.querySelectorAll('#dhikrTicker,.dhikr-ticker').forEach(el=>el.remove());
    $('dhikrTickerStyles')?.remove();
  }
  function compactPrayer(){
    const extra=$('ghPrayerExtra');
    if(extra)extra.remove();
    const prayerCards=[...document.querySelectorAll('.card')].filter(card=>{
      const title=card.querySelector('h3');
      return title&&/مواقيت الصلاة/.test(title.textContent||'');
    });
    if(prayerCards.length>1)prayerCards.slice(1).forEach(card=>card.remove());
    const card=$('prayerTimesToday')?.closest('.card');
    if(!card)return;
    card.classList.add('gh-prayer-compact');
    $('prayerTimesToday')?.classList.add('gh-prayer-main-grid');
  }
  function bindNav(){
    document.querySelectorAll('[data-page]').forEach(btn=>{
      if(btn.dataset.ghFinalBound)return;
      btn.dataset.ghFinalBound='1';
      btn.addEventListener('click',e=>{
        const page=btn.dataset.page;
        if(page&&typeof window.openPage==='function'){
          e.preventDefault();
          e.stopPropagation();
          window.openPage(page);
        }
      },true);
    });
  }
  function bindQuickIcons(){
    document.querySelectorAll('.icon-card[onclick]').forEach(btn=>{
      if(btn.dataset.ghFinalBound)return;
      const raw=btn.getAttribute('onclick')||'';
      const m=raw.match(/openPage\(['\"]([^'\"]+)['\"]\)/);
      if(!m)return;
      btn.dataset.ghFinalBound='1';
      btn.addEventListener('click',e=>{
        if(typeof window.openPage==='function'){
          e.preventDefault();
          e.stopPropagation();
          window.openPage(m[1]);
        }
      },true);
    });
  }
  function bindButtonsById(){
    const map={
      refreshBtn:()=>window.loadData?.(),
      prayerRefreshBtn:()=>window.loadPrayerByMemberLocation?.(),
      homePrayerBtn:()=>window.loadPrayerByMemberLocation?.(),
      homeWeatherBtn:()=>document.getElementById('ghWeatherBox')?.onclick?.(),
      topMemberAccessBtn:()=>window.showMemberAuth?.(),
      memberAccessBtn:()=>window.showMemberAuth?.()
    };
    Object.entries(map).forEach(([id,fn])=>{
      const b=$(id);
      if(!b||b.dataset.ghIdBound)return;
      b.dataset.ghIdBound='1';
      b.addEventListener('click',e=>{try{e.preventDefault();fn()}catch(err){console.error('[ghadeer ui]',err)}},true);
    });
  }
  function renderPublicMembersFallback(){
    const page=$('members');
    if(!page)return;
    const hasError=/تعذر تحميل الخدمة|تعذر تحميل الجيران/.test(page.textContent||'');
    if(!hasError)return;
    const grid=document.createElement('div');
    grid.className='gh-service-fallback';
    grid.innerHTML='<h2>👥 الجيران</h2><p class="muted">دليل الجيران العام — لا يحتاج تسجيل دخول.</p><div class="gh-member-list"><div class="muted">جارٍ تحميل الجيران…</div></div>';
    page.replaceChildren(grid);
    const list=grid.querySelector('.gh-member-list');
    const sb=window.supabase?.createClient&&window.GHADEER_SUPABASE_CONFIG?.url&&window.GHADEER_SUPABASE_CONFIG?.key?window.supabase.createClient(window.GHADEER_SUPABASE_CONFIG.url,window.GHADEER_SUPABASE_CONFIG.key):null;
    if(!sb){list.innerHTML='<div class="muted">تعذر تشغيل دليل الجيران الآن.</div>';return}
    sb.from('public_members').select('id,name,active').eq('active',true).order('id').then(({data,error})=>{
      if(error){list.innerHTML='<div class="muted">تعذر تحميل دليل الجيران. حاول التحديث مرة أخرى.</div>';return}
      list.innerHTML=(data||[]).map(m=>'<div class="gh-member-item"><b>👤 '+String(m.name||'جار').replace(/[&<>"\']/g,'')+'</b></div>').join('')||'<div class="muted">لا توجد بيانات منشورة حاليًا.</div>';
    });
  }
  function bindCanonicalServiceRoutes(){
    if(document.documentElement.dataset.ghCanonicalRoutes==='1')return;
    document.documentElement.dataset.ghCanonicalRoutes='1';
    document.addEventListener('click',e=>{
      const tile=e.target.closest?.('[data-service]');
      if(!tile)return;
      const service=tile.getAttribute('data-service');
      if(service==='neighbors'){
        e.preventDefault();e.stopImmediatePropagation();
        if(typeof window.openPage==='function')window.openPage('members');
      }else if(service==='wardi'){
        e.preventDefault();e.stopImmediatePropagation();
        if(typeof window.openPage==='function')window.openPage('dhikr');
      }
    },true);
  }
  function normalizeLabels(){
    document.querySelectorAll('.lh5-label,[data-service="wardi"]').forEach(el=>{
      if(el.classList?.contains('lh5-label'))el.textContent='قرآن';
      el.setAttribute?.('aria-label','قرآن');
    });
  }
  function recoverBlankHome(){
    const app=$('app');
    if(!app)return;
    const pages=[...app.querySelectorAll('.page')];
    if(pages.length&&pages.every(p=>!p.classList.contains('active'))){
      const home=$('home');
      if(home){pages.forEach(p=>p.classList.remove('active'));home.classList.add('active');}
    }
  }
  function run(){
    injectStyle();
    removeDuplicateDhikr();
    compactPrayer();
    bindNav();
    bindQuickIcons();
    bindButtonsById();
    bindCanonicalServiceRoutes();
    normalizeLabels();
    renderPublicMembersFallback();
    recoverBlankHome();
  }
  function boot(){
    run();
    [250,1000,2500,5000].forEach(ms=>setTimeout(run,ms));
    const root=document.getElementById('app')||document.body;
    new MutationObserver(()=>run()).observe(root,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();