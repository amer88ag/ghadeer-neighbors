/* خدمات حي الغدير التفاعلية — واجهة مدمجة وعملية */
(()=>{
'use strict';
const URL='https://xewjakfmdfkbhcnxglct.supabase.co';
const KEY='sb_publishable__i-E8Gi5hcdfNd7gZXa12Q_-ZPSXPUr';
let db,members=[];
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toast=m=>{if(typeof window.toast==='function')window.toast(m,true);else console.warn(m)};
const getState=()=>{try{return state}catch(_){return window.state||null}};
function client(){if(db)return db;db=window.supabase?.createClient(URL,KEY);return db}
function auth(){const s=getState();return {id:Number(s?.member?.id)||Number($('ghSvcMember')?.value)||0,pin:s?.pin||$('ghSvcPin')?.value||''}}
function openMemberAuth(){
  if(typeof window.showMemberAuth==='function'){window.showMemberAuth();return true}
  const m=$('memberAuthModal');if(m)m.classList.remove('hidden');
  return !!m;
}
async function ensureAuth(){
  const a=auth();
  if(a.id&&a.pin)return true;
  openMemberAuth();
  toast('سجّل دخولك أولًا ثم أعد النشر');
  return false;
}
async function loadMembers(){
  const el=$('ghSvcMember');if(!el)return;
  try{
    const s=getState();
    const fromState=Array.isArray(s?.members)?s.members.filter(m=>m.active!==false):[];
    if(fromState.length)members=fromState;
    else{
      const c=client();if(!c)throw Error('database');
      const r=await c.rpc('get_public_members');if(r.error)throw r.error;
      let rows=r.data;if(typeof rows==='string'){try{rows=JSON.parse(rows)}catch(e){rows=[]}}
      members=Array.isArray(rows)?rows.filter(m=>m.active!==false):[];
    }
    const current=Number(getState()?.member?.id)||Number(el.value)||0;
    el.innerHTML='<option value="">اختر اسمك</option>'+members.map(m=>`<option value="${m.id}">${esc(m.name)}</option>`).join('');
    if(current)el.value=String(current);
    if(!members.length)el.innerHTML='<option value="">لا توجد أسماء متاحة</option>';
  }catch(e){
    el.innerHTML='<option value="">تعذر تحميل أسماء الجيران</option>';
    console.error('[ghadeer services members]',e);
  }
}
function row(a){return `<article class="gh-svc-row"><div class="gh-svc-row-head"><b>${esc(a.title||'بدون عنوان')}</b><span class="pill">${esc(a.status||'مفتوحة')}</span></div><div class="gh-svc-desc">${esc(a.description||'')}</div><small class="muted">👤 ${esc(a.member_name||'جارٍ')}</small></article>`}
function card(icon,title,desc,key){return `<button type="button" class="gh-svc-type" data-t="${key}"><span class="gh-svc-type-icon">${icon}</span><span><b>${title}</b><small>${desc}</small></span></button>`}
async function load(){
  const c=client();if(!c)return;
  const r=await c.rpc('list_neighbor_services');
  if(r.error){if($('ghSvcLists'))$('ghSvcLists').innerHTML='<div class="gh-svc-empty">تعذر تحميل الخدمات الآن.</div>';return}
  const x=r.data||{},help=x.help||[],market=x.market||[],initiatives=x.initiatives||[];
  const active=$('ghSvcActiveTab')?.value||'help';
  const data={help,market,initiative:initiatives};
  const labels={help:'🤝 خدمات الجيران',market:'🛍️ سوق الحي',initiative:'💡 مبادرات الحي'};
  const rows=data[active]||[];
  if($('ghSvcLists'))$('ghSvcLists').innerHTML=`<div class="gh-svc-summary"><span>من سكان الحي إلى سكان الحي</span><span>${rows.length} منشور</span></div><h3 class="gh-svc-list-title">${labels[active]}</h3>${rows.length?rows.slice(0,8).map(row).join(''):'<div class="gh-svc-empty">لا توجد مشاركات منشورة حاليًا.</div>'}`;
}
function selectTab(tab){
  const input=$('ghSvcActiveTab');if(input)input.value=tab;
  document.querySelectorAll('#ghNeighborhoodServices [data-t]').forEach(b=>b.classList.toggle('active',b.dataset.t===tab));
  $('ghSvcHelpForm')?.classList.toggle('hidden',tab!=='help');
  $('ghSvcMarketForm')?.classList.toggle('hidden',tab!=='market');
  $('ghSvcInitForm')?.classList.toggle('hidden',tab!=='initiative');
  const title=$('ghSvcModalTitle');if(title)title.textContent=tab==='help'?'إضافة خدمة':tab==='market'?'إضافة إلى سوق الحي':'إضافة مبادرة';
  $('ghSvcModal')?.classList.remove('hidden');
  loadMembers();
}
function closeForm(){ $('ghSvcModal')?.classList.add('hidden'); }
async function postHelp(){
  if(!(await ensureAuth()))return;
  const a=auth(),t=$('ghSvcTitle')?.value.trim()||'',d=$('ghSvcDesc')?.value.trim()||'',s=$('ghSvcStatus')?.value||'طلب';
  if(!t)return toast('اكتب عنوان الخدمة');
  const r=await client().rpc('create_neighbor_help',{p_member_id:a.id,p_pin:a.pin,p_title:t,p_description:d,p_status:s});
  if(r.error)return toast(r.error.message);if(r.data?.success===false)return toast(r.data.message||'تعذر النشر');
  $('ghSvcTitle').value='';$('ghSvcDesc').value='';closeForm();toast('تم نشر عرض/طلب الخدمة');await load();
}
async function postMarket(){
  if(!(await ensureAuth()))return;
  const a=auth(),k=$('ghMarketKind')?.value||'طلب',t=$('ghMarketTitle')?.value.trim()||'',d=$('ghMarketDesc')?.value.trim()||'';
  if(!t)return toast('اكتب عنوان المنتج أو الطلب');
  const r=await client().rpc('create_neighbor_market',{p_member_id:a.id,p_pin:a.pin,p_kind:k,p_title:t,p_description:d});
  if(r.error)return toast(r.error.message);if(r.data?.success===false)return toast(r.data.message||'تعذر النشر');
  $('ghMarketTitle').value='';$('ghMarketDesc').value='';closeForm();toast('تم نشر عرض/طلب المنتج');await load();
}
async function postInitiative(){
  if(!(await ensureAuth()))return;
  const a=auth(),t=$('ghInitTitle')?.value.trim()||'',d=$('ghInitDesc')?.value.trim()||'';
  if(!t)return toast('اكتب اسم المبادرة');
  const r=await client().rpc('create_neighbor_initiative',{p_member_id:a.id,p_pin:a.pin,p_title:t,p_description:d});
  if(r.error)return toast(r.error.message);if(r.data?.success===false)return toast(r.data.message||'تعذر النشر');
  $('ghInitTitle').value='';$('ghInitDesc').value='';closeForm();toast('تم نشر المبادرة');await load();
}
function mount(){
  const home=$('home');if(!home)return;
  let sec=$('ghNeighborhoodServices');
  if(!sec){
    sec=document.createElement('section');sec.id='ghNeighborhoodServices';sec.className='card gh-svc-panel';
    sec.innerHTML=`<div class="gh-svc-head"><div><div class="gh-svc-kicker">🏘️ خدمات الحي</div><h2>خدمات الحي التفاعلية</h2><p>اطلب خدمة، اعرض مهارة، أو شارك بمبادرة.</p></div><button type="button" id="ghSvcRefresh" class="btn secondary gh-svc-refresh">🔄</button></div><div class="gh-svc-actions"><button type="button" class="gh-svc-action active" data-t="help">🤝 خدمات</button><button type="button" class="gh-svc-action" data-t="market">🛍️ السوق</button><button type="button" class="gh-svc-action" data-t="initiative">💡 المبادرات</button><button type="button" id="ghSvcAdd" class="gh-svc-add">＋ إضافة</button></div><input id="ghSvcActiveTab" type="hidden" value="help"><div id="ghSvcLists"></div><div id="ghSvcModal" class="gh-svc-modal hidden"><div class="gh-svc-modal-card" role="dialog" aria-modal="true"><div class="gh-svc-modal-head"><h3 id="ghSvcModalTitle">إضافة خدمة</h3><button type="button" id="ghSvcClose" class="gh-svc-close" aria-label="إغلاق">×</button></div><p class="muted gh-svc-login-note">النشر يتطلب عضوية الحي. إذا كنت مسجل الدخول سيُستخدم حسابك تلقائيًا.</p><div id="ghSvcHelpForm"><label>نوع المشاركة</label><select id="ghSvcStatus"><option value="طلب">🔎 أطلب خدمة</option><option value="عرض">🤝 أعرض خدمة</option></select><label>العنوان</label><input id="ghSvcTitle" placeholder="مثال: توصيل دواء لكبير سن"><label>التفاصيل <span class="muted">(اختياري)</span></label><textarea id="ghSvcDesc" rows="3" placeholder="المكان والوقت والتفاصيل..."></textarea><button id="ghSvcPost" class="btn primary gh-svc-submit">نشر الخدمة</button></div><div id="ghSvcMarketForm" class="hidden"><label>نوع المشاركة</label><select id="ghMarketKind"><option value="طلب">🔎 أطلب منتجًا/غرضًا</option><option value="عرض">🛍️ أعرض منتجًا/غرضًا</option></select><label>العنوان</label><input id="ghMarketTitle" placeholder="مثال: مكتب أطفال للبيع"><label>التفاصيل <span class="muted">(اختياري)</span></label><textarea id="ghMarketDesc" rows="3"></textarea><button id="ghMarketPost" class="btn primary gh-svc-submit">نشر في سوق الحي</button></div><div id="ghSvcInitForm" class="hidden"><label>اسم المبادرة</label><input id="ghInitTitle" placeholder="مثال: مبادرة تشجير مدخل الحي"><label>الفكرة والتفاصيل <span class="muted">(اختياري)</span></label><textarea id="ghInitDesc" rows="3"></textarea><button id="ghInitPost" class="btn primary gh-svc-submit">نشر المبادرة</button></div></div></div>`;
    const anchor=home.querySelector('.hadith-board');anchor?anchor.insertAdjacentElement('afterend',sec):home.appendChild(sec);
  }
  if(!document.getElementById('ghSvcStyle'))style();
  sec.querySelectorAll('.gh-svc-action').forEach(b=>{if(b.dataset.bound)return;b.dataset.bound='1';b.onclick=()=>selectTab(b.dataset.t)});
  const add=$('ghSvcAdd');if(add&&!add.dataset.bound){add.dataset.bound='1';add.onclick=()=>selectTab($('ghSvcActiveTab')?.value||'help')}
  const close=$('ghSvcClose');if(close&&!close.dataset.bound){close.dataset.bound='1';close.onclick=closeForm}
  const modal=$('ghSvcModal');if(modal&&!modal.dataset.bound){modal.dataset.bound='1';modal.addEventListener('click',e=>{if(e.target===modal)closeForm()})}
  const bind=(id,fn)=>{const b=$(id);if(b&&!b.dataset.bound){b.dataset.bound='1';b.onclick=fn}};
  bind('ghSvcPost',postHelp);bind('ghMarketPost',postMarket);bind('ghInitPost',postInitiative);bind('ghSvcRefresh',async()=>{await loadMembers();await load()});
  loadMembers();load();
}
function style(){
  if($('ghSvcStyle'))return;
  const s=document.createElement('style');s.id='ghSvcStyle';s.textContent=`
    #ghNeighborhoodServices{padding:12px;margin-bottom:12px}
    .gh-svc-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
    .gh-svc-head h2{margin:0 0 3px;font-size:21px}.gh-svc-head p{margin:0;color:var(--muted);font-size:12px}.gh-svc-kicker{color:var(--g);font-weight:900;font-size:12px;margin-bottom:2px}.gh-svc-refresh{width:48px;height:42px;padding:0}
    .gh-svc-actions{display:flex;gap:7px;overflow:auto;margin:10px 0}.gh-svc-action,.gh-svc-add{white-space:nowrap;border:1px solid var(--line);background:#fff;border-radius:999px;padding:8px 11px;font-weight:800}.gh-svc-action.active{background:var(--g);color:#fff;border-color:var(--g)}.gh-svc-add{margin-right:auto;color:var(--g);background:#f4faf6;border-color:#cfe4d7}
    .gh-svc-summary{display:flex;justify-content:space-between;gap:8px;background:#f7faf7;border:1px solid #e1ebe4;border-radius:10px;padding:7px 9px;font-size:11px;color:var(--muted)}.gh-svc-list-title{font-size:16px;margin:10px 0 6px}
    .gh-svc-row{border:1px solid var(--line);background:#fff;border-radius:12px;padding:9px 10px;margin:6px 0}.gh-svc-row-head{display:flex;align-items:center;justify-content:space-between;gap:8px}.gh-svc-row-head b{font-size:14px}.gh-svc-desc{margin:4px 0;line-height:1.6;font-size:12px;color:#4f4a44}.gh-svc-empty{background:#faf8f3;border:1px dashed var(--line);border-radius:12px;padding:12px;text-align:center;color:var(--muted);font-size:12px}
    .gh-svc-modal{position:fixed;inset:0;background:#0007;z-index:70;display:grid;place-items:center;padding:14px}.gh-svc-modal.hidden{display:none!important}.gh-svc-modal-card{width:min(560px,100%);max-height:88vh;overflow:auto;background:#fff;border:1px solid var(--line);border-radius:18px;padding:15px;box-shadow:0 18px 50px #0004}.gh-svc-modal-head{display:flex;align-items:center;justify-content:space-between;gap:8px}.gh-svc-modal-head h3{margin:0;font-size:18px}.gh-svc-close{border:0;background:#f3eee5;border-radius:50%;width:34px;height:34px;font-size:24px;line-height:1}.gh-svc-login-note{margin:4px 0 10px}.gh-svc-submit{width:100%;margin-top:9px}
    @media(max-width:650px){#ghNeighborhoodServices{padding:10px}.gh-svc-head h2{font-size:18px}.gh-svc-actions{margin-bottom:8px}.gh-svc-action,.gh-svc-add{padding:7px 9px;font-size:12px}.gh-svc-row{padding:8px}.gh-svc-row-head b{font-size:13px}.gh-svc-modal{padding:8px}.gh-svc-modal-card{border-radius:16px;padding:13px}}
  `;document.head.appendChild(s)
}
function boot(){style();setTimeout(mount,350);setTimeout(mount,1200);setTimeout(mount,2500)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();