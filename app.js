/* جيران حي الغدير بالمحالة — تطبيق ويب ثابت متوافق مع GitHub/Vercel */
const SUPABASE_URL = "https://xewjakfmdfkbhcnxglct.supabase.co";
const SUPABASE_KEY = "sb_publishable__i-E8Gi5hcdfNd7gZXa12Q_-ZPSXPUr";
const supabaseLib = window.supabase;
const createClient = supabaseLib?.createClient;
const db = createClient ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;
if(!db) console.error("Supabase client could not be initialized.");

const state = {
  member: null, pin: null, manager: false, supervisor: false,
  members: [], coffee: [], outings: [], outingPlans: [], memberProfiles: [], announcements: [], messages: [], neighborChecks: [],
  settings: {}, permissions: null, managerNeighborChecks: []
};

const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
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
  // Public directory is intentionally read from the safe view; the base members table is protected.
  const {data,error}=await table("public_members",{select:"id,name,active",order:"id"});
  if(error){toast("تعذر تحميل الجيران: "+error.message,false); return;}
  state.members=data||[];
  fillMemberSelects();
  renderMembers();
}
async function loadData(){
  if(!db){return;}
  const [c,o,plans,profiles,a,m,p,s,n] = await Promise.all([
    table("coffee_schedule",{order:"coffee_date"}),
    table("outings_schedule",{order:"outing_date"}),
    rpc("get_outing_plans"),
    rpc("get_member_profiles"),
    table("announcements",{order:"created_at",ascending:false,limit:20}),
    table("group_messages",{order:"created_at",ascending:true,limit:100}),
    table("member_permissions",{order:"member_id"}),
    rpc("get_schedule_settings"),
    state.member&&state.pin ? rpc("get_neighbor_checks",{p_member_id:state.member.id,p_pin:state.pin}) : Promise.resolve({data:[]})
  ]);
  if(c.error) toast("تعذر تحميل جدول القهوة: "+c.error.message,false);
  else state.coffee=c.data||[];
  if(o.error) toast("تعذر تحميل جدول الطلعات: "+o.error.message,false);
  else state.outings=o.data||[];
  try { state.outingPlans=plans.error?[]:(Array.isArray(plans.data)?plans.data:(typeof plans.data==="string"?JSON.parse(plans.data||"[]"):(plans.data||[]))); } catch(e) { state.outingPlans=[]; }
  try { state.memberProfiles=profiles.error?[]:(Array.isArray(profiles.data)?profiles.data:(typeof profiles.data==="string"?JSON.parse(profiles.data||"[]"):(profiles.data||[]))); } catch(e) { state.memberProfiles=[]; }
  if(a.error) state.announcements=[]; else state.announcements=a.data||[];
  if(m.error) state.messages=[]; else state.messages=m.data||[];
  state.permissions = p.error ? [] : (p.data||[]);
  state.settings = s.error ? {} : (s.data||{});
  state.neighborChecks = n.error ? [] : (n.data||[]);
  renderAll();
  fillManagerMessageSelect();
  fillOccasionSelect();
  if(state.manager) renderManager();
}
function renderNeighborCheckMembers(){
  const el=$("checkTargetMember"); if(!el)return;
  const cur=el.value;
  el.innerHTML='<option value="">اختر الجار (اختياري)</option>'+activeMemberList().map(m=>'<option value="'+m.id+'">'+esc(m.name)+'</option>').join("");
  if(cur)el.value=cur;
}
function neighborCheckLabel(x){return x.category+(x.target_member_id?' — '+memberName(x.target_member_id):"");}
function renderNeighborChecks(){
  const el=$("neighborChecksList"); if(!el)return;
  const rows=state.neighborChecks||[];
  el.innerHTML=rows.length?rows.map(x=>`<div class="card" style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;gap:8px"><b>❤️ ${esc(neighborCheckLabel(x))}</b><span class="pill">${esc(x.status)}</span></div><p>${esc(x.details||"بدون تفاصيل إضافية")}</p><small class="muted">${new Date(x.created_at).toLocaleString("ar-SA")}</small><div class="top-actions"><button class="small-btn" onclick="updateNeighborCheckStatus(${x.id},'تم التواصل')">تم التواصل</button><button class="small-btn" onclick="updateNeighborCheckStatus(${x.id},'تمت المساعدة')">تمت المساعدة</button><button class="small-btn" onclick="updateNeighborCheckStatus(${x.id},'مغلقة')">إغلاق</button></div></div>`).join(""):'<p class="muted">لا توجد حالات مشاركة حاليًا.</p>';
}
