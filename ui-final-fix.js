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
      @media(max-width:650px){.gh-prayer-main-grid{grid-template-columns:repeat(5,minmax(48px,1fr))!important;overflow-x:auto}.gh-prayer-main-grid>div{min-width:48px}}
    `;
    document.head.appendChild(s);
  }
  function compactPrayer(){
    const extra=$('ghPrayerExtra');
    if(extra) extra.remove();

    // Keep exactly one prayer card even if another enhancement/runtime script
    // injects a duplicate copy after the initial page render.
    const prayerCards=[...document.querySelectorAll('.card')].filter(card=>{
      const title=card.querySelector('h3');
      return title && /مواقيت الصلاة/.test(title.textContent||'');
    });
    if(prayerCards.length>1){
      prayerCards.slice(1).forEach(card=>card.remove());
    }

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
          e.preventDefault(); e.stopImmediatePropagation(); window.openPage(page);
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
          e.preventDefault(); e.stopImmediatePropagation(); window.openPage(m[1]);
        }
      },true);
    });
  }
  function run(){injectStyle();compactPrayer();bindNav();bindQuickIcons();}
  function boot(){
    run();
    [250,1000,2500].forEach(ms=>setTimeout(run,ms));
    const root=document.getElementById('app')||document.body;
    new MutationObserver(run).observe(root,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();