/* جيران حي الغدير — صفحات الخدمات المستقلة */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cfg=window.GHADEER_SUPABASE_CONFIG;
const client=(window.supabase&&cfg)?window.supabase.createClient(cfg.url,cfg.key):null;
const defs={
 market:{title:'🛍️ سوق الحي',table:'neighbor_market',empty:'لا توجد عروض أو طلبات في السوق حاليًا.'},
 housing:{title:'🏠 سكن الحي',table:'neighborhood_rental_listings',empty:'لا توجد عروض أو طلبات سكن حاليًا.'},
 occasions:{title:'🎉 مناسبات الحي',table:'neighborhood_events',empty:'لا توجد مناسبات مسجلة حاليًا.'},
 announcements:{title:'📣 إعلانات الحي',table:'announcements',empty:'لا توجد إعلانات حاليًا.'},
 news:{title:'📰 أخبار الحي',table:'announcements',empty:'لا توجد أخبار منشورة حاليًا.'},
 lost:{title:'🔎 المفقودات',table:null,empty:'لا يوجد جدول مستقل للمفقودات في قاعدة البيانات الحالية.'},
 jobs:{title:'💼 الوظائف',table:null,empty:'لا يوجد جدول مستقل للوظائف في قاعدة البيانات الحالية.'},
 'neighbor-check':{title:'❤️ تفقد جار',table:'neighbor_check_ins',empty:'لا توجد حالات تفقد حاليًا.'},
 messages:{title:'💬 تواصل الجيران',table:'neighbor_messages',empty:'لا توجد رسائل خاصة حاليًا.'},
 neighbors:{title:'👥 الجيران',table:'members',empty:'لا يوجد أعضاء لعرضهم.'}
};
function page(id){let el=$(id);if(el)return el;el=document.createElement('section');el.id=id;el.className='page';document.querySelector('main.wrap')?.appendChild(el);return el;}
function frame(d,id){const el=page(id);el.innerHTML='<div class="hero"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><div><h2>'+d.title+'</h2><p class="muted">مسار مستقل للخدمة وبياناتها.</p></div><button class="btn secondary" type="button" data-back>↩️ رجوع</button></div></div><div class="card"><div id="svcStatus-'+id+'" class="status">جارٍ تحميل البيانات…</div><div id="svcList-'+id+'"></div></div>';el.querySelector('[data-back]').onclick=()=>window.openPage?.('home');return el;}
function cell(v){return esc(v===null||v===undefined?'—':v);}
function renderRows(id,rows){const box=$('svcList-'+id),st=$('svcStatus-'+id);if(!box||!st)return;if(!rows.length){box.innerHTML='<p class="muted">'+defs[id].empty+'</p>';st.textContent='لا توجد بيانات';st.className='status';return;}box.innerHTML=rows.map(r=>'<article class="card" style="margin:0 0 8px"><b>'+cell(r.title||r.name||r.member_name||r.kind||r.event_type||'سجل')+'</b><div class="muted">'+Object.entries(r).filter(([k])=>!['id','pin_hash'].includes(k)).slice(0,8).map(([k,v])=>'<span style="display:inline-block;margin:3px 8px 3px 0"><b>'+cell(k)+':</b> '+cell(typeof v==='object'?JSON.stringify(v):v)+'</span>').join('')+'</div></article>').join('');st.textContent='تم تحميل '+rows.length+' سجل';st.className='status ok';}
async function load(id){const d=defs[id];frame(d,id);const box=$('svcList-'+id),st=$('svcStatus-'+id);if(!d.table||!client){renderRows(id,[]);return;}try{let q=client.from(d.table).select('*');if(d.table==='announcements')q=q.order('created_at',{ascending:false}).limit(100);else if(d.table==='members')q=q.order('id');else q=q.order('created_at',{ascending:false}).limit(100);const {data,error}=await q;if(error)throw error;let rows=data||[];if(id==='news')rows=rows.filter(r=>r.is_news===true||String(r.title||'').includes('خبر')||String(r.message||'').includes('خبر'));renderRows(id,rows);}catch(e){box.innerHTML='<p class="muted">تعذر تحميل بيانات الخدمة: '+cell(e.message)+'</p>';st.textContent='خطأ في تحميل الخدمة';st.className='status bad';}}
window.GHADEER_INDEPENDENT_SERVICE_LOADERS={};
function boot(){Object.keys(defs).forEach(id=>{if(!$(id))page(id);});Object.keys(defs).forEach(id=>{window.GHADEER_INDEPENDENT_SERVICE_LOADERS[id]=()=>load(id);});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
