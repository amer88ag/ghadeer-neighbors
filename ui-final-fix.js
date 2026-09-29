/* Ghadeer final UI integrity pass — no DB changes */
(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  function compactPrayer(){
    const extra=$('ghPrayerExtra');
    if(extra) extra.remove();
    const card=$('prayerTimesToday')?.closest('.card');
    if(!card) return;
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
          e.preventDefault(); e.stopPropagation(); window.openPage(page);
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
  function run(){compactPrayer();bindNav();bindQuickIcons();}
  function boot(){
    run();
    [250,1000,2500].forEach(ms=>setTimeout(run,ms));
    const root=document.getElementById('app')||document.body;
    new MutationObserver(run).observe(root,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
