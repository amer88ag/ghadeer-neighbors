/* Ghadeer Home Customizer v3 — reliable mobile long-press, wiggle, add/remove, touch drag, persistence. */
(()=>{'use strict';
const KEY='ghadeer_home_layout_v3';
const $=s=>document.querySelector(s); const $$=s=>[...document.querySelectorAll(s)];
const ALL=[
 ['services','🧰','الخدمات','كل خدمات الحي'],
 ['coffee','☕','القهوة','الجدول والتفاصيل'],
 ['outings','🚐','الطلعات','المواعيد والتقييمات'],
 ['members','👥','الجيران','أعضاء الحي'],
 ['football','⚽','الكورة','الدوريات والبطولات'],
 ['wardi','📖','وردي','المصحف والتلاوة والأذكار'],
 ['news','📰','أخبار الحي','أخبار ومصادر'],
 ['neighborCheck','❤️','تفقد جار','مساعدة وتواصل'],
 ['announcements','📢','إعلانات الحي','إعلانات وتنبيهات'],
 ['lost','🔎','المفقودات','بحث وإبلاغ'],
 ['prayer','🕌','مواقيت الصلاة','مواقيت اليوم'],
 ['weather','🌤️','الطقس','الحرارة والموقع']
];
const defaults=['services','coffee','outings','football','wardi','news'];
let edit=false,pressTimer=null,dragging=null,activePointerId=null,down=null,observer=null,applyTimer=null,lastSig='';
function valid(a){return Array.isArray(a)&&a.length?a.filter(k=>ALL.some(x=>x[0]===k)):null}
function get(){try{const v=valid(JSON.parse(localStorage.getItem(KEY)||'null'));return v&&v.length?v:defaults.slice()}catch{return defaults.slice()}}
function save(a){localStorage.setItem(KEY,JSON.stringify([...new Set(a)]))}
function meta(k){return ALL.find(x=>x[0]===k)}
function isTile(b){return !!b&&b.matches?.('#gh5Home .gh5-tile')}
function tileFor(k){const m=meta(k);if(!m)return null;const b=document.createElement('button');b.type='button';b.className='gh5-tile';b.dataset.gh5=k;b.innerHTML=`<span>${m[1]}</span><b>${m[2]}</b><small>${m[3]}</small>`;return b}
function applyLayout(){const h=$('#gh5Home');if(!h)return;const grid=h.querySelector('.gh5-grid');if(!grid)return;
 const wanted=get();const byKey=new Map($$('#gh5Home .gh5-tile').map(b=>[b.dataset.gh5,b]));
 wanted.forEach(k=>{if(!byKey.has(k)){const b=tileFor(k);if(b){byKey.set(k,b);grid.appendChild(b)}}});
 $$('#gh5Home .gh5-tile').forEach(b=>b.classList.toggle('gh5-hidden',!wanted.includes(b.dataset.gh5)));
 wanted.forEach(k=>{const b=byKey.get(k);if(b)grid.appendChild(b)});
 bindTiles();
 const sig=wanted.join('|');if(sig!==lastSig){lastSig=sig;renderControls()}
}
function start(){if(edit)return;edit=true;document.body.classList.add('gh5-editing');applyLayout();renderControls();toast('وضع التخصيص: اسحب الأيقونات أو اضغط − للحذف.','ok')}
function stop(){persistDom();edit=false;dragging=null;activePointerId=null;down=null;document.body.classList.remove('gh5-editing');renderControls()}
function removeKey(k){const a=get().filter(x=>x!==k);if(!a.length){toast('يجب إبقاء أيقونة واحدة على الأقل.','bad');return}save(a);applyLayout();edit=true;document.body.classList.add('gh5-editing');renderControls();}
function addKey(k){const a=get();if(!a.includes(k)){a.push(k);save(a)}applyLayout();edit=true;document.body.classList.add('gh5-editing');renderControls()}
function renderControls(){const h=$('#gh5Home');if(!h)return;let c=h.querySelector('.gh5-custom-tools');if(!edit){c?.remove();h.querySelectorAll('.gh5-remove').forEach(x=>x.remove());return}
 if(!c){c=document.createElement('div');c.className='gh5-custom-tools';c.innerHTML='<button type="button" class="btn secondary" data-custom-add>＋ إضافة أيقونة</button><button type="button" class="btn secondary" data-custom-reset>↺ استعادة</button><button type="button" class="btn" data-custom-done>✓ إنهاء</button>';h.querySelector('.gh5-head')?.appendChild(c)}
 c.querySelector('[data-custom-add]').onclick=e=>{e.preventDefault();e.stopPropagation();showAdd()};
 c.querySelector('[data-custom-reset]').onclick=e=>{e.preventDefault();e.stopPropagation();save(defaults.slice());applyLayout();start()};
 c.querySelector('[data-custom-done]').onclick=e=>{e.preventDefault();e.stopPropagation();stop()};
 h.querySelectorAll('.gh5-tile').forEach(b=>{if(!b.querySelector('.gh5-remove')){const x=document.createElement('button');x.type='button';x.className='gh5-remove';x.textContent='−';x.setAttribute('aria-label','إزالة الأيقونة من الرئيسية');x.title='إزالة من الرئيسية';x.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation()},{passive:false});x.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();removeKey(b.dataset.gh5)},{passive:false});b.appendChild(x)}})
}
function showAdd(){const existing=new Set(get());const choices=ALL.filter(x=>!existing.has(x[0]));const box=document.createElement('div');box.className='gh5-add-overlay';box.innerHTML='<div class="gh5-add-modal" role="dialog" aria-modal="true"><div class="gh5-add-head"><b>＋ إضافة إلى الرئيسية</b><button type="button" data-close aria-label="إغلاق">×</button></div><p class="muted">اختر أيقونة لتظهر في الشاشة الرئيسية.</p><div class="gh5-add-grid">'+(choices.length?choices.map(x=>`<button type="button" data-add="${x[0]}"><span>${x[1]}</span><b>${x[2]}</b><small>${x[3]}</small></button>`).join(''):'<p class="muted">كل الأيقونات مضافة بالفعل.</p>')+'</div></div>';document.body.appendChild(box);box.onclick=e=>{if(e.target===box)box.remove()};box.querySelector('[data-close]').onclick=()=>box.remove();box.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{addKey(b.dataset.add);box.remove()})}
function persistDom(){const a=$$('#gh5Home .gh5-tile:not(.gh5-hidden)').map(b=>b.dataset.gh5);if(a.length)save(a)}
function clearPress(){if(pressTimer){clearTimeout(pressTimer);pressTimer=null}}
function beginDrag(b,e){if(!edit||!isTile(b))return;dragging=b;activePointerId=e.pointerId;down={x:e.clientX,y:e.clientY};b.classList.add('gh5-dragging');try{b.setPointerCapture?.(e.pointerId)}catch{}}
function reorderAt(e){if(!dragging)return;const tiles=$$('#gh5Home .gh5-tile:not(.gh5-hidden)').filter(x=>x!==dragging);let target=null;for(const t of tiles){const r=t.getBoundingClientRect();const mid=r.top+r.height/2;if(e.clientY<mid){target=t;break}}const grid=dragging.parentNode;if(target)grid.insertBefore(dragging,target);else grid.appendChild(dragging)}
function endDrag(){if(!dragging)return;dragging.classList.remove('gh5-dragging');dragging=null;activePointerId=null;persistDom();renderControls()}
function bindTiles(){const h=$('#gh5Home');if(!h)return;$$('#gh5Home .gh5-tile').forEach(b=>{if(b.dataset.customBound==='3')return;b.dataset.customBound='3';b.addEventListener('selectstart',e=>{e.preventDefault()},{passive:false});b.addEventListener('dragstart',e=>{e.preventDefault()},{passive:false});b.addEventListener('pointerdown',e=>{clearPress();if(e.target.closest('.gh5-remove'))return;down={x:e.clientX,y:e.clientY};if(edit){e.preventDefault();beginDrag(b,e);return}pressTimer=setTimeout(()=>{pressTimer=null;start();beginDrag(b,e)},560)},{passive:false});b.addEventListener('pointermove',e=>{if(pressTimer&&down&&!edit&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>12)clearPress();if(dragging&&e.pointerId===activePointerId){e.preventDefault();reorderAt(e)}},{passive:false});b.addEventListener('pointerup',e=>{clearPress();if(dragging&&e.pointerId===activePointerId){e.preventDefault();endDrag()}},{passive:false});b.addEventListener('pointercancel',e=>{clearPress();if(dragging&&e.pointerId===activePointerId)endDrag()},{passive:false});b.addEventListener('contextmenu',e=>{if(edit)e.preventDefault()},{passive:false})})}
function installStyle(){if($('#gh5CustomizerStyle'))return;const s=document.createElement('style');s.id='gh5CustomizerStyle';s.textContent=`.gh5-custom-tools{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;margin-top:8px}.gh5-remove{position:absolute!important;top:-8px!important;left:-8px!important;width:28px!important;height:28px!important;border:2px solid #fff!important;border-radius:50%!important;background:#c62828!important;color:#fff!important;font-size:20px!important;line-height:24px!important;padding:0!important;z-index:100!important;box-shadow:0 2px 8px #0004!important}.gh5-tile{position:relative!important;-webkit-user-select:none!important;user-select:none!important;-webkit-touch-callout:none!important;-webkit-tap-highlight-color:transparent!important}.gh5-tile *{-webkit-user-select:none!important;user-select:none!important;-webkit-touch-callout:none!important}.gh5-editing .gh5-tile{touch-action:none!important;animation:gh5wiggle .16s ease-in-out infinite alternate;cursor:grab}.gh5-tile:not(.gh5-dragging){touch-action:pan-y}.gh5-dragging{opacity:.55!important;transform:scale(1.05)!important;z-index:999!important;box-shadow:0 12px 28px #0003!important}@keyframes gh5wiggle{from{transform:rotate(-1.5deg)}to{transform:rotate(1.5deg)}}.gh5-add-overlay{position:fixed;inset:0;background:#0008;z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px}.gh5-add-modal{background:#fff;color:var(--txt);border-radius:22px;max-width:560px;width:100%;max-height:82vh;overflow:auto;padding:15px;box-shadow:0 20px 60px #0005}.gh5-add-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}.gh5-add-head button{border:0;background:#eee8de;border-radius:50%;width:36px;height:36px;font-size:25px}.gh5-add-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.gh5-add-grid button{border:1px solid var(--line);background:#fff;border-radius:15px;padding:12px 5px;display:flex;flex-direction:column;gap:5px;align-items:center;color:var(--txt)}.gh5-add-grid span{font-size:28px}.gh5-add-grid small{font-size:10px;color:var(--muted)}@media(max-width:650px){.gh5-add-grid{grid-template-columns:repeat(2,1fr)}}`;document.head.appendChild(s)}
function patchHome(){const api=window.GhadeerUIv5;if(!api||api.__customizerPatched)return;if(typeof api.home==='function'){const original=api.home;api.home=function(){const r=original.apply(this,arguments);setTimeout(applyLayout,0);setTimeout(applyLayout,120);setTimeout(applyLayout,500);return r};api.__customizerPatched=true}}
function install(){installStyle();patchHome();const h=$('#gh5Home');if(h&&!observer){observer=new MutationObserver(()=>{clearTimeout(applyTimer);applyTimer=setTimeout(applyLayout,50)});observer.observe(h,{childList:true,subtree:true})}applyLayout();bindTiles()}
function boot(){install();[500,1200,2500,4500].forEach(ms=>setTimeout(install,ms))}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.GhadeerHomeCustomizer={start,stop,get,save,reset:()=>{save(defaults.slice());applyLayout()}};
})();