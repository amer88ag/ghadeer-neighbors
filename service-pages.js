/* جيران حي الغدير — صفحات الخدمات المستقلة */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cfg=window.GHADEER_SUPABASE_CONFIG;
const client=(window.supabase&&cfg)?window.supabase.createClient(cfg.url,cfg.key):null;
const defs={
 market:{title:'🛍️ سوق الحي',table:'neighbor_market',columns:'id,member_name,kind,title,description,status,created_at',filter:r=>r.status==='open'},
 housing:{title:'🏠 سكن الحي',table:'neighbor_market',columns:'id,member_name,kind,title,description,status,created_at',filter:r=>r.status==='open'&&['housing','rental','rent','سكن','إيجار'].includes(String(r.kind||'').toLowerCase())},
 occasions:{title:'🎉 مناسبات الحي',rpc:'get_neighborhood_events',rpcShape:'events',empty:'لا توجد مناسبات عامة حاليًا.'},
 announcements:{title:'📣 إعلانات الحي',table:'announcements',columns:'id,title,message,sender_name,created_at,occasion_type,is_occasion,scheduled_at',filter:r=>r.is_occasion!==true},
 news:{title:'📰 أخبار الحي',table:null,empty:'خدمة الأخبار موجودة في واجهة جيران، لكن مصدر بيانات الأخبار الأصلي يحتاج تحديده قبل تفعيل العرض.'},
 lost:{title:'🔎 المفقودات',table:null,empty:'خدمة المفقودات موجودة في واجهة جيران، لكن مصدر بياناتها يحتاج ربطًا بجدول جيران الصحيح قبل تفعيل العرض.'},
 jobs:{title:'💼 الوظائف',table:null,empty:'خدمة الوظائف موجودة في واجهة جيران، لكن مصدر بياناتها يحتاج ربطًا بمصدر جيران الصحيح قبل تفعيل العرض.'},
 'neighbor-check':{title:'❤️ تفقد جار',table:'neighbor_check_ins',columns:'id,created_at,status,notes',empty:'لا توجد سجلات تفقد عامة متاحة.'},
 messages:{title:'💬 تواصل الجيران',table:'neighbor_messages',columns:'id,body,created_at,sender_id,recipient_id',empty:'الرسائل خاصة وتتطلب تسجيل الدخول.'},
 neighbors:{title:'👥 الجيران',rpc:'get_public_members',rpcShape:'members',filter:r=>r.active!==false,empty:'لا يوجد أعضاء متاحون للعرض.'}
};
function page(id){let el=$(id);if(el)return el;el=document.createElement('section');el.id=id;el.className='page';document.querySelector('main.wrap')?.appendChild(el);return el;}
function frame(d,id){const el=page(id);el.innerHTML='<div class="hero"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><div><h2>'+d.title+'</h2><p class="muted">مسار مستقل للخدمة وبياناتها.</p></div><button class="btn secondary" type="button" data-back>↩️ رجوع</button></div></div><div class="card"><div id="svcStatus-'+id+'" class="status">جارٍ تحميل البيانات…</div><div id="svcList-'+id+'"></div></div>';el.querySelector('[data-back]').onclick=()=>window.openPage?.('home');return el;}
function cell(v){return esc(v===null||v===undefined?'—':v);}
function titleOf(r){return r.title||r.name||r.event_type||r.kind||r.body||'سجل';}
function renderRows(id,rows){const box=$('svcList-'+id),st=$('svcStatus-'+id);if(!box||!st)return;if(!rows.length){box.innerHTML='<p class="muted">'+(defs[id].empty||'لا توجد بيانات حاليًا.')+'</p>';st.textContent='لا توجد بيانات';st.className='status';return;}box.innerHTML=rows.map(r=>'<article class="card" style="margin:0 0 8px"><b>'+cell(titleOf(r))+'</b><div class="muted">'+Object.entries(r).filter(([k])=>!['id','community_id','user_id','sender_id','recipient_id'].includes(k)).map(([k,v])=>'<span style="display:inline-block;margin:3px 8px 3px 0"><b>'+cell(k)+':</b> '+cell(typeof v==='object'?JSON.stringify(v):v)+'</span>').join('')+'</div></article>').join('');st.textContent='تم تحميل '+rows.length+' سجل';st.className='status ok';}
function normalizeRpcPayload(payload,shape){if(Array.isArray(payload))return payload; if(payload&&Array.isArray(payload[shape]))return payload[shape]; return [];}
async function load(id){const d=defs[id];frame(d,id);const box=$('svcList-'+id),st=$('svcStatus-'+id);if(!d.table&&!d.rpc){renderRows(id,[]);st.textContent='مصدر البيانات غير مربوط بعد';st.className='status';return;}if(!client){renderRows(id,[]);st.textContent='قاعدة البيانات غير متاحة';return;}try{let rows=[];if(d.rpc){const {data,error}=await client.rpc(d.rpc);if(error)throw error;rows=normalizeRpcPayload(data,d.rpcShape);if(typeof d.filter==='function')rows=rows.filter(d.filter);}else{let q=client.from(d.table).select(d.columns);if(d.table==='neighbor_messages'||d.table==='neighbor_check_ins'){const {data,error}=await q.limit(100);if(error)throw error;rows=data||[];}else{q=q.order('created_at',{ascending:false}).limit(100);const {data,error}=await q;if(error)throw error;rows=data||[];if(typeof d.filter==='function')rows=rows.filter(d.filter);}}renderRows(id,rows);}catch(e){box.innerHTML='<p class="muted">تعذر تحميل بيانات الخدمة.</p>';st.textContent='تعذر تحميل الخدمة';st.className='status bad';console.error('[service:'+id+']',e);}}
window.GHADEER_INDEPENDENT_SERVICE_LOADERS={};
function boot(){Object.keys(defs).forEach(id=>{if(!$(id))page(id);});Object.keys(defs).forEach(id=>{window.GHADEER_INDEPENDENT_SERVICE_LOADERS[id]=()=>load(id);});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();