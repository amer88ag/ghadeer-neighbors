/* Ghadeer Home Customizer v2 — real mobile long-press, wiggle, hide/show, pointer drag, ordered persistence. */
(()=>{'use strict';
const KEY='ghadeer_home_layout_v2';
const $=s=>document.querySelector(s); const $$=s=>[...document.querySelectorAll(s)];
const ALL=[
 ['services:help','🤝','خدمات الجيران','طلب أو عرض خدمة'],['realEstate','🏠','سكن الحي','السكن والعقار'],['messages','💬','تواصل الجيران','تواصل ورسائل الحي'],['services:market','🛍️','سوق الحي','بيع وشراء'],['jobs','💼','الوظائف','فرص العمل'],['neighborhoodEvents','🎉','مناسبات الحي','فعاليات'],['football','⚽','الكورة','كرة القدم والبطولات'],['wardi','📖','وردي','المصحف والتلاوة والأذكار'],['news','📰','أخبار الحي','أخبار ومصادر'],['neighborCheck','❤️','تفقد جار','مساعدة وتواصل'],['announcements','📢','إعلانات الحي','إعلانات'],['lost','🔎','المفقودات','بحث وإبلاغ'],['coffee','☕','القهوة','الجدول والتفاصيل'],['outings','🚐','الطلعات','الطلعات والتقييمات'],['members','👥','الجيران','أعضاء الحي']
];
const defaults=['services:help','realEstate','football','wardi','services:market','neighborhoodEvents'];
let edit=false,pressTimer=null,dragging=null,down=null,observer=null,applyTimer=null,lastSig='';
const get=()=>{try{const x=JSON.parse(localStorage.getItem(KEY));return Array.isArray(x)&&x.length?x.filter(k=>ALL.some(a=>a[0]===k)):defaults.slice()}catch{return defaults.slice()}};
const save=a=>localStorage.setItem(KEY,JSON.stringify([...new Set(a)]));
const meta=k=>ALL.find(a=>a[0]===k);
function isHomeTile(b){return !!b&&b.matches?.('#gh5Home [data-gh5]')&&!b.matches('.gh5-mini')}
function tileFor(k){const m=meta(k);if(!m)return null;const b=document.createElement('button');b.type='button';b.className='gh5-tile';b.dataset.gh5=k;b.innerHTML=`<span>${m[1]}</span><b>${m[2]}</b><small>${m[3]}</small>`;return b}
function applyLayout(){const h=$('#gh5Home');if(!h)return;const grid=h.querySelector('.gh5-grid');if(!grid)return;
 h.querySelector('.gh5-feature')?.remove();
 const wanted=get();const byKey=new Map($$('#gh5Home .gh5-tile').map(b=>[b.dataset.gh5,b]));
 wanted.forEach(k=>{if(!byKey.has(k)){const b=tileFor(k);if(b){byKey.set(k,b);grid.appendChild(b)}}});
 $$('#gh5Home .gh5-tile').forEach(b=>{b.classList.toggle('gh5-hidden',!wanted.includes(b.dataset.gh5));});
 wanted.forEach(k=>{const b=byKey.get(k);if(b)grid.appendChild(b)});
 bindTiles();
 const sig=wanted.join('|');if(sig!==lastSig){lastSig=sig;renderControls()}
}
function start(){if(edit)return;edit=true;document.body.classList.add('gh5-editing');applyLayout();renderControls();}
function stop(){persistDom();edit=false;dragging=null;down=null;document.body.classList.remove('gh5-editing');renderControls();}
function removeKey(k){const a=get().filter(x=>x!==k);if(!a.length)return;save(a);applyLayout();start()}
function renderControls(){const h=$('#gh5Home');if(!h)return;let c=h.querySelector('.gh5-custom-tools');if(!edit){c?.remove();return}
 if(!c){c=document.createElement('div');c.className='gh5-custom-tools';c.innerHTML='<button type="button" class="btn secondary" data-custom-add>＋ إضافة أيقونة</button><button type="button" class="btn secondary" data-custom-reset>↺ استعادة</button><button type="button" class="btn" data-custom-done>✓ إنهاء</button>';h.querySelector('.gh5-head')?.appendChild(c)}
 c.querySelector('[data-custom-add]').onclick=e=>{e.stopPropagation();showAdd()};
 c.querySelector('[data-custom-reset]').onclick=e=>{e.stopPropagation();save(defaults.slice());applyLayout();start()};
 c.querySelector('[data-custom-done]').onclick=e=>{e.stopPropagation();stop()};
 h.querySelectorAll('.gh5-tile').forEach(b=>{if(!isHomeTile(b))return;if(!b.querySelector('.gh5-remove')){const x=document.createElement('button');x.type='button';x.className='gh5-remove';x.textContent='−';x.setAttribute('aria-label','إزالة الأيقونة من الرئيسية');x.title='إزالة من الرئيسية';x.onpointerdown=e=>{e.preventDefault();e.stopPropagation()};x.onclick=e=>{e.preventDefault();e.stopPropagation();removeKey(b.dataset.gh5)};b.appendChild(x)}})
}
function showAdd(){const existing=new Set(get());const choices=ALL.filter(x=>!existing.has(x[0]));const box=document.createElement('div');box.className='gh5-add-overlay';box.innerHTML='<div class="gh5-add-modal" role="dialog" aria-modal="true"><div class="gh5-add-head"><b>＋ إضافة إلى الرئيسية</b><button type="button" data-close aria-label="إغلاق">×</button></div><p class="muted">اختر أيقونة لتظهر في الواجهة. يمكنك ترتيبها لاحقاً بالسحب.</p><div class="gh5-add-grid">'+choices.map(x=>`<button type="button" data-add="${x[0]}"><span>${x[1]}</span><b>${x[2]}</b></button>`).join('')+'</div></div>';document.body.appendChild(box);box.onclick=e=>{if(e.target===box)box.remove()};box.querySelector('[data-close]').onclick=()=>box.remove();box.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{const a=get();a.push(b.dataset.add);save(a);box.remove();applyLayout();start()})}
function persistDom(){const a=$$('#gh5Home .gh5-tile').filter(b=>!b.classList.contains('gh5-hidden')).map(b=>b.dataset.gh5);if(a.length)save(a)}
function clearPress(){if(pressTimer){clearTimeout(pressTimer);pressTimer=null}}
function beginDrag(b,p){dragging=b;down={x:p.clientX,y:p.clientY};b.classList.add('gh5-dragging');try{b.setPointerCapture?.(p.pointerId)}catch{}}
function reorderAt(p){if(!dragging)return;const tiles=$$('#gh5Home .gh5-tile:not(.gh5-hidden)').filter(x=>x!==dragging);let target=null;for(const t of tiles){const r=t.getBoundingClientRect();if(p.clientY<r.top+r.height/2){target=t;break}}const grid=dragging.parentNode;if(target)grid.insertBefore(dragging,target);else grid.appendChild(dragging);}
function bindTiles(){const h=$('#gh5Home');if(!h)return;$$('#gh5Home .gh5-tile').forEach(b=>{if(b.dataset.customBound==='1')return;b.dataset.customBound='1';b.addEventListener('pointerdown',e=>{if(!edit){clearPress();down={x:e.clientX,y:e.clientY};pressTimer=setTimeout(()=>{start();beginDrag(b,e)},520)}else{down={x:e.clientX,y:e.clientY};beginDrag(b,e)}},{passive:false});b.addEventListener('pointermove',e=>{if(pressTimer&&!edit&&down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>10)clearPress();if(dragging){e.preventDefault();reorderAt(e)}},{passive:false});b.addEventListener('pointerup',e=>{clearPress();if(dragging){dragging.classList.remove('gh5-dragging');dragging=null;persistDom();renderControls()}},{passive:false});b.addEventListener('pointercancel',()=>{clearPress();dragging?.classList.remove('gh5-dragging');dragging=null;persistDom()},{passive:true});b.addEventListener('contextmenu',e=>{if(edit)e.preventDefault()},{passive:false})})}
function installStyle(){if($('#gh5CustomizerStyle'))return;const s=document.createElement('style');s.id='gh5CustomizerStyle';s.textContent=`.gh5-custom-tools{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;margin-top:6px}.gh5-remove{position:absolute;top:-7px;left:-7px;width:25px;height:25px;border:0;border-radius:50%;background:#b3261e;color:#fff;font-size:19px;line-height:25px;z-index:20;box-shadow:0 2px 7px #0003}.gh5-tile{position:relative;touch-action:pan-y}.gh5-editing .gh5-tile{animation:gh5wiggle .16s ease-in-out infinite alternate;cursor:grab;user-select:none}.gh5-editing .gh5-tile:active{cursor:grabbing}.gh5-dragging{opacity:.45;transform:scale(1.04);z-index:30}.gh5-add-overlay{position:fixed;inset:0;background:#0007;z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px}.gh5-add-modal{background:#fff;border-radius:22px;max-width:560px;width:100%;max-height:80vh;overflow:auto;padding:15px}.gh5-add-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}.gh5-add-head button{border:0;background:none;font-size:28px}.gh5-add-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.gh5-add-grid button{border:1px solid var(--line);background:#fff;border-radius:15px;padding:12px 5px;display:flex;flex-direction:column;gap:5px;align-items:center}.gh5-add-grid span{font-size:25px}@keyframes gh5wiggle{from{transform:rotate(-1.5deg)}to{transform:rotate(1.5deg)}}@media(max-width:650px){.gh5-add-grid{grid-template-columns:repeat(2,1fr)}}`;document.head.appendChild(s)}
function patchHome(){const api=window.GhadeerUIv5;if(!api||api.__customizerPatched)return;if(typeof api.home==='function'){const original=api.home;api.home=function(){const r=original.apply(this,arguments);setTimeout(applyLayout,0);setTimeout(applyLayout,80);return r};api.__customizerPatched=true}}
function install(){installStyle();patchHome();const h=$('#gh5Home');if(h&&!observer){observer=new MutationObserver(()=>{clearTimeout(applyTimer);applyTimer=setTimeout(applyLayout,35)});observer.observe(h,{childList:true,subtree:true})}applyLayout();bindTiles()}
function boot(){install();[500,1200,2500,4500].forEach(ms=>setTimeout(install,ms))}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.GhadeerHomeCustomizer={start,stop,get,save,reset:()=>{save(defaults.slice());applyLayout()}};
})();