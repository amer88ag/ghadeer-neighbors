/* Canonical bottom navigation v3 — five useful destinations, no duplicated services. */
(()=>{'use strict';
const ITEMS=[['home','⌂','الرئيسية'],['services','🧰','الخدمات'],['neighbors','👥','الجيران'],['quran','📖','القرآن'],['more','▦','المزيد']];
function open(k){
 if(k==='home')return window.GHADEER_ICON_ROUTES?.open?.('live-home')||window.GhadeerLiveHome?.open?.();
 if(k==='services')return window.GHADEER_ICON_ROUTES?.open?.('services');
 if(k==='neighbors')return window.GHADEER_ICON_ROUTES?.open?.('neighbors');
 if(k==='quran')return window.GHADEER_ICON_ROUTES?.open?.('quran');
 if(k==='more')return window.GHADEER_ICON_ROUTES?.open?.('more');
 return false;
}
function mount(){
 document.querySelectorAll('[data-gh-old-bottom-nav]').forEach(x=>x.remove());
 document.getElementById('ghBottomNavV2')?.remove();
 const nav=document.createElement('nav');nav.id='ghBottomNavV2';nav.setAttribute('aria-label','التنقل الرئيسي');
 nav.innerHTML=ITEMS.map(([k,i,l])=>`<button type="button" data-bottom="${k}" aria-label="${l}"><span>${i}</span><b>${l}</b></button>`).join('');
 const style=document.createElement('style');style.textContent='#ghBottomNavV2{position:sticky;bottom:8px;z-index:70;display:grid;grid-template-columns:repeat(5,1fr);gap:5px;margin:12px 6px 4px;padding:7px;background:#101a2c;border-radius:19px;box-shadow:0 12px 30px #0003}#ghBottomNavV2 button{border:0;background:transparent;color:#d6def0;border-radius:13px;padding:7px 2px;display:grid;gap:3px;place-items:center;font-size:10px}#ghBottomNavV2 button span{font-size:18px;line-height:1}#ghBottomNavV2 button b{font-size:10px}#ghBottomNavV2 button.active{background:#286dff;color:#fff}';document.head.appendChild(style);
 const home=document.getElementById('ghLiveHome');if(home)home.appendChild(nav);else document.body.appendChild(nav);
 nav.addEventListener('click',e=>{const b=e.target.closest('[data-bottom]');if(!b)return;document.querySelectorAll('#ghBottomNavV2 button').forEach(x=>x.classList.toggle('active',x===b));try{const r=open(b.dataset.bottom);if(r?.catch)r.catch(console.error)}catch(err){console.error('[Ghadeer] bottom route failed',err)}});
 nav.querySelector('[data-bottom="home"]')?.classList.add('active');return nav;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(mount,0),{once:true});else setTimeout(mount,0);
})();