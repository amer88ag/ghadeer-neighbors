/* Canonical bottom navigation v2 — one owner, five destinations, no service duplication. */
(()=>{'use strict';
const ITEMS=[['home','⌂','الرئيسية'],['discover','▦','اكتشف'],['favorites','☆','المفضلة'],['messages','💬','الرسائل'],['account','●','حسابي']];
function route(key){
  const bridge=window.GhadeerServiceRouteBridge;
  if(bridge&&typeof bridge.open==='function'){bridge.open(key);return true;}
  if(typeof window.openPage==='function'){window.openPage(key);return true;}
  const el=document.getElementById(key);
  if(el){document.querySelectorAll('.page.active').forEach(x=>x.classList.remove('active'));el.classList.add('active');el.scrollIntoView({behavior:'smooth',block:'start'});return true;}
  if(typeof window.toast==='function')window.toast('هذه الصفحة غير مرتبطة بمسار فعلي بعد.',false);
  return false;
}
function mount(){
 let old=document.querySelector('[data-gh-old-bottom-nav]');if(old)old.remove();
 let nav=document.getElementById('ghBottomNavV2');if(nav)return nav;
 nav=document.createElement('nav');nav.id='ghBottomNavV2';nav.setAttribute('aria-label','التنقل الرئيسي');nav.innerHTML=ITEMS.map(([k,i,l])=>`<button type="button" data-bottom="${k}" aria-label="${l}"><span>${i}</span><b>${l}</b></button>`).join('');
 const style=document.createElement('style');style.textContent='#ghBottomNavV2{position:sticky;bottom:8px;z-index:70;display:grid;grid-template-columns:repeat(5,1fr);gap:5px;margin:12px 6px 4px;padding:7px;background:#101a2c;border-radius:19px;box-shadow:0 12px 30px #0003}#ghBottomNavV2 button{border:0;background:transparent;color:#d6def0;border-radius:13px;padding:7px 2px;display:grid;gap:3px;place-items:center;font-size:10px}#ghBottomNavV2 button span{font-size:18px;line-height:1}#ghBottomNavV2 button b{font-size:10px}#ghBottomNavV2 button.active{background:#286dff;color:#fff}';document.head.appendChild(style);
 const home=document.getElementById('ghLiveHome');if(home)home.appendChild(nav);else document.body.appendChild(nav);
 nav.addEventListener('click',e=>{const b=e.target.closest('[data-bottom]');if(!b)return;const k=b.dataset.bottom;document.querySelectorAll('#ghBottomNavV2 button').forEach(x=>x.classList.toggle('active',x===b));if(k==='home')document.getElementById('ghLiveHome')?.scrollIntoView({behavior:'smooth',block:'start'});else if(k==='discover'){const search=document.querySelector('#lhSearch');if(search)search.focus();else route('discover');}else if(k==='favorites'){if(window.GhadeerLiveHome?.showFavorites)window.GhadeerLiveHome.showFavorites();else route('favorites');}else if(k==='messages')route('messages');else if(k==='account')route('account');});
 nav.querySelector('[data-bottom="home"]')?.classList.add('active');return nav;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(mount,0),{once:true});else setTimeout(mount,0);
})();
