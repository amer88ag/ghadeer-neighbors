/* جيران الغدير — استعادة الرقم السري للأعضاء */
(() => {
  const cfg = window.GHADEER_SUPABASE_CONFIG;
  if (!cfg || !window.supabase?.createClient) return;
  const client = window.supabase.createClient(cfg.url, cfg.key);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const el = id => document.getElementById(id);
  const show = id => el(id)?.classList.remove('hidden');
  const hide = id => el(id)?.classList.add('hidden');

  function injectStyles(){
    if(el('pinRecoveryStyles')) return;
    const s=document.createElement('style'); s.id='pinRecoveryStyles';
    s.textContent='.pin-recovery-link{border:0;background:transparent;color:#176b45;text-decoration:underline;padding:4px 0;font-weight:700}.pin-recovery-modal{z-index:80}.pin-request-row{border:1px solid #e4dacb;border-radius:12px;padding:10px;margin:8px 0;background:#fff}.pin-manager-fab{position:fixed;right:10px;bottom:62px;z-index:40;border:1px solid #e4dacb;background:#fff;color:#176b45;border-radius:999px;padding:8px 11px;font-weight:800;box-shadow:0 3px 12px #0002}.pin-manager-fab.hidden{display:none!important}';
    document.head.appendChild(s);
  }

  function injectRecoveryModal(){
    if(el('pinRecoveryModal')) return;
    const m=document.createElement('div'); m.id='pinRecoveryModal'; m.className='modal hidden pin-recovery-modal';
    m.innerHTML=`<div class="modal-card"><h2>🔑 استعادة الرقم السري</h2><p class="muted">لن يتم تغيير الرقم السري تلقائيًا. يُرسل الطلب للمدير للمراجعة، ثم يحدد المدير رقمًا جديدًا.</p><label>اسم العضو</label><select id="pinRecoveryMember"></select><label>إعادة كتابة الاسم</label><input id="pinRecoveryName" autocomplete="name"><label>رقم الجوال (إن كان مسجلًا)</label><input id="pinRecoveryPhone" inputmode="tel" autocomplete="tel"><div class="top-actions"><button id="pinRecoverySubmit" class="btn primary">إرسال طلب الاستعادة</button><button id="pinRecoveryClose" class="btn secondary">إلغاء</button></div><div id="pinRecoveryStatus" class="status"></div></div>`;
    document.body.appendChild(m);
    el('pinRecoveryClose').onclick=()=>hide('pinRecoveryModal');
    el('pinRecoveryMember').onchange=syncRecoveryMember;
    el('pinRecoverySubmit').onclick=submitRecovery;
  }

  function injectManagerRecovery(){
    if(el('pinManagerRecoveryFab')) return;
    const b=document.createElement('button'); b.id='pinManagerRecoveryFab'; b.className='pin-manager-fab hidden'; b.textContent='🔑 طلبات استعادة الأرقام';
    b.onclick=openManagerRequests; document.body.appendChild(b);
    const m=document.createElement('div'); m.id='pinManagerRecoveryModal'; m.className='modal hidden pin-recovery-modal';
    m.innerHTML=`<div class="modal-card"><h2>🔑 طلبات استعادة الأرقام السرية</h2><p class="muted">لا يتم تغيير أي رقم إلا بعد مراجعة المدير. الحد الأدنى 4 أرقام والحد الأقصى 12 رقمًا.</p><div id="pinManagerRequestsList"><p class="muted">جارٍ التحميل…</p></div><div class="top-actions"><button id="pinManagerRecoveryClose" class="btn secondary">إغلاق</button></div></div>`;
    document.body.appendChild(m); el('pinManagerRecoveryClose').onclick=()=>hide('pinManagerRecoveryModal');
  }

  function addRecoveryLinks(){
    if(!el('pinRecoveryEntryLink') && el('entryStep')){
      const b=document.createElement('button'); b.id='pinRecoveryEntryLink'; b.className='pin-recovery-link'; b.textContent='نسيت الرقم السري؟'; b.onclick=openRecovery; el('entryStep').appendChild(b);
    }
    if(!el('pinRecoveryAuthLink') && el('memberAuthModal')){
      const host=el('authLoginBtn')?.parentElement?.parentElement;
      if(host){const b=document.createElement('button');b.id='pinRecoveryAuthLink';b.className='pin-recovery-link';b.textContent='نسيت الرقم السري؟';b.onclick=openRecovery;host.appendChild(b);}
    }
  }

  function populateRecoveryMembers(){
    const src=el('entryMember'); const dst=el('pinRecoveryMember'); if(!dst)return;
    const members=Array.isArray(window.state?.members)?window.state.members:[];
    const cur=dst.value;
    dst.innerHTML=members.filter(m=>m.active!==false).map(m=>`<option value="${m.id}">${esc(m.name)}</option>`).join('');
    if(cur)dst.value=cur; if(!dst.value && src?.value)dst.value=src.value;
    syncRecoveryMember();
  }

  function syncRecoveryMember(){
    const id=Number(el('pinRecoveryMember')?.value||0); const members=Array.isArray(window.state?.members)?window.state.members:[]; const m=members.find(x=>Number(x.id)===id);
    if(m && el('pinRecoveryName')) el('pinRecoveryName').value='';
    if(el('pinRecoveryPhone')) el('pinRecoveryPhone').value='';
  }

  function openRecovery(){
    injectStyles(); injectRecoveryModal(); populateRecoveryMembers(); el('pinRecoveryStatus').textContent=''; show('pinRecoveryModal');
  }

  async function submitRecovery(){
    const id=Number(el('pinRecoveryMember')?.value||0), name=el('pinRecoveryName')?.value.trim()||'', phone=el('pinRecoveryPhone')?.value.trim()||'';
    if(!id || !name){el('pinRecoveryStatus').textContent='اختر العضو واكتب الاسم للتأكيد.';el('pinRecoveryStatus').className='status bad';return;}
    const {data,error}=await client.rpc('request_member_pin_reset',{p_member_id:id,p_name:name,p_phone:phone||null});
    if(error){el('pinRecoveryStatus').textContent='تعذر تسجيل الطلب حاليًا.';el('pinRecoveryStatus').className='status bad';return;}
    el('pinRecoveryStatus').textContent=data?.message||'تم إرسال الطلب للمراجعة.';el('pinRecoveryStatus').className='status ok';
  }

  async function openManagerRequests(){
    show('pinManagerRecoveryModal'); const list=el('pinManagerRequestsList'); list.innerHTML='<p class="muted">جارٍ التحميل…</p>';
    const pin=window.state?.pin; if(!window.state?.manager || !pin){list.innerHTML='<p class="status bad">يجب الدخول كمدير أولًا.</p>';return;}
    const {data,error}=await client.rpc('manager_get_pin_reset_requests',{p_manager_pin:pin});
    if(error){list.innerHTML='<p class="status bad">تعذر تحميل الطلبات.</p>';return;}
    const rows=Array.isArray(data)?data:[];
    list.innerHTML=rows.length?rows.map(r=>`<div class="pin-request-row"><b>${esc(r.full_name)}</b><div class="muted">${r.phone?esc(r.phone):'لا يوجد جوال مسجل'} — ${new Date(r.created_at).toLocaleString('ar-SA')}</div><div class="top-actions"><input id="pinReset-${r.id}" type="password" inputmode="numeric" maxlength="12" placeholder="الرقم الجديد 4–12 رقمًا"><button class="small-btn" data-reset-request="${r.id}">تغيير الرقم وإغلاق الطلب</button></div></div>`).join(''):'<p class="muted">لا توجد طلبات استعادة مفتوحة.</p>';
    list.querySelectorAll('[data-reset-request]').forEach(b=>b.onclick=()=>resetFromRequest(Number(b.dataset.resetRequest)));
  }

  async function resetFromRequest(id){
    const pin=window.state?.pin, input=el('pinReset-'+id), newPin=input?.value.trim()||'';
    if(!/^\d{4,12}$/.test(newPin)){alert('الرقم السري يجب أن يكون من 4 إلى 12 رقمًا.');return;}
    const {data,error}=await client.rpc('manager_reset_member_pin_from_request',{p_manager_pin:pin,p_request_id:id,p_new_pin:newPin});
    if(error){alert(error.message||'تعذر تغيير الرقم السري.');return;}
    alert(data?.message||'تم تغيير الرقم السري.'); await openManagerRequests();
  }

  function syncManagerButton(){ const b=el('pinManagerRecoveryFab'); if(!b)return; b.classList.toggle('hidden',!(window.state?.manager)); }

  function init(){
    injectStyles(); injectRecoveryModal(); injectManagerRecovery(); addRecoveryLinks();
    setInterval(()=>{ addRecoveryLinks(); populateRecoveryMembers(); syncManagerButton(); },1500);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
