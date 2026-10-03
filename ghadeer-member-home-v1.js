/* Ghadeer Member Home v1 — personalized welcome/profile shell. */
(()=>{
  'use strict';
  const PHOTO_KEY='ghadeer_member_photo_v1';
  const NAME_FIELDS=['name','full_name','display_name','member_name'];
  const photoKey=id=>`${PHOTO_KEY}:${id||'guest'}`;
  const stateOf=()=>{try{return window.state||null}catch{return null}};
  const memberOf=()=>stateOf()?.member||null;
  const nameOf=m=>NAME_FIELDS.map(k=>m?.[k]).find(v=>String(v||'').trim())||'جارنا العزيز';
  const photoOf=m=>{
    const id=m?.id;
    try{return localStorage.getItem(photoKey(id))||m?.avatar_url||m?.photo_url||m?.image_url||''}catch{return m?.avatar_url||m?.photo_url||m?.image_url||''}
  };
  function escapeHtml(v){return String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function render(){
    const m=memberOf(); if(!m)return;
    const host=document.querySelector('#gh5Home,.gh-home'); if(!host)return;
    let box=host.querySelector('#gh-member-welcome');
    if(!box){box=document.createElement('section');box.id='gh-member-welcome';box.className='gh-member-welcome';host.prepend(box)}
    const name=escapeHtml(nameOf(m)); const photo=photoOf(m);
    const media=photo?`<img class="gh-member-avatar" src="${escapeHtml(photo)}" alt="صورة ${name}">`:`<div class="gh-member-avatar gh-member-avatar-fallback" aria-hidden="true">${escapeHtml(name.slice(0,1))}</div>`;
    box.innerHTML=`<div class="gh-member-welcome-main"><button type="button" class="gh-member-avatar-btn" data-member-photo title="تغيير الصورة">${media}</button><div><small>أهلًا بك في جيران 👋</small><h2>يا ${name}</h2><p>خصص واجهتك واختر الخدمات التي تهمك.</p></div></div><button type="button" class="gh-member-customize" data-member-customize>تخصيص واجهتي</button><input type="file" accept="image/*" data-member-photo-input hidden>`;
    box.querySelector('[data-member-customize]')?.addEventListener('click',()=>window.GhadeerHomeCustomizer?.start?.());
    box.querySelector('[data-member-photo]')?.addEventListener('click',()=>box.querySelector('[data-member-photo-input]')?.click());
    box.querySelector('[data-member-photo-input]')?.addEventListener('change',e=>{
      const f=e.target.files?.[0]; if(!f)return;
      if(!f.type.startsWith('image/'))return;
      if(f.size>2*1024*1024){window.toast?.('الصورة يجب ألا تتجاوز 2MB.',false);return}
      const r=new FileReader(); r.onload=()=>{try{localStorage.setItem(photoKey(m.id),String(r.result));render()}catch{window.toast?.('تعذر حفظ الصورة على هذا الجهاز.',false)}}; r.readAsDataURL(f);
    });
  }
  function init(){
    const run=()=>{render();setTimeout(render,700);setTimeout(render,1800)};
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
    setInterval(()=>{if(memberOf())render()},5000);
  }
  window.GhadeerMemberHome={render};
  init();
})();
