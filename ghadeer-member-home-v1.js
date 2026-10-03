/* Ghadeer Member Home v1 — personalized welcome/profile shell. */
(()=>{
  'use strict';
  const PHOTO_KEY='ghadeer_member_photo_v1';
  const NAME_FIELDS=['name','full_name','display_name','member_name'];
  const photoKey=id=>`${PHOTO_KEY}:${id||'guest'}`;
  const stateOf=()=>{try{return window.state||null}catch{return null}};
  const memberOf=()=>stateOf()?.member||null;
  const nameOf=m=>NAME_FIELDS.map(k=>m?.[k]).find(v=>String(v||'').trim())||'جارنا العزيز';
  const photoOf=m=>{const id=m?.id;try{return localStorage.getItem(photoKey(id))||m?.avatar_url||m?.photo_url||m?.image_url||''}catch{return m?.avatar_url||m?.photo_url||m?.image_url||''}};
  function escapeHtml(v){return String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function style(){if(document.getElementById('ghMemberHomeStyle'))return;const s=document.createElement('style');s.id='ghMemberHomeStyle';s.textContent=`#gh-member-welcome{margin:10px 0 14px;padding:14px;border-radius:24px;background:linear-gradient(135deg,#ffffff,#f5f7fb);box-shadow:0 8px 28px #00000012;border:1px solid #ffffffcc;display:flex;align-items:center;justify-content:space-between;gap:12px;direction:rtl}.gh-member-welcome-main{display:flex;align-items:center;gap:12px;min-width:0}.gh-member-avatar-btn{border:0;background:none;padding:0;cursor:pointer;flex:0 0 auto}.gh-member-avatar{width:58px;height:58px;border-radius:50%;object-fit:cover;display:block;border:3px solid #fff;box-shadow:0 4px 16px #0002}.gh-member-avatar-fallback{display:grid;place-items:center;background:#e9eef6;color:#334;font-size:25px;font-weight:800}.gh-member-welcome small{opacity:.72}.gh-member-welcome h2{margin:2px 0;font-size:20px}.gh-member-welcome p{margin:0;font-size:12px;opacity:.68}.gh-member-customize{border:0;border-radius:14px;padding:10px 13px;cursor:pointer;font-weight:700;white-space:nowrap;background:#111;color:#fff}.gh-member-customize:active{transform:scale(.97)}@media(max-width:600px){#gh-member-welcome{align-items:flex-start;flex-direction:column}.gh-member-customize{width:100%}}`;document.head.appendChild(s)}
  function startCustomizer(){
    if(typeof window.GhadeerHomeCustomizer?.start==='function'){window.GhadeerHomeCustomizer.start();return}
    const tile=document.querySelector('#gh5Home .gh5-tile');
    if(!tile){window.toast?.('افتح الخدمات أولًا ثم جرّب تخصيص الواجهة.',false);return}
    const r=tile.getBoundingClientRect();
    try{tile.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerId:7,clientX:r.left+r.width/2,clientY:r.top+r.height/2,pointerType:'touch'}));setTimeout(()=>tile.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,cancelable:true,pointerId:7,clientX:r.left+r.width/2,clientY:r.top+r.height/2,pointerType:'touch'})),650)}catch{window.toast?.('اضغط مطولًا على أيقونة لتفعيل التخصيص.',true)}
  }
  function render(){
    const m=memberOf();if(!m)return;style();
    const host=document.querySelector('#gh5Home,.gh-home');if(!host)return;
    let box=host.querySelector('#gh-member-welcome');if(!box){box=document.createElement('section');box.id='gh-member-welcome';box.className='gh-member-welcome';host.prepend(box)}
    const name=escapeHtml(nameOf(m));const photo=photoOf(m);const media=photo?`<img class="gh-member-avatar" src="${escapeHtml(photo)}" alt="صورة ${name}">`:`<div class="gh-member-avatar gh-member-avatar-fallback" aria-hidden="true">${escapeHtml(name.slice(0,1))}</div>`;
    box.innerHTML=`<div class="gh-member-welcome-main"><button type="button" class="gh-member-avatar-btn" data-member-photo title="تغيير الصورة">${media}</button><div><small>أهلًا بك في جيران 👋</small><h2>يا ${name}</h2><p>خصص واجهتك واختر الخدمات التي تهمك.</p></div></div><button type="button" class="gh-member-customize" data-member-customize>تخصيص واجهتي</button><input type="file" accept="image/*" data-member-photo-input hidden>`;
    box.querySelector('[data-member-customize]')?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();startCustomizer()});
    box.querySelector('[data-member-photo]')?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();box.querySelector('[data-member-photo-input]')?.click()});
    box.querySelector('[data-member-photo-input]')?.addEventListener('change',e=>{const f=e.target.files?.[0];if(!f)return;if(!f.type.startsWith('image/'))return;if(f.size>2*1024*1024){window.toast?.('الصورة يجب ألا تتجاوز 2MB.',false);return}const r=new FileReader();r.onload=()=>{try{localStorage.setItem(photoKey(m.id),String(r.result));render()}catch{window.toast?.('تعذر حفظ الصورة على هذا الجهاز.',false)}};r.readAsDataURL(f)});
  }
  function init(){const run=()=>{render();setTimeout(render,700);setTimeout(render,1800)};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();setInterval(()=>{if(memberOf())render()},5000)}
  window.GhadeerMemberHome={render,startCustomizer};init();
})();
