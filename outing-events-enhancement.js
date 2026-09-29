/* تطوير الطلعات الشهرية + مناسبات الحي */
(function(){
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ctx=()=>window.GHADEER_CTX?.();
  const toast=m=>window.toast?window.toast(m):alert(m);
  function ensurePage(id,title,icon){
    if(document.getElementById(id))return document.getElementById(id);
    const p=document.createElement('section');p.id=id;p.className='page';p.innerHTML=`<div class="card"><h2>${icon} ${title}</h2><div id="${id}-body"></div></div>`;document.querySelector('#app')?.appendChild(p);return p;
  }
  function addNav(id,label,icon){
    const nav=document.querySelector('.bottom-nav'); if(!nav||nav.querySelector(`[data-page="${id}"]`))return;
    const b=document.createElement('button');b.type='button';b.dataset.page=id;b.innerHTML=`<span>${icon}</span><small>${label}</small>`;b.onclick=()=>window.openPage?.(id);nav.appendChild(b);
  }
  function input(id,label,type='text',value=''){return `<label>${label}<input id="${id}" type="${type}" value="${esc(value)}"></label>`}
  async function rpc(name,args){const c=ctx();if(!c?.rpc)throw Error('جلسة البرنامج غير متاحة');return c.rpc(name,args)}
  async function refreshOutings(){const c=ctx();if(c?.loadData)await c.loadData();}
  function outingPage(){
    const p=ensurePage('outingAdvanced','الطلعات الشهرية','🚌');
    p.querySelector('#outingAdvanced-body').innerHTML=`
      <div class="card"><h3>إدارة الوقت والنتائج</h3><p class="muted">تغيير وقت طلعة واحدة فقط لا يغيّر مواعيد بقية الطلعات.</p>
      <div id="outingRows"></div></div>
      <div class="card"><h3>تقييم الطلعة</h3><p class="muted">يستطيع كل حاضر تقييم المكان والطعام والوقت والتكلفة والتنظيم والنظافة، مع إظهار الاسم أو إخفائه.</p>
      <div id="reviewForm"></div></div>
      <div class="card"><h3>تحليل الطلعة</h3><div id="outingAnalytics"></div></div>`;
    renderOutingsAdvanced();
  }
  async function renderOutingsAdvanced(){
    const c=ctx();if(!c)return;
    const rows=c.state.outings||[];const el=document.getElementById('outingRows');if(!el)return;
    el.innerHTML=rows.length?rows.map(o=>`<div class="card" style="margin:8px 0"><b>${esc(o.outing_type||'طلعة')} — ${esc(o.outing_place||'المكان غير محدد')}</b><div class="muted">${esc(o.outing_date)} ${esc(String(o.outing_time||'').slice(0,5))} — ${esc(o.status||'')}</div><div class="top-actions"><button class="small-btn" onclick="window.GhOutings.time(${o.id})">🕐 تغيير الوقت</button><button class="small-btn" onclick="window.GhOutings.analytics(${o.id})">📊 الحضور والتقييم</button><button class="small-btn" onclick="window.GhOutings.review(${o.id})">⭐ تقييمي</button></div></div>`).join(''):'<p class="muted">لا توجد طلعات.</p>';
  }
  async function changeTime(id){
    const c=ctx();if(!c)return;const t=prompt('الوقت الجديد (مثال 19:30):');if(!t)return;
    try{let r;if(c.state.manager)r=await rpc('manager_update_outing_time',{p_manager_pin:c.state.pin,p_id:id,p_new_time:t});else if(c.state.supervisor)r=await rpc('supervisor_update_outing_time',{p_member_id:c.state.member.id,p_pin:c.state.pin,p_id:id,p_new_time:t});else return toast('هذه العملية للمطور/المدير أو المشرف المفوض فقط.');if(r.error)throw Error(r.error.message);toast('تم تعديل وقت هذه الطلعة فقط.');await refreshOutings();renderOutingsAdvanced();}catch(e){toast(e.message)}
  }
  async function review(id){
    const c=ctx();if(!c?.state.member)return toast('سجل الدخول أولاً.');
    const vals=['المكان','الطعام','الوقت','التكلفة','التنظيم','النظافة'];const scores={};for(const v of vals){const n=Number(prompt(`${v}: من 1 إلى 5`));if(!(n>=1&&n<=5))return toast('يجب أن تكون التقييمات من 1 إلى 5.');scores[v]=n}
    const display=confirm('هل تريد إظهار اسمك مع التقييم؟');const comment=prompt('ملاحظاتك (اختياري):')||'';const suggestion=prompt('اقتراحك للتطوير وتقليل التكلفة (اختياري):')||'';
    const r=await rpc('submit_outing_review',{p_member_id:c.state.member.id,p_pin:c.state.pin,p_outing_id:id,p_place:scores['المكان'],p_food:scores['الطعام'],p_time:scores['الوقت'],p_cost:scores['التكلفة'],p_organization:scores['التنظيم'],p_cleanliness:scores['النظافة'],p_display_name:display,p_comment:comment,p_suggestion:suggestion});if(r.error)toast(r.error.message);else toast('تم حفظ تقييمك.');
  }
  async function analytics(id){
    const c=ctx();if(!c?.state.member)return toast('سجل الدخول أولاً.');
    try{const r=await rpc('get_outing_analytics',{p_member_id:c.state.member.id,p_pin:c.state.pin,p_outing_id:id});if(r.error)throw Error(r.error.message);const d=r.data||{};document.getElementById('outingAnalytics').innerHTML=`<b>الحضور:</b> ${d.present_count||0} — <b>الاعتذارات:</b> ${d.apology_count||0}<hr><b>الأكثر حضورًا</b><pre>${esc(JSON.stringify(d.top_attenders||[],null,2))}</pre><b>التقييمات والملاحظات</b><pre>${esc(JSON.stringify(d.reviews||[],null,2))}</pre>`;}catch(e){toast(e.message)}
  }
  function reviewForm(){return ''}
  function eventsPage(){
    const p=ensurePage('neighborhoodEvents','مناسبات الحي','🎉');
    p.querySelector('#neighborhoodEvents-body').innerHTML=`<div class="card"><h3>مناسبات الحي</h3><p class="muted">مناسبة واسعة للحي: تكريم، استقبال ضيف، اجتماع، إفطار، فعالية أو غيرها.</p><div id="eventsList"></div></div><div class="card" id="eventManagerCard"><h3>إضافة مناسبة</h3>${input('evTitle','اسم المناسبة')}${input('evType','النوع','text','تكريم')}${input('evDate','التاريخ','date')}${input('evTime','الوقت','time')}${input('evPlace','المكان')}${input('evPurpose','الهدف')}${input('evBudget','الميزانية','number','0')}<label>المنظم<select id="evOrganizer"></select></label><label>المضيف/المستقبل<select id="evHost"></select></label><label>رسالة الترحيب<textarea id="evWelcome"></textarea></label><label>رسالة الشكر للمنظمين<textarea id="evThanks"></textarea></label><button class="btn" onclick="window.GhEvents.create()">إنشاء المناسبة</button></div><div class="card"><h3>توزيع المشاركين والمبالغ</h3><div id="eventDetails"></div></div>`;
    const c=ctx();if(c){const opts=(c.state.members||[]).filter(m=>m.active).map(m=>`<option value="${m.id}">${esc(m.name)}</option>`).join('');document.getElementById('evOrganizer').innerHTML=opts;document.getElementById('evHost').innerHTML=opts;}
    renderEvents();
  }
  async function renderEvents(){const r=await rpc('get_neighborhood_events',{});if(r.error)return;const rows=r.data||[];const el=document.getElementById('eventsList');if(!el)return;el.innerHTML=rows.length?rows.map(e=>`<div class="card" style="margin:8px 0"><b>🎉 ${esc(e.title)}</b><div>${esc(e.event_type)} — ${esc(e.event_date)} ${esc(String(e.event_time||'').slice(0,5))}</div><div class="muted">${esc(e.place||'')} — الميزانية ${Number(e.total_budget||0).toFixed(2)} ريال</div><p>${esc(e.purpose||'')}</p><div class="top-actions"><button class="small-btn" onclick="window.GhEvents.details(${e.id})">👥 المشاركون والتوزيع</button></div></div>`).join(''):'<p class="muted">لا توجد مناسبات.</p>';}
  async function createEvent(){const c=ctx();if(!c)return;if(!c.state.manager&&!c.state.supervisor)return toast('إنشاء المناسبة للمطور/المدير أو المشرف المفوض.');const args={p_title:document.getElementById('evTitle').value.trim(),p_event_type:document.getElementById('evType').value.trim()||'مناسبة',p_date:document.getElementById('evDate').value,p_time:document.getElementById('evTime').value||null,p_place:document.getElementById('evPlace').value.trim(),p_purpose:document.getElementById('evPurpose').value.trim(),p_organizer_id:Number(document.getElementById('evOrganizer').value)||null,p_host_id:Number(document.getElementById('evHost').value)||null,p_welcome:document.getElementById('evWelcome').value.trim(),p_thanks:document.getElementById('evThanks').value.trim(),p_budget:Number(document.getElementById('evBudget').value)||0};let r;if(c.state.manager)r=await rpc('manager_create_neighborhood_event',{p_manager_pin:c.state.pin,...args});else return toast('سيتم إضافة إنشاء المناسبة للمشرف المفوض في الخطوة التالية.');if(r.error)return toast(r.error.message);toast('تم إنشاء المناسبة.');await renderEvents();}
  async function details(id){const r=await rpc('get_event_details',{p_event_id:id});if(r.error)return toast(r.error.message);const d=r.data||{};const c=ctx();const members=(c?.state.members||[]).filter(m=>m.active);const opts=members.map(m=>`<option value="${m.id}">${esc(m.name)}</option>`).join('');document.getElementById('eventDetails').innerHTML=`<b>${esc(d.event?.title||'')}</b><div class="muted">${esc(d.event?.welcome_text||'')}</div><hr><label>العضو<select id="epMember">${opts}</select></label><input id="epDue" type="number" placeholder="المبلغ المطلوب"><input id="epPaid" type="number" placeholder="المبلغ المدفوع"><input id="epRole" placeholder="الدور: منظم/مشارك/مستقبل"><button class="small-btn" onclick="window.GhEvents.participant(${id})">حفظ المشارك</button><h4>المشاركون</h4><pre>${esc(JSON.stringify(d.participants||[],null,2))}</pre><hr><input id="eeAmount" type="number" placeholder="مبلغ المصروف"><input id="eeCategory" placeholder="الفئة: طعام/مكان/ضيافة"><input id="eeNote" placeholder="ملاحظة"><button class="small-btn" onclick="window.GhEvents.expense(${id})">إضافة مصروف</button><pre>${esc(JSON.stringify(d.expenses||[],null,2))}</pre>`;}
  async function participant(id){const c=ctx();if(!c?.state.manager)return toast('توزيع المشاركين للمطور/المدير حالياً.');const r=await rpc('manager_set_event_participant',{p_manager_pin:c.state.pin,p_event_id:id,p_member_id:Number(document.getElementById('epMember').value),p_role:document.getElementById('epRole').value||'مشارك',p_amount_due:Number(document.getElementById('epDue').value)||0,p_amount_paid:Number(document.getElementById('epPaid').value)||0});if(r.error)return toast(r.error.message);toast('تم حفظ توزيع المبلغ.');details(id);}
  async function expense(id){const c=ctx();if(!c?.state.manager)return toast('المصاريف للمطور/المدير حالياً.');const r=await rpc('manager_add_event_expense',{p_manager_pin:c.state.pin,p_event_id:id,p_member_id:Number(document.getElementById('epMember').value)||null,p_category:document.getElementById('eeCategory').value||'مصاريف',p_amount:Number(document.getElementById('eeAmount').value)||0,p_note:document.getElementById('eeNote').value||''});if(r.error)return toast(r.error.message);toast('تم تسجيل المصروف.');details(id);}
  window.GhOutings={time:changeTime,review,analytics};window.GhEvents={create:createEvent,details,participant,expense};
  document.addEventListener('DOMContentLoaded',()=>{addNav('outingAdvanced','الطلعات','🚌');addNav('neighborhoodEvents','مناسبات الحي','🎉');outingPage();eventsPage();});
})();
