/* Ghadeer Navigation Fix v1 — separates Services from More and makes widget icons work. */
(()=>{
  'use strict';
  const $=s=>document.querySelector(s);
  function ensureMore(){
    let p=document.getElementById('gh5More');
    if(!p){
      p=document.createElement('section');p.id='gh5More';p.className='page';
      document.querySelector('main.wrap')?.appendChild(p);
    }
    p.innerHTML=`<div class="gh5-shell"><div class="gh5-head"><div><h2>☰ المزيد</h2><p>أدوات الحي والإدارة والإعدادات — منفصلة عن الخدمات.</p></div><button class="btn secondary" data-more-home>الرئيسية</button></div><div class="gh5-grid">
      <button type="button" class="gh5-tile" data-more-action="manager"><span>🔐</span><b>الإدارة</b><small>للمخولين فقط</small></button>
      <button type="button" class="gh5-tile" data-more-action="developer"><span>🛠️</span><b>المطور</b><small>إدارة النظام</small></button>
      <button type="button" class="gh5-tile" data-more-action="settings"><span>⚙️</span><b>الإعدادات</b><small>إعدادات الحساب</small></button>
      <button type="button" class="gh5-tile" data-more-action="aboutProject"><span>ℹ️</span><b>عن المشروع</b><small>المعلومات والحقوق</small></button>
      <button type="button" class="gh5-tile" data-more-action="logout"><span>🚪</span><b>خروج</b><small>تسجيل الخروج</small></button>
    </div></div>`;
    p.querySelector('[data-more-home]').onclick=()=>window.GhadeerUIv5?.home?.();
    p.querySelectorAll('[data-more-action]').forEach(b=>b.onclick=()=>window.openPage?.(b.dataset.moreAction));
    return p;
  }
  function showMore(){
    document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));
    const p=ensureMore();p.classList.add('active');window.scrollTo({top:0,behavior:'smooth'});
  }
  function bind(){
    const nav=document.querySelector('.gh5-nav');
    if(nav&&!nav.dataset.moreFix){
      nav.dataset.moreFix='1';
      const b=nav.querySelector('[data-gh5="more"]');
      b?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();showMore()},{capture:true,passive:false});
    }
    document.querySelectorAll('#gh5Home .gh5-tile[data-gh5="weather"],#gh5Home .gh5-tile[data-gh5="prayer"]').forEach(b=>{
      if(b.dataset.widgetFix)return;b.dataset.widgetFix='1';
      b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();document.querySelector('.gh-home-widgets')?.scrollIntoView({behavior:'smooth',block:'start'});},{capture:true,passive:false});
    });
  }
  function boot(){bind();[500,1200,2500,4500].forEach(ms=>setTimeout(bind,ms));new MutationObserver(()=>setTimeout(bind,30)).observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
