/* Ghadeer services v3 — compact publish dialogs for neighborhood services/market. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const cfg=()=>window.GHADEER_SUPABASE_CONFIG||{};
 const db=()=>window.supabase?.createClient?.(cfg().url,cfg().key);
 const appState=()=>{try{return state}catch(_){return window.state||null}};
 const auth=()=>{const s=appState()||{};return {id:Number(s.member?.id)||0,pin:s.pin||''}};
 const toast=(m,ok=true)=>window.toast?window.toast(m,ok):alert(m);
 let modal=null;
 function close(){modal?.remove();modal=null}
 function open(kind){
  close();
  const title=kind==='market'?'🛍️ نشر في سوق الحي':'🤝 نشر خدمة للحي';
  const body=kind==='market'?`<label>نوع المشاركة<select id="svcKind"><option value="عرض">🛍️ أعرض منتجًا/غرضًا</option><option value="طلب">🔎 أطلب منتجًا/غرضًا</option></select></label><label>العنوان<input id="svcTitle" placeholder="مثال: طاولة أطفال للبيع"></label><label>التفاصيل<textarea id="svcDesc" rows="4" placeholder="السعر/المكان/الوقت/التفاصيل..."></textarea></label>`:`<label>نوع المشاركة<select id="svcKind"><option value="طلب">🔎 أطلب خدمة</option><option value="عرض">🤝 أعرض خدمة</option></select></label><label>العنوان<input id="svcTitle" placeholder="مثال: توصيل دواء لكبير سن"></label><label>التفاصيل<textarea id="svcDesc" rows="4" placeholder="المكان والوقت والتفاصيل..."></textarea></label>`;
  modal=document.createElement('div');modal.style.cssText='position:fixed;inset:0;background:#0007;z-index:95;display:grid;place-items:center;padding:14px';modal.innerHTML=`<div style="width:min(560px,100%);max-height:88vh;overflow:auto;background:#fff;border-radius:20px;padding:16px;border:1px solid var(--line)"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><h2 style="margin:0">${title}</h2><button id="svcClose" class="btn secondary">×</button></div><p class="muted">النشر يتطلب دخول عضو الحي.</p>${body}<button id="svcSave" class="btn primary">نشر الآن</button><div id="svcStatus" class="status"></div></div>`;
  document.body.appendChild(modal);$('svcClose').onclick=close;modal.addEventListener('click',e=>{if(e.target===modal)close()});$('svcSave').onclick=async()=>{
   const a=auth();if(!a.id||!a.pin){window.showMemberAuth?.();toast('سجّل الدخول أولًا',false);return}
   const c=db();if(!c){toast('قاعدة البيانات غير متاحة',false);return}
   const kindValue=$('svcKind').value,titleValue=$('svcTitle').value.trim(),desc=$('svcDesc').value.trim();if(!titleValue){toast('اكتب العنوان',false);return}
   $('svcSave').disabled=true;
   const rpcName=kind==='market'?'create_neighbor_market':'create_neighbor_help';
   const args=kind==='market'?{p_member_id:a.id,p_pin:a.pin,p_kind:kindValue,p_title:titleValue,p_description:desc}:{p_member_id:a.id,p_pin:a.pin,p_title:titleValue,p_description:desc,p_status:kindValue};
   const r=await c.rpc(rpcName,args);if(r.error||r.data?.success===false){toast(r.error?.message||r.data?.message||'تعذر النشر',false);$('svcSave').disabled=false;return}
   close();toast(kind==='market'?'تم نشر المشاركة في سوق الحي':'تم نشر الخدمة للحي');window.loadData?.();
  };
 }
 function bind(){
  document.querySelectorAll('.gh-v3-tile[data-v3-action="services:help"]').forEach(b=>{if(b.dataset.svcBound)return;b.dataset.svcBound='1';b.onclick=e=>{e.preventDefault();open('help')}});
  document.querySelectorAll('.gh-v3-tile[data-v3-action="services:market"],.gh-v3-tile[data-v3-action="ghServicesHub:market"]').forEach(b=>{if(b.dataset.svcBound)return;b.dataset.svcBound='1';b.onclick=e=>{e.preventDefault();open('market')}});
 }
 function boot(){bind();[500,1500,3000,6000].forEach(ms=>setTimeout(bind,ms))}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
