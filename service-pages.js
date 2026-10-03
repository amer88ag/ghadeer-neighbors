/* جيران حي الغدير — صفحات الخدمات المستقلة */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cfg=window.GHADEER_SUPABASE_CONFIG;
const client=(window.supabase&&cfg)?window.supabase.createClient(cfg.url,cfg.key):null;
const defs={
 market:{title:'🛍️ سوق الحي',table:'community_listings',columns:'id,title,description,price,status,created_at,community_id,category,listing_type',filter:r=>r.status==='active'||r.status==='published'},
 housing:{title:'🏠 سكن الحي',table:'community_listings',columns:'id,title,description,price,status,created_at,community_id,category,listing_type,kind',filter:r=>['housing','rental','rent','سكن','إيجار'].includes(String(r.kind||'').toLowerCase())||['housing','rental','rent','سكن','إيجار'].includes(String(r.listing_type||'').toLowerCase())},
 occasions:{title:'🎉 مناسبات الحي',table:'community_events',columns:'id,title,description,event_type,status,created_at,starts_at,ends_at,community_id,location',filter:r=>r.status!=='cancelled'},
 announcements:{title:'📣 إعلانات الحي',table:'community_requests',columns:'id,title,description,body,category,status,created_at,community_id',filter:r=>['announcement','announcements','إعلان','اعلان'].includes(String(r.category||'').toLowerCase())},
 news:{title:'📰 أخبار الحي',table:'community_requests',columns:'id,title,description,body,category,status,created_at,community_id',filter:r=>['news','خبر','أخبار','اخبار'].includes(String(r.category||'').toLowerCase())},
 lost:{title:'🔎 المفقودات',table:'community_lost_items',columns:'id,title,description,status,created_at,community_id,category,location',filter:r=>r.status!=='closed'},
 jobs:{title:'💼 الوظائف',table:'community_opportunities',columns:'id,title,description,status,created_at,community_id,opportunity_type,location',filter:r=>['job','jobs','وظيفة','وظائف','employment'].includes(String(r.opportunity_type||'').toLowerCase())&&r.status!=='closed'},
 'neighbor-check':{title:'❤️ تفقد جار',table:'community_requests',columns:'id,title,description,category,status,created_at,community_id',filter:r=>['neighbor_check','neighbor-check','تفقد جار','تفقد'].includes(String(r.category||'').toLowerCase())},
 messages:{title:'💬 تواصل الجيران',table:'community_messages',columns:'id,body,created_at,community_id,sender_id,recipient_id',empty:'لا توجد رسائل خاصة متاحة.'},
 neighbors:{title:'👥 الجيران',table:'public_members',columns:'id,name,active',filter:r=>r.active!==false,empty:'لا يوجد أعضاء متاحون للعرض.'}
};
function page(id){let el=$(id);if(el)return el;el=document.createElement('section');el.id=id;el.className='page';document.querySelector('main.wrap')?.appendChild(el);return el;}
function frame(d,id){const el=page(id);el.innerHTML='<div class="hero"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><div><h2>'+d.title+'</h2><p class="muted">مسار مستقل للخدمة وبياناتها.</p></div><button class="btn secondary" type="button" data-back>↩️ رجوع</button></div></div><div class="card"><div id="svcStatus-'+id+'" class="status">جارٍ تحميل البيانات…</div><div id="svcList-'+id+'"></div></div>';el.querySelector('[data-back]').onclick=()=>window.openPage?.('home');return el;}
function cell(v){return esc(v===null||v===undefined?'—':v);}
function titleOf(r){return r.title||r.name||r.event_type||r.kind||r.body||'سجل';}
function renderRows(id,rows){const box=$('svcList-'+id),st=$('svcStatus-'+id);if(!box||!st)return;if(!rows.length){box.innerHTML='<p class="muted">'+(defs[id].empty||'لا توجد بيانات حاليًا.')+'</p>';st.textContent='لا توجد بيانات';st.className='status';return;}box.innerHTML=rows.map(r=>'<article class="card" style="margin:0 0 8px"><b>'+cell(titleOf(r))+'</b><div class="muted">'+Object.entries(r).filter(([k])=>!['id','community_id','user_id','sender_id','recipient_id'].includes(k)).map(([k,v])=>'<span style="display:inline-block;margin:3px 8px 3px 0"><b>'+cell(k)+':</b> '+cell(typeof v==='object'?JSON.stringify(v):v)+'</span>').join('')+'</div></article>').join('');st.textContent='تم تحميل '+rows.length+' سجل';st.className='status ok';}
async function load(id){const d=defs[id];frame(d,id);const box=$('svcList-'+id),st=$('svcStatus-'+id);if(!client){renderRows(id,[]);st.textContent='قاعدة البيانات غير متاحة';return;}try{let q=client.from(d.table).select(d.columns);if(d.table!=='public_members')q=q.order('created_at',{ascending:false});q=q.limit(100);const {data,error}=await q;if(error)throw error;let rows=data||[];if(typeof d.filter==='function')rows=rows.filter(d.filter);renderRows(id,rows);}catch(e){box.innerHTML='<p class="muted">تعذر تحميل بيانات الخدمة.</p>';st.textContent='تعذر تحميل الخدمة';st.className='status bad';console.error('[service:'+id+']',e);}}
window.GHADEER_INDEPENDENT_SERVICE_LOADERS={};
function boot(){Object.keys(defs).forEach(id=>{if(!$(id))page(id);});Object.keys(defs).forEach(id=>{window.GHADEER_INDEPENDENT_SERVICE_LOADERS[id]=()=>load(id);});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();