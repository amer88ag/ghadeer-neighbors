/* Ghadeer Navigation Fix v1.1 — canonical More binding, idempotent. */
(()=>{'use strict';
function ensureMore(){
 let p=document.getElementById('gh5More');
 if(!p){p=document.createElement('section');p.id='gh5More';p.className='page';document.querySelector('main.wrap')?.appendChild(p)}
 p.innerHTML=`<div class="gh5-shell"><div class="gh5-head"><div><h2>☰ المزيد</h2><p>أدوات الحي والإدارة والإعدادات — منفصلة عن الخدمات.</p></div><button type="button" class="btn secondary" data-more-home>الرئيسية</button></div><div class="gh5-grid"><button type="button" class="gh5-tile" data-more-action="manager"><span>🔐</span><b>الإدارة</b><small>للمخولين فقط</small></button><button type="button" class="gh5-tile" data-more-action="developer"><span>🛠️</span><b>المطور</b><small>إدارة النظام</small></button><button type="button" class="gh5-tile" data-more-action="settings"><span>⚙️</span><b>الإعدادات</b><small>إعدادات الحساب</small></button><button type="button" class="gh5-tile" data-more-action="aboutProject"><span>ℹ️</span><b>عن المشروع</b><small>المعلومات والحقوق</small></button><button type="button" class="gh5-tile" data-more-action="logout"><span>🚪</span><b>خروج</b><small>تسجيل الخروج</small></button></div></div>`;
 return p;
}
function showMore(){document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));const p=ensureMore();p.classList.add('active');window.scrollTo({top:0,behavior:'smooth'});}
function bind(){
 const nav=document.querySelector('.gh5-nav');
 if(nav){const b=nav.querySelector('[data-gh5="more"]');if(b&&!b.dataset.moreFix){b.dataset.moreFix='1';b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();showMore()},{capture:true,passive:false})}}
 const p=document.getElementById('gh5More');
 if(p&&!p.dataset.actionsBound){p.dataset.actionsBound='1';
  p.addEventListener('click',e=>{const b=e.target.closest('[data-more-action]');if(b){e.preventDefault();e.stopPropagation();window.openPage?.(b.dataset.moreAction);return}if(e.target.closest('[data-more-home]')){e.preventDefault();e.stopPropagation();window.GhadeerUIv5?.home?.()}});
 }
}
function boot(){bind();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
new MutationObserver(bind).observe(document.body,{childList:true,subtree:true});
})();