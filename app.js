/* جيران حي الغدير بالمحالة — تطبيق ويب ثابت متوافق مع GitHub/Vercel */
const SUPABASE_URL = "https://xewjakfmdfkbhcnxglct.supabase.co";
const SUPABASE_KEY = "sb_publishable__i-E8Gi5hcdfNd7gZXa12Q_-ZPSXPUr";
const supabaseLib = window.supabase;
const createClient = supabaseLib?.createClient;
const db = createClient ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;
if(!db) console.error("Supabase client could not be initialized.");

const state = {
  member: null, pin: null, manager: false, supervisor: false,
  members: [], coffee: [], outings: [], announcements: [], messages: [],
  settings: {}, permissions: null
};

const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtDate = d => d ? new Date(d + "T00:00:00").toLocaleDateString("ar-SA",{weekday:"short",year:"numeric",month:"short",day:"numeric"}) : "—";
const fmtTime = t => t ? String(t).slice(0,5) : "—";
function toast(msg, ok=true){ const el=$("toast"); el.textContent=msg; el.className="toast show "+(ok?"ok":"bad"); clearTimeout(window.__toast); window.__toast=setTimeout(()=>el.className="toast",3200); }
function setStatus(id,msg,ok=true){ const el=$(id); if(el){el.textContent=msg; el.className="status "+(ok?"ok":"bad");} }
function rpc(name, args={}){ return db.rpc(name,args); }
async function table(name, opts={}){
  let q=db.from(name).select(opts.select || "*");
  if(opts.order) q=q.order(opts.order,{ascending:opts.ascending!==false});
  if(opts.limit) q=q.limit(opts.limit);
  if(opts.eq) for(const [k,v] of Object.entries(opts.eq)) q=q.eq(k,v);
  return q;
}
function activeMemberList(){ return state.members.filter(m=>m.active); }
function memberName(id){ return state.members.find(m=>Number(m.id)===Number(id))?.name || "—"; }
function currentDateISO(){ return new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Riyadh",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date()); }

async function loadMembers(){
  if(!db){toast("تعذر تشغيل قاعدة البيانات. أعد تحميل الصفحة.",false); return;}
  const {data,error}=await table("members",{order:"id"});
  if(error){toast("تعذر تحميل الجيران: "+error.message,false); return;}
  state.members=data||[];
  fillMemberSelects();
  renderMembers();
}
async function loadData(){
  if(!db){return;}
  const [c,o,a,m,p,s] = await Promise.all([
    table("coffee_schedule",{order:"coffee_date"}),
    table("outings_schedule",{order:"outing_date"}),
    table("announcements",{order:"created_at",ascending:false,limit:20}),
    table("group_messages",{order:"created_at",ascending:true,limit:100}),
    table("member_permissions",{order:"member_id"}),
    rpc("get_schedule_settings")
  ]);
  if(c.error) toast("تعذر تحميل جدول القهوة: "+c.error.message,false);
  else state.coffee=c.data||[];
  if(o.error) toast("تعذر تحميل جدول الطلعات: "+o.error.message,false);
  else state.outings=o.data||[];
  if(a.error) state.announcements=[]; else state.announcements=a.data||[];
  if(m.error) state.messages=[]; else state.messages=m.data||[];
  state.permissions = p.error ? [] : (p.data||[]);
  state.settings = s.error ? {} : (s.data||{});
  renderAll();
  fillManagerMessageSelect();
  fillOccasionSelect();
  if(state.manager) renderManager();
}
function renderAll(){
  renderHome(); renderCoffee(); renderOutings(); renderMessages(); renderMembers();
}
function occasionRows(){return state.announcements.filter(a=>a.is_occasion===true).sort((x,y)=>new Date(x.scheduled_at||x.created_at)-new Date(y.scheduled_at||y.created_at));}
function fillOccasionSelect(){const el=$("occasionId");if(!el)return;const rows=occasionRows();const cur=el.value;el.innerHTML=rows.map(x=>`<option value="${x.id}">${x.occasion_type==="وطنية"?"🇸🇦":"🕌"} ${esc(x.title)} — ${new Date(x.scheduled_at||x.created_at).toLocaleString("ar-SA")}</option>`).join("");if(cur)el.value=cur;const x=rows.find(z=>Number(z.id)===Number(el.value));if(x){$("editOccasionTitle").value=x.title||"";$("editOccasionType").value=x.occasion_type||"دينية";$("editOccasionMessage").value=x.message||"";$("editOccasionAt").value=x.scheduled_at?new Date(x.scheduled_at).toISOString().slice(0,16):"";}$("occasionList").textContent=rows.length?rows.map(x=>`${x.title} — ${new Date(x.scheduled_at||x.created_at).toLocaleString("ar-SA")}`).join("\n"):"لا توجد رسائل مناسبات.";renderOccasionAutomationRules();}
async function renderOccasionAutomationRules(){const el=$("occasionAutomationList");if(!el||(!state.manager&&!state.supervisor))return;const {data,error}=await rpc("get_occasion_automation_rules");if(error){el.innerHTML="<p class='muted'>تعذر تحميل قواعد المناسبات.</p>";return;}const rows=Array.isArray(data)?data:[];el.innerHTML=rows.map(x=>`<div class="permission-row" style="margin:6px 0;padding:10px;border:1px solid var(--line);border-radius:12px"><div><b>${x.occasion_type==="وطنية"?"🇸🇦":"🕌"} ${esc(x.title)}</b><div class="muted">${x.calendar_type==="hijri"?"هجري":"ميلادي"} — ${x.enabled?"تلقائي مفعّل":"متوقف"}</div></div><button class="small-btn" onclick="toggleOccasionAutomation('${esc(x.rule_key)}',${x.enabled})">${x.enabled?"⏸️ إيقاف":"▶️ تشغيل"}</button></div>`).join("")||"<p class='muted'>لا توجد قواعد تلقائية.</p>";}
async function toggleOccasionAutomation(ruleKey,enabled){let data,error;if(state.manager){({data,error}=await rpc("manager_set_occasion_automation",{p_manager_pin:state.pin,p_rule_key:ruleKey,p_enabled:!enabled}));}else if(state.supervisor){({data,error}=await rpc("supervisor_set_occasion_automation",{p_member_id:state.member.id,p_pin:state.pin,p_rule_key:ruleKey,p_enabled:!enabled}));}else return toast("لا تملك صلاحية إدارة المناسبات.",false);const rr=rpcResult(data,error);if(!rr.ok)return toast(rr.message,false);toast(rr.message||"تم تحديث المناسبة.");await renderOccasionAutomationRules();}
function visibleOccasions(){const now=Date.now();return occasionRows().filter(x=>!x.scheduled_at||new Date(x.scheduled_at).getTime()<=now);}
function renderHome(){
  const today=currentDateISO();
  const c=state.coffee.find(x=>x.coffee_date>=today);
  const o=state.outings.find(x=>x.outing_date>=today);
  $("nextCoffee").innerHTML=c?`<b>${esc(memberName(c.member_id))}</b><br><span>${fmtDate(c.coffee_date)} — ${fmtTime(c.coffee_time)}</span>`:"لا يوجد موعد قادم";
  $("nextOuting").innerHTML=o?`<b>${esc(memberName(o.member1_id))} + ${esc(memberName(o.member2_id))}</b><br><span>${fmtDate(o.outing_date)} — ${fmtTime(o.outing_time)}</span>`:"لا توجد طلعة قادمة";
  const a=visibleOccasions()[0]||state.announcements.find(x=>!x.is_occasion);
  $("latestAnnouncement").innerHTML=a?`<b>${esc(a.title)}</b><br><span>${esc(a.message).slice(0,150)}</span>`:"لا توجد إعلانات";
  $("memberCount").textContent=activeMemberList().length+" جار نشط"; const mc=$("messageCount"); if(mc) mc.textContent=state.messages.length+" رسالة";
}
function renderCoffee(){
  const body=$("coffeeTable"), sel=$("coffeeApologyId");
  body.innerHTML=""; sel.innerHTML="";
  state.coffee.forEach(x=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${fmtDate(x.coffee_date)}</td><td>${esc(memberName(x.member_id))}</td><td>${fmtTime(x.coffee_time)}</td><td><span class="pill">${esc(x.status||"مجدول")}</span></td><td>${esc(x.notes||"")}</td><td><button class="small-btn" onclick="focusCoffee(${x.id})">عرض</button></td>`;
    body.appendChild(tr);
    const op=document.createElement("option"); op.value=x.id; op.textContent=`${fmtDate(x.coffee_date)} — ${memberName(x.member_id)}`; sel.appendChild(op);
  });
  fillManagerSelects();
}
function renderOutings(){
  const body=$("outingTable"), sel=$("expenseOutingId");
  body.innerHTML=""; sel.innerHTML="";
  state.outings.forEach((x,i)=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${i+1}</td><td>${fmtDate(x.outing_date)}</td><td>${esc(memberName(x.member1_id))}</td><td>${esc(memberName(x.member2_id))}</td><td>${fmtTime(x.outing_time)}</td><td><span class="pill">${esc(x.status||"مجدولة")}</span></td><td><button class="small-btn" onclick="setAttendance(${x.id},true)">حاضر</button> <button class="small-btn ghost-mini" onclick="setAttendance(${x.id},false)">اعتذر</button></td>`;
    body.appendChild(tr);
    const op=document.createElement("option"); op.value=x.id; op.textContent=`${fmtDate(x.outing_date)} — ${memberName(x.member1_id)} + ${memberName(x.member2_id)}`; sel.appendChild(op);
  });
  fillManagerSelects();
}
function renderMembers(){
  const q=($("memberSearch")?.value||"").trim();
  const list=state.members.filter(m=>m.active && (!q || m.name.includes(q)));
  $("membersGrid").innerHTML=list.map(m=>`<article class="member-card"><div class="avatar">👤</div><div><b>${esc(m.name)}</b><p>${esc(m.notes||"جار في الحي")}</p></div></article>`).join("") || `<div class="card">لا توجد نتائج.</div>`;
}
function fillManagerMessageSelect(){const el=$("managerMessageId");if(!el)return;const cur=el.value;el.innerHTML=state.messages.map(m=>`<option value="${m.id}">${new Date(m.created_at).toLocaleString("ar-SA")} — ${esc(String(m.message).slice(0,70))}</option>`).join("");if(cur)el.value=cur;const selected=state.messages.find(x=>Number(x.id)===Number(el.value));if(selected&&$("editManagerMessage"))$("editManagerMessage").value=selected.message||"";}
function renderMessages(){
  $("messagesList").innerHTML=state.messages.map(m=>`<div class="message"><div><b>${esc(m.sender_name||memberName(m.sender_member_id))}</b><span>${new Date(m.created_at).toLocaleString("ar-SA")}</span></div><p>${esc(m.message)}</p></div>`).join("") || `<p class="muted">لا توجد رسائل.</p>`;
}
function fillMemberSelects(){
  const active=activeMemberList();
  ["entryMember","managerMember","authMember"].forEach(id=>{
    const el=$(id); if(!el) return;
    const current=el.value;
    el.innerHTML=active.map(m=>`<option value="${m.id}">${esc(m.name)}</option>`).join("");
    if(current) el.value=current;
  });
  ["mcMember","moMember1","moMember2","newCoffeeMember","newOutingMember1","newOutingMember2","permMember","changePinMember"].forEach(id=>{
    const el=$(id); if(!el) return;
    const current=el.value;
    el.innerHTML=active.map(m=>`<option value="${m.id}">${esc(m.name)}</option>`).join("");
    if(current) el.value=current;
  });
}
function fillManagerSelects(){
  const fill=(id,arr,label)=>{const el=$(id); if(!el)return; const cur=el.value; el.innerHTML=arr.map(x=>`<option value="${x.id}">${esc(label(x))}</option>`).join(""); if(cur)el.value=cur;};
  fill("mcId",state.coffee,x=>`${fmtDate(x.coffee_date)} — ${memberName(x.member_id)}`);
  fill("coffeeSwapA",state.coffee,x=>`${fmtDate(x.coffee_date)} — ${memberName(x.member_id)}`);
  fill("coffeeSwapB",state.coffee,x=>`${fmtDate(x.coffee_date)} — ${memberName(x.member_id)}`);
  fill("moId",state.outings,x=>`${fmtDate(x.outing_date)} — ${memberName(x.member1_id)} + ${memberName(x.member2_id)}`);
  fill("outingSwapA",state.outings,x=>`${fmtDate(x.outing_date)} — ${memberName(x.member1_id)} + ${memberName(x.member2_id)}`);
  fill("outingSwapB",state.outings,x=>`${fmtDate(x.outing_date)} — ${memberName(x.member1_id)} + ${memberName(x.member2_id)}`);
}
function focusCoffee(id){ openPage("coffee"); $("coffeeApologyId").value=id; }
function normalizeDigits(value){
  return String(value ?? "").replace(/[٠-٩]/g,d=>String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).trim();
}
function showMemberAuth(){
  fillMemberSelects();
  const m=$('memberAuthModal'); if(m)m.classList.remove('hidden');
  const st=$('authStatus'); if(st){st.textContent='';st.className='status';}
  const pin=$('authPin'); if(pin){pin.value='';setTimeout(()=>pin.focus(),50);}
}
function closeMemberAuth(){const m=$('memberAuthModal');if(m)m.classList.add('hidden');}
async function requireMemberAuth(){
  if(state.member && state.pin) return true;
  showMemberAuth();
  return false;
}
async function authenticateMemberFromModal(){
  const id=Number($('authMember').value), pin=normalizeDigits($('authPin').value);
  if(!id||!pin){setStatus('authStatus','اختر اسمك وأدخل الرقم السري.',false);return false;}
  setStatus('authStatus','جارٍ التحقق...',true);
  try{
    const {data,error}=await rpc('member_login',{p_member_id:id,p_pin:pin});
    const result=normalizeRpcData(data);
    if(error || result.success!==true){setStatus('authStatus',result.message||error?.message||'الرقم السري غير صحيح.',false);return false;}
    state.member=state.members.find(m=>Number(m.id)===id)||{id,name:result.name||memberName(id)};
    state.pin=pin; state.manager=false; state.supervisor=['super_admin','supervisor'].includes(result.role);
    $('whoami').textContent='— '+state.member.name+(state.supervisor?' (مشرف)':'');
    $('managerNav').classList.toggle('hidden',!state.supervisor);
    closeMemberAuth();
    await ensureAcceptance();
    await loadData();
    toast('تم تسجيل الدخول.');
    return true;
  }catch(e){setStatus('authStatus','حدث خطأ أثناء تسجيل الدخول: '+(e?.message||e),false);return false;}
}
async function memberLogin(){ return authenticateMemberFromModal(); }
async function ensureAcceptance(){
  // Acceptance is recorded after login. We do not store the PIN or acceptance locally.
  const {data,error}=await table("program_acceptances",{eq:{member_id:state.member.id},order:"accepted_at",ascending:false,limit:1});
  if(error || !data?.length){$("acceptModal").classList.remove("hidden");}
}
async function acceptTerms(){
  if(!$("acceptCheck").checked){toast("يرجى تأكيد قراءة الشروط.",false);return;}
  const {error}=await rpc("accept_program_terms",{p_member_id:state.member.id,p_member_name:state.member.name,p_version:"1.0",p_user_agent:navigator.userAgent.slice(0,500)});
  if(error){toast("تعذر تسجيل الموافقة: "+error.message,false);return;}
  $("acceptModal").classList.add("hidden"); toast("تم تسجيل الموافقة.");
}
function normalizeRpcData(data){
  if(typeof data === "string"){ try { return JSON.parse(data); } catch(e){} }
  if(Array.isArray(data) && data.length===1 && data[0] && typeof data[0]==="object") return data[0];
  return data || {};
}
function rpcResult(data,error){
  const r=normalizeRpcData(data);
  return {data:r,error,ok:!error && (r.success===true || r.ok===true),message:r.message||r.error||error?.message||"تعذر تنفيذ العملية."};
}
function showManagerLogin(){
  const e=$('entryScreen'); if(e)e.classList.remove('hidden');
  $('entryStep').classList.add('hidden'); $('managerStep').classList.remove('hidden');
  fillMemberSelects();
  const chosen=state.members.find(m=>m.name.includes('عامر معيض القحطاني')); if(chosen)$('managerMember').value=chosen.id;
  $('managerPin').value=''; $('entryStatus').textContent=''; $('entryStatus').className='status';
  setTimeout(()=>$('managerPin').focus(),50);
}
async function managerLogin(){
  const selected=Number($("managerMember").value), pin=normalizeDigits($("managerPin").value);
  if(!selected||!pin){setStatus("entryStatus","اختر المدير وأدخل الرقم السري.",false);return;}
  const chosen=state.members.find(m=>Number(m.id)===selected);
  if(!chosen || !chosen.name.includes("عامر معيض القحطاني")){setStatus("entryStatus","الدخول الإداري مخصص للمدير المحدد في النظام.",false);return;}
  setStatus("entryStatus","جارٍ التحقق من الرقم السري...",true);
  try{
    const {data,error}=await rpc("manager_pin_login",{p_pin:pin});
    const result=normalizeRpcData(data);
    if(error){ setStatus("entryStatus","تعذر الاتصال بخدمة تسجيل الدخول: "+(error.message||"خطأ غير معروف"),false); return; }
    if(result.success !== true){ setStatus("entryStatus",result.message||"الرقم السري غير صحيح.",false); return; }
    state.member=chosen; state.pin=pin; state.manager=true; state.supervisor=true;
    $("entryScreen").classList.add("hidden");$("app").classList.remove("hidden");
    $("whoami").textContent="— "+chosen.name+" (مدير)";
    $("managerNav").classList.remove("hidden");
    await loadData(); openPage("manager"); renderManager();
  }catch(e){
    setStatus("entryStatus","حدث خطأ أثناء تسجيل دخول المدير: "+(e?.message||e),false);
  }
}
async function supervisorActor(){
  if(state.manager) return true;
  if(!state.member||!state.pin)return false;
  const {data}=await rpc("manager_or_supervisor_actor",{p_member_id:state.member.id,p_pin:state.pin});
  {const r=normalizeRpcData(data); return r.ok===true || r.success===true;}
}
async function createOccasion(){if(!state.manager&&!state.supervisor)return toast("لا تملك صلاحية إدارة المناسبات.",false);const type=$("occasionType").value,title=$("occasionTitle").value.trim(),message=$("occasionMessage").value.trim(),at=$("occasionAt").value?new Date($("occasionAt").value).toISOString():new Date().toISOString();if(!title||!message)return toast("أكمل بيانات المناسبة.",false);let data,error;if(state.manager){({data,error}=await rpc("manager_create_occasion_message",{p_manager_pin:state.pin,p_type:type,p_title:title,p_message:message,p_scheduled_at:at}));}else{({data,error}=await rpc("supervisor_create_occasion_message",{p_member_id:state.member.id,p_pin:state.pin,p_type:type,p_title:title,p_message:message,p_scheduled_at:at}));}const rr=rpcResult(data,error);if(!rr.ok)return toast(rr.message,false);$("occasionTitle").value="";$("occasionMessage").value="";toast("تم حفظ رسالة المناسبة.");await loadData();}
async function updateOccasion(){if(!state.manager&&!state.supervisor)return toast("لا تملك صلاحية إدارة المناسبات.",false);const id=Number($("occasionId").value);if(!id)return toast("اختر رسالة المناسبة.",false);const args={p_id:id,p_type:$("editOccasionType").value,p_title:$("editOccasionTitle").value.trim(),p_message:$("editOccasionMessage").value.trim(),p_scheduled_at:$("editOccasionAt").value?new Date($("editOccasionAt").value).toISOString():null};let data,error;if(state.manager){({data,error}=await rpc("manager_update_occasion_message",{p_manager_pin:state.pin,...args}));}else{({data,error}=await rpc("supervisor_update_occasion_message",{p_member_id:state.member.id,p_pin:state.pin,...args}));}const rr=rpcResult(data,error);if(!rr.ok)return toast(rr.message,false);toast("تم تعديل رسالة المناسبة.");await loadData();}
async function deleteOccasion(){if(!state.manager&&!state.supervisor)return toast("لا تملك صلاحية حذف المناسبات.",false);const id=Number($("occasionId").value);if(!id)return toast("اختر رسالة المناسبة.",false);if(!confirm("حذف رسالة المناسبة نهائيًا؟"))return;let data,error;if(state.manager){({data,error}=await rpc("manager_delete_occasion_message",{p_manager_pin:state.pin,p_id:id}));}else{({data,error}=await rpc("supervisor_delete_occasion_message",{p_member_id:state.member.id,p_pin:state.pin,p_id:id}));}const rr=rpcResult(data,error);if(!rr.ok)return toast(rr.message,false);toast("تم حذف رسالة المناسبة.");await loadData();}
async function createManagerMessage(){if(!state.manager)return toast("الرسائل الإدارية للمدير فقط.",false);const message=$("newManagerMessage").value.trim();if(!message)return toast("اكتب الرسالة.",false);const {data,error}=await rpc("manager_create_group_message",{p_manager_pin:state.pin,p_message:message});const rr=rpcResult(data,error);if(!rr.ok)return toast(rr.message,false);$("newManagerMessage").value="";toast("تم إرسال الرسالة.");await loadData();}
async function updateManagerMessage(){if(!state.manager)return toast("التعديل للمدير فقط.",false);const id=Number($("managerMessageId").value),message=$("editManagerMessage").value.trim();if(!id||!message)return toast("اختر الرسالة واكتب النص.",false);const {data,error}=await rpc("manager_update_group_message",{p_manager_pin:state.pin,p_id:id,p_message:message});const rr=rpcResult(data,error);if(!rr.ok)return toast(rr.message,false);toast("تم تعديل الرسالة.");await loadData();}
async function deleteManagerMessage(){if(!state.manager)return toast("الحذف للمدير فقط.",false);const id=Number($("managerMessageId").value);if(!id)return toast("اختر الرسالة.",false);if(!confirm("حذف الرسالة نهائيًا؟"))return;const {data,error}=await rpc("manager_delete_group_message",{p_manager_pin:state.pin,p_id:id});const rr=rpcResult(data,error);if(!rr.ok)return toast(rr.message,false);toast("تم حذف الرسالة.");await loadData();}
async function createCoffee(){if(!state.manager)return toast("إنشاء موعد القهوة للمدير فقط.",false);const member=Number($("newCoffeeMember").value),date=$("newCoffeeDate").value;if(!member||!date)return toast("اختر الجار والتاريخ.",false);const {data,error}=await rpc("manager_create_coffee",{p_manager_pin:state.pin,p_member_id:member,p_date:date,p_time:$("newCoffeeTime").value||null,p_hijri:$("newCoffeeHijri").value,p_notes:$("newCoffeeNotes").value});const rr=rpcResult(data,error);if(!rr.ok)return toast(rr.message,false);toast("تم إنشاء موعد القهوة.");["newCoffeeDate","newCoffeeTime","newCoffeeHijri","newCoffeeNotes"].forEach(id=>$(id).value="");await loadData();}
async function deleteCoffee(){if(!state.manager)return toast("الحذف للمدير فقط.",false);const id=Number($("mcId").value);if(!id)return toast("اختر موعد القهوة.",false);if(!confirm("حذف موعد القهوة نهائيًا؟"))return;const {data,error}=await rpc("manager_delete_coffee",{p_manager_pin:state.pin,p_id:id});const rr=rpcResult(data,error);if(!rr.ok)return toast(rr.message,false);toast("تم حذف موعد القهوة.");await loadData();}
async function createOuting(){if(!state.manager)return toast("إنشاء موعد الطلعة للمدير فقط.",false);const m1=Number($("newOutingMember1").value),m2=Number($("newOutingMember2").value),date=$("newOutingDate").value;if(!m1||!m2||!date)return toast("أكمل بيانات الطلعة.",false);const {data,error}=await rpc("manager_create_outing",{p_manager_pin:state.pin,p_member1_id:m1,p_member2_id:m2,p_date:date,p_time:$("newOutingTime").value||null,p_hijri:$("newOutingHijri").value,p_notes:$("newOutingNotes").value});const rr=rpcResult(data,error);if(!rr.ok)return toast(rr.message,false);toast("تم إنشاء موعد الطلعة.");["newOutingDate","newOutingTime","newOutingHijri","newOutingNotes"].forEach(id=>$(id).value="");await loadData();}
async function deleteOuting(){if(!state.manager)return toast("الحذف للمدير فقط.",false);const id=Number($("moId").value);if(!id)return toast("اختر موعد الطلعة.",false);if(!confirm("حذف موعد الطلعة نهائيًا؟"))return;const {data,error}=await rpc("manager_delete_outing",{p_manager_pin:state.pin,p_id:id});const rr=rpcResult(data,error);if(!rr.ok)return toast(rr.message,false);toast("تم حذف موعد الطلعة.");await loadData();}
async function saveCoffee(){
  if(!(await supervisorActor())) return toast("لا تملك صلاحية الإدارة.",false);
  const id=Number($("mcId").value), member=Number($("mcMember").value);
  const {data,error}=await rpc("manager_update_coffee_assignment",{p_manager_pin:state.pin,p_id:id,p_member_id:member,p_date:$("mcDate").value,p_time:$("mcTime").value||null,p_notes:$("mcNotes").value});
  if(error||!normalizeRpcData(data).ok && !normalizeRpcData(data).success){toast(data?.message||error?.message||"تعذر حفظ القهوة.",false);return;}
  toast("تم تعديل موعد القهوة."); await loadData();
}
async function swapCoffee(){
  if(!(await supervisorActor()))return toast("لا تملك الصلاحية.",false);
  const {data,error}=await rpc("manager_swap_coffee_dates",{p_manager_pin:state.pin,p_id1:Number($("coffeeSwapA").value),p_id2:Number($("coffeeSwapB").value)});
  if(error||!normalizeRpcData(data).ok && !normalizeRpcData(data).success){toast(data?.message||error?.message||"تعذر التبديل.",false);return;} toast("تم تبديل موعدي القهوة."); await loadData();
}
async function saveOuting(){
  if(!(await supervisorActor())) return toast("لا تملك صلاحية الإدارة.",false);
  const {data,error}=await rpc("manager_update_outing_assignment",{p_manager_pin:state.pin,p_id:Number($("moId").value),p_member1_id:Number($("moMember1").value),p_member2_id:Number($("moMember2").value),p_date:$("moDate").value,p_time:$("moTime").value||null,p_notes:$("moNotes").value});
  if(error||!normalizeRpcData(data).ok && !normalizeRpcData(data).success){toast(data?.message||error?.message||"تعذر حفظ الطلعة.",false);return;} toast("تم تعديل الطلعة."); await loadData();
}
async function swapOuting(){
  if(!(await supervisorActor()))return toast("لا تملك الصلاحية.",false);
  const {data,error}=await rpc("manager_swap_outing_dates",{p_manager_pin:state.pin,p_id1:Number($("outingSwapA").value),p_id2:Number($("outingSwapB").value)});
  if(error||!normalizeRpcData(data).ok && !normalizeRpcData(data).success){toast(data?.message||error?.message||"تعذر التبديل.",false);return;} toast("تم تقديم/تأخير الموعد."); await loadData();
}
async function randomOuting(){
  if(!state.manager)return toast("إنشاء الجدول العشوائي متاح للمدير.",false);
  const {data,error}=await rpc("manager_randomize_outings",{p_manager_pin:state.pin,p_start_date:currentDateISO()});
  if(error||!normalizeRpcData(data).ok && !normalizeRpcData(data).success){setStatus("randomResult",data?.message||error?.message||"تعذر إنشاء الجدول. تأكد أن عدد الجيران النشطين زوجي.",false);return;}
  setStatus("randomResult",data?.message||"تم إنشاء جدول جديد ونشره.",true); await loadData();
}
async function addMember(){
  if(!state.manager)return toast("هذه العملية للمدير.",false);
  const name=$("newMemberName").value.trim(); if(!name)return toast("اكتب اسم الجار.",false);
  const {data,error}=await rpc("manager_add_member",{p_manager_pin:state.pin,p_name:name,p_phone:$("newMemberPhone").value.trim(),p_notes:$("newMemberNotes").value.trim(),p_member_pin:$("newMemberPin").value.trim()||null});
  if(error||!normalizeRpcData(data).ok && !normalizeRpcData(data).success){toast(data?.message||error?.message||"تعذر إضافة الجار.",false);return;}
  toast("تمت إضافة الجار."); ["newMemberName","newMemberPhone","newMemberNotes","newMemberPin"].forEach(id=>$(id).value=""); await loadMembers(); await loadData();
}
async function deleteMember(id){
  if(!state.manager)return;
  if(!confirm("هل تريد حذف هذا الجار؟"))return;
  const {data,error}=await rpc("manager_delete_member",{p_manager_pin:state.pin,p_member_id:id});
  if(error||!normalizeRpcData(data).ok && !normalizeRpcData(data).success){toast(data?.message||error?.message||"تعذر حذف الجار.",false);return;}
  toast("تم حذف الجار."); await loadMembers(); await loadData();
}
async function renameMember(id,current){
  const name=prompt("الاسم الجديد:",current); if(!name||name===current)return;
  const {data,error}=await rpc("manager_update_member_name",{p_manager_pin:state.pin,p_member_id:id,p_name:name.trim()});
  if(error||!normalizeRpcData(data).ok && !normalizeRpcData(data).success){toast(data?.message||error?.message||"تعذر تعديل الاسم.",false);return;} toast("تم تعديل الاسم."); await loadMembers(); await loadData();
}
async function savePermissions(){
  if(!state.manager)return toast("إدارة المشرفين للمدير.",false);
  const member=Number($("permMember").value);
  const g=k=>document.querySelector(`[data-perm="${k}"]`).checked;
  const {data,error}=await rpc("manager_set_member_permissions",{p_manager_pin:state.pin,p_member_id:member,p_can_manage_coffee:g("coffee"),p_can_manage_outings:g("outings"),p_can_manage_dates:g("dates"),p_can_manage_members:g("members"),p_can_manage_rules:g("rules"),p_can_send_group_messages:g("messages"),p_can_manage_lottery:g("lottery"),p_can_manage_apologies:g("apologies")});
  if(error||!normalizeRpcData(data).ok && !normalizeRpcData(data).success){toast(data?.message||error?.message||"تعذر حفظ الصلاحيات.",false);return;} toast("تم حفظ الصلاحيات."); await loadData(); renderPermissions();
}
async function changeMemberPin(){
  if(!state.manager && !(await supervisorActor())) return toast("لا تملك صلاحية تغيير أرقام الأعضاء.",false);
  const member=Number($("changePinMember").value); if(!member)return toast("اختر العضو.",false);
  const newPin=prompt("أدخل الرقم السري الجديد (4 إلى 12 رقمًا):","");
  if(newPin===null)return; if(!/^\d{4,12}$/.test(newPin))return toast("الرقم السري يجب أن يكون من 4 إلى 12 رقمًا.",false);
  const {data,error}=await rpc("manager_set_member_pin",{p_manager_pin:state.pin,p_member_id:member,p_new_pin:newPin});
  const rr=rpcResult(data,error); if(!rr.ok)return toast(rr.message,false);
  toast("تم تغيير الرقم السري للعضو.");
}
async function changeMemberPinFor(id){
  if(!state.manager)return toast("هذه العملية للمدير.",false);
  const m=state.members.find(x=>Number(x.id)===Number(id)); if(!m)return;
  const newPin=prompt("الرقم السري الجديد لـ "+m.name+" (4 إلى 12 رقماً):","");
  if(newPin===null)return;
  if(!/^\d{4,12}$/.test(newPin))return toast("الرقم السري يجب أن يكون من 4 إلى 12 رقماً.",false);
  const {data,error}=await rpc("manager_set_member_pin",{p_manager_pin:state.pin,p_member_id:id,p_new_pin:newPin});
  const rr=rpcResult(data,error); if(!rr.ok)return toast(rr.message,false);
  toast("تم تغيير الرقم السري للعضو.");
}
async function changeOwnPin(){
  if(!(await requireMemberAuth())) return;
  if(!state.member)return;
  const current=prompt("الرقم السري الحالي:",""); if(current===null)return;
  const next=prompt("الرقم السري الجديد (4 إلى 12 رقمًا):",""); if(next===null)return;
  if(!/^\d{4,12}$/.test(next))return toast("الرقم الجديد يجب أن يكون من 4 إلى 12 رقمًا.",false);
  const {data,error}=await rpc("member_change_own_pin",{p_member_id:state.member.id,p_current_pin:current,p_new_pin:next});
  const rr=rpcResult(data,error); if(!rr.ok)return toast(rr.message,false);
  toast("تم تغيير رقمك السري. سجّل الدخول من جديد."); logout();
}
async function revokeSupervisor(id){
  if(!state.manager)return toast("هذه العملية للمدير.",false);
  const m=state.members.find(x=>Number(x.id)===Number(id)); if(!m)return;
  if(!confirm("إلغاء صلاحيات المشرف عن: "+m.name+" ؟"))return;
  const {data,error}=await rpc("manager_remove_supervisor",{p_manager_pin:state.pin,p_member_id:id});
  const rr=rpcResult(data,error); if(!rr.ok)return toast(rr.message,false);
  toast("تم إلغاء صلاحيات المشرف."); await loadData();
}
function renderSupervisorList(){
  const map=Object.fromEntries(state.permissions.map(x=>[x.member_id,x]));
  const el=$("permissionsList2"); if(!el)return;
  const rows=state.members.filter(m=>m.active && map[m.id]?.role==='supervisor');
  el.innerHTML=rows.length?rows.map(m=>`<div class="permission-row"><b>${esc(m.name)}</b><button class="small-btn ghost-mini" onclick="revokeSupervisor(${m.id})">إلغاء الإشراف</button></div>`).join(""):"<p class='muted'>لا يوجد مشرفون مفوضون.</p>";
}
function renderPermissions(){
  const map=Object.fromEntries(state.permissions.map(x=>[x.member_id,x]));
  $("permissionsList").innerHTML=state.members.filter(m=>m.active).map(m=>{
    const p=map[m.id]; const role=p?.role||"عضو";
    const flags=["can_manage_coffee","can_manage_outings","can_manage_dates","can_manage_members","can_manage_rules","can_send_group_messages","can_manage_lottery","can_manage_apologies"].filter(k=>p?.[k]).length;
    return `<div class="permission-row"><b>${esc(m.name)}</b><span>${esc(role)} — ${flags} صلاحيات</span></div>`;
  }).join("");
  renderSupervisorList();
}
function renderManager(){
  if(!state.manager&&!state.supervisor){$("managerDenied").classList.remove("hidden");$("managerPanel").classList.add("hidden");return;}
  $("managerDenied").classList.add("hidden");$("managerPanel").classList.remove("hidden");
  const mm=$("managerMemberStats"); if(mm) mm.textContent=`${activeMemberList().length} نشط`;
  const mc=$("managerCoffeeStats"); if(mc) mc.textContent=`${state.coffee.length} سجل`;
  const mo=$("managerOutingStats"); if(mo) mo.textContent=`${state.outings.length} سجل`;
  const ma=$("managerActivityStats"); if(ma) ma.textContent=`${state.messages.length} رسالة`;
  renderPermissions(); fillManagerSelects();
}
async function saveRules(){
  if(!state.manager)return toast("إدارة القواعد للمدير.",false);
  const {data,error}=await rpc("manager_set_schedule_rules",{p_manager_pin:state.pin,p_coffee_interval_days:Number($("coffeeInterval").value||14),p_coffee_order_mode:$("coffeeOrder").value,p_coffee_avoid_repeat:$("coffeeAvoid").checked,p_outing_frequency:$("outingFrequency").value,p_outing_day_rule:$("outingRule").value,p_outing_pair_mode:$("pairMode").value,p_avoid_coffee_conflicts:$("avoidConflict").checked});
  if(error||!normalizeRpcData(data).ok && !normalizeRpcData(data).success){toast(data?.message||error?.message||"تعذر حفظ القواعد.",false);return;} toast("تم حفظ القواعد."); await loadData();
}
async function changeManagerPin(){
  if(!state.manager)return;
  const old=$("oldManagerPin").value,newPin=$("newManagerPin").value;
  if(!old||!newPin)return toast("أدخل الرقمين.",false);
  const {data,error}=await rpc("manager_set_manager_pin",{p_current_pin:old,p_new_pin:newPin});
  if(error||!normalizeRpcData(data).ok && !normalizeRpcData(data).success){toast(data?.message||error?.message||"تعذر تغيير الرقم.",false);return;} toast("تم تغيير رقم المدير. سجّل الدخول مجددًا."); logout();
}
async function scheduleNotification(){
  if(!state.manager)return;
  const title=$("notifyTitle").value.trim(), message=$("notifyMessage").value.trim(), at=$("notifyAt").value;
  if(!title||!message||!at)return toast("أكمل بيانات الإعلان.",false);
  const {data,error}=await rpc("manager_schedule_notification",{p_manager_pin:state.pin,p_title:title,p_message:message,p_scheduled_at:new Date(at).toISOString()});
  if(error||!normalizeRpcData(data).ok && !normalizeRpcData(data).success){toast(data?.message||error?.message||"تعذر الجدولة.",false);return;} toast("تمت جدولة الإعلان."); await loadData();
}
async function sendMessage(){
  if(!(await requireMemberAuth())) return;
  if(!state.member||!state.pin)return;
  const message=$("messageText").value.trim(); if(!message)return;
  const {data,error}=await rpc("send_group_message",{p_member_id:state.member.id,p_pin:state.pin,p_message:message});
  if(error||!normalizeRpcData(data).ok && !normalizeRpcData(data).success){toast(data?.message||error?.message||"تعذر إرسال الرسالة.",false);return;}
  $("messageText").value=""; toast("تم إرسال الرسالة."); await loadData();
}
async function submitSuggestion(){
  if(!(await requireMemberAuth())) return;
  const message=$("suggestionText").value.trim(); if(!message)return;
  const {data,error}=await rpc("submit_suggestion",{p_member_id:state.member.id,p_pin:state.pin,p_category:$("suggestionCategory").value,p_message:message});
  if(error||!normalizeRpcData(data).ok && !normalizeRpcData(data).success){toast(data?.message||error?.message||"تعذر إرسال الاقتراح.",false);return;}
  $("suggestionText").value="";toast("تم إرسال الاقتراح.");
}
async function setAttendance(outingId,att){
  if(!(await requireMemberAuth())) return;
  if(!state.member)return;
  const {data,error}=await rpc("set_outing_attendance",{p_member_id:state.member.id,p_pin:state.pin,p_outing_id:outingId,p_attendance:att});
  if(error||!normalizeRpcData(data).ok && !normalizeRpcData(data).success){toast(data?.message||error?.message||"تعذر تسجيل الحضور.",false);return;} toast(att?"تم تسجيل الحضور":"تم تسجيل الاعتذار.");
}
async function setExpense(){
  if(!(await requireMemberAuth())) return;
  const id=Number($("expenseOutingId").value), amount=Number($("expenseAmount").value);
  if(!id||!amount)return toast("أدخل الطلعة والمبلغ.",false);
  const {data,error}=await rpc("set_outing_expense",{p_member_id:state.member.id,p_pin:state.pin,p_outing_id:id,p_total_amount:amount});
  if(error||!normalizeRpcData(data).ok && !normalizeRpcData(data).success){toast(data?.message||error?.message||"تعذر حفظ المصروف.",false);return;} toast("تم حفظ المصروف.");
}
async function apologizeCoffee(undo=false){
  if(!(await requireMemberAuth())) return;
  const id=Number($("coffeeApologyId").value);
  const fn=undo?"member_undo_apologize_coffee":"member_apologize_coffee";
  const {data,error}=await rpc(fn,{p_id:id,p_member_id:state.member.id,p_pin:state.pin});
  if(error||!normalizeRpcData(data).ok && !normalizeRpcData(data).success){toast(data?.message||error?.message||"تعذر تنفيذ العملية.",false);return;} toast(undo?"تم إلغاء الاعتذار":"تم تسجيل الاعتذار"); await loadData();
}
async function managerStats(){
  if(!state.manager)return toast("الإحصاءات للمدير.",false);
  const {data,error}=await rpc("manager_activity_stats",{p_manager_pin:state.pin,p_limit:500});
  const rr=rpcResult(data,error); if(!rr.ok && !rr.data?.totals)return toast(rr.message,false);
  const out=rr.data||{}; $("statsOutput").textContent=JSON.stringify(out,null,2); toast("تم تحديث الإحصاءات.");
}
async function makeBackup(){
  if(!state.manager)return toast("النسخ الاحتياطي للمدير.",false);
  const names=["members","member_permissions","coffee_schedule","outings_schedule","announcements","group_messages","group_rules","neighbor_help","neighbor_market","neighbor_profiles","outing_attendance","outing_expenses","schedule_settings","program_control","suggestions","program_acceptances","lottery_draws"];
  const tables={};
  for(const name of names){
    const {data,error}=await table(name); if(error) {toast("تعذر قراءة "+name+": "+error.message,false);return;}
    tables[name]=(data||[]).map(row=>{const x={...row}; if(name==='members') delete x.pin_hash; return x;});
  }
  const backup={app:"جيران حي الغدير",version:"1.0-final",created_at:new Date().toISOString(),tables};
  const blob=new Blob([JSON.stringify(backup,null,2)],{type:"application/json"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="ghadeer-neighbors-backup-"+new Date().toISOString().slice(0,10)+".json"; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); toast("تم تنزيل النسخة الاحتياطية.");
}
async function restoreBackupFile(file){
  if(!state.manager||!file)return;
  if(!confirm("استعادة النسخة قد تعدّل بيانات البرنامج. هل تريد المتابعة؟"))return;
  try{const data=JSON.parse(await file.text()); if(!data?.tables)throw Error("ملف النسخة غير صالح"); const {data:res,error}=await rpc("manager_restore_backup",{p_manager_pin:state.pin,p_data:data}); const rr=rpcResult(res,error); if(!rr.ok)return toast(rr.message,false); toast("تمت الاستعادة."); await loadMembers(); await loadData();}catch(e){toast("تعذر استعادة النسخة: "+e.message,false);}
}
function openPage(id){
  document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===id));
  document.querySelectorAll(".bottom-nav button").forEach(b=>b.classList.toggle("active",b.dataset.page===id));
  if(id==="manager")renderManager();
  window.scrollTo({top:0,behavior:"smooth"});
}
window.openPage=openPage;
function openManagerTab(name){
  document.querySelectorAll(".manager-tabs .tab").forEach(b=>b.classList.toggle("active",b.dataset.mtab===name));
  document.querySelectorAll(".mtab").forEach(p=>p.classList.toggle("active",p.id==="mtab-"+name));
}
window.openManagerTab=openManagerTab;window.toggleOccasionAutomation=toggleOccasionAutomation;
function logout(){
  state.member=null;state.pin=null;state.manager=false;state.supervisor=false;
  $('acceptModal').classList.add('hidden');
  $('whoami').textContent=''; $('managerNav').classList.add('hidden');
  $('entryScreen').classList.add('hidden'); $('memberAuthModal').classList.add('hidden');
  openPage('home'); toast('تم تسجيل الخروج.');
}
function fillManagerFormFromSelected(){
  const c=state.coffee.find(x=>Number(x.id)===Number($("mcId").value));
  if(c){$("mcMember").value=c.member_id;$("mcDate").value=c.coffee_date;$("mcTime").value=fmtTime(c.coffee_time);$("mcNotes").value=c.notes||"";}
  const o=state.outings.find(x=>Number(x.id)===Number($("moId").value));
  if(o){$("moMember1").value=o.member1_id;$("moMember2").value=o.member2_id;$("moDate").value=o.outing_date;$("moTime").value=fmtTime(o.outing_time);$("moNotes").value=o.notes||"";}
}
document.addEventListener("DOMContentLoaded",async()=>{
  document.querySelectorAll(".bottom-nav button").forEach(b=>b.addEventListener("click",()=>openPage(b.dataset.page)));
  if($('memberLoginBtn'))$('memberLoginBtn').onclick=memberLogin;
  if($('managerLoginBtn'))$('managerLoginBtn').onclick=managerLogin;
  if($('showManagerBtn'))$('showManagerBtn').onclick=showManagerLogin;
  if($('backToMemberBtn'))$('backToMemberBtn').onclick=()=>{$('entryScreen').classList.add('hidden');};
  if($('authLoginBtn'))$('authLoginBtn').onclick=authenticateMemberFromModal;
  if($('authCancelBtn'))$('authCancelBtn').onclick=closeMemberAuth;
  if($('memberAccessBtn'))$('memberAccessBtn').onclick=showMemberAuth;
  if($('topMemberAccessBtn'))$('topMemberAccessBtn').onclick=showMemberAuth;
  if($('showManagerFromHomeBtn'))$('showManagerFromHomeBtn').onclick=showManagerLogin;
  if($('developerAccessBtn'))$('developerAccessBtn').onclick=showManagerLogin;
  $("acceptTermsBtn").onclick=acceptTerms;$("rejectTermsBtn").onclick=()=>logout();
  $("refreshBtn").onclick=async()=>{await loadMembers();await loadData();toast("تم تحديث البيانات.");};
  $("logoutBtn").onclick=logout;
  if(!$('ownPinBtn')){ const ownPinBtn=document.createElement("button"); ownPinBtn.id="ownPinBtn"; ownPinBtn.className="btn secondary"; ownPinBtn.textContent="🔑 تغيير رقمي السري"; ownPinBtn.onclick=changeOwnPin; $("logoutBtn").parentElement.appendChild(ownPinBtn); }$("memberSearch").oninput=renderMembers;
  $("apologizeCoffeeBtn").onclick=()=>apologizeCoffee(false);$("undoApologyBtn").onclick=()=>apologizeCoffee(true);
  $("expenseBtn").onclick=setExpense;$("sendMessageBtn").onclick=sendMessage;$("suggestionBtn").onclick=submitSuggestion;
  $("createOccasionBtn").onclick=createOccasion;$("updateOccasionBtn").onclick=updateOccasion;$("deleteOccasionBtn").onclick=deleteOccasion;$("occasionId").onchange=fillOccasionSelect;$("createManagerMessageBtn").onclick=createManagerMessage;$("updateManagerMessageBtn").onclick=updateManagerMessage;$("deleteManagerMessageBtn").onclick=deleteManagerMessage;$("managerMessageId").onchange=fillManagerMessageSelect;$("saveCoffeeBtn").onclick=saveCoffee;$("createCoffeeBtn").onclick=createCoffee;$("deleteCoffeeBtn").onclick=deleteCoffee;$("swapCoffeeBtn").onclick=swapCoffee;$("saveOutingBtn").onclick=saveOuting;$("createOutingBtn").onclick=createOuting;$("deleteOutingBtn").onclick=deleteOuting;$("swapOutingBtn").onclick=swapOuting;$("randomOutingBtn").onclick=randomOuting;
  $("addMemberBtn").onclick=addMember;$("changeMemberPinBtn").onclick=changeMemberPin; if($("changeMemberPinBtn")) $("changeMemberPinBtn").onclick=changeMemberPin;$("savePermBtn").onclick=savePermissions;$("saveRulesBtn").onclick=saveRules;$("changeManagerPinBtn").onclick=changeManagerPin;$("scheduleNotifyBtn").onclick=scheduleNotification;
  $("statsBtn").onclick=managerStats;$("backupBtn").onclick=makeBackup;$("restoreFile").onchange=e=>restoreBackupFile(e.target.files[0]);
  $("mcId").onchange=fillManagerFormFromSelected;$("moId").onchange=fillManagerFormFromSelected;
  document.querySelectorAll(".manager-tabs .tab").forEach(b=>b.onclick=()=>openManagerTab(b.dataset.mtab));
  const prayerUrl="https://www.islamicfinder.org/world/saudi-arabia/abha/";
  const weatherUrl="https://www.google.com/search?q=الطقس+أبها";
  ["prayerBtn","homePrayerBtn"].forEach(id=>{const el=$(id);if(el)el.onclick=()=>window.open(prayerUrl,"_blank","noopener");});
  ["weatherBtn","homeWeatherBtn"].forEach(id=>{const el=$(id);if(el)el.onclick=()=>window.open(weatherUrl,"_blank","noopener");});
  $('entryScreen').classList.add('hidden'); $('app').classList.remove('hidden'); $('whoami').textContent=''; $('managerNav').classList.add('hidden');
  await loadMembers(); await loadData();
});
