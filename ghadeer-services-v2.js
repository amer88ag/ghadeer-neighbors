/* Ghadeer Services v2 — expanded neighborhood service catalog. */
(()=>{
'use strict';
const C=[
 ['🔧','سباكة','تمديدات، تسريب، مضخات، سخانات'],
 ['⚡','كهرباء','أعطال، أفياش، إنارة، لوحات'],
 ['🚰','مياه','توصيل مياه، خزانات، فلاتر، صيانة'],
 ['🔥','غاز','توصيل واستبدال وفحص وتمديدات آمنة'],
 ['❄️','تكييف وتبريد','تنظيف، صيانة، تركيب ونقل مكيفات'],
 ['🧱','صيانة منزلية','دهان، جبس، بلاط، أبواب وأعمال عامة'],
 ['🧹','نظافة','منازل، مجالس، خزانات، واجهات'],
 ['🌳','حدائق ومزارع','تنسيق حدائق، تقليم وري وصيانة'],
 ['🚚','نقل وتحميل','نقل أثاث، تحميل وتنزيل، نقل داخل الحي'],
 ['🚗','سيارات','غسيل، بطاريات، إطارات، خدمة متنقلة'],
 ['🛒','توصيل ومشاوير','مشتريات وأغراض ومشاوير داخل الحي'],
 ['🎓','دروس خصوصية','مساعدة دراسية ودروس للطلاب'],
 ['🚌','نقل مدرسي','نقل الطلاب داخل الحي والمدارس القريبة'],
 ['🧑‍🍳','طبخ وضيافة','طبخ منزلي وضيافة للمناسبات'],
 ['🪑','أثاث ونجارة','تفصيل، إصلاح وتركيب الأثاث'],
 ['🔑','أقفال ومفاتيح','أقفال ومفاتيح وخدمات أبواب'],
 ['📱','جوال وحاسب','إعداد، صيانة وبرامج وأجهزة'],
 ['📦','شحن واستلام','استلام وتسليم طرود ومستلزمات'],
 ['📸','تصوير ومناسبات','تصوير مناسبات ومنتجات'],
 ['🧵','خياطة وتفصيل','تفصيل وإصلاح وملابس'],
 ['🩺','خدمات صحية منزلية','خدمات منزلية مرخصة عند توفرها'],
 ['🐾','حيوانات أليفة','رعاية وتنظيف ونقل الحيوانات'],
 ['🛠️','خدمات أخرى','إضافة خدمة يحتاجها سكان الحي']
];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function style(){if(document.getElementById('ghSvc2Style'))return;const s=document.createElement('style');s.id='ghSvc2Style';s.textContent=`.ghsvc2{margin-top:12px}.ghsvc2-note{font-size:11px;color:var(--muted);margin:-4px 0 10px}.ghsvc2-card{position:relative;min-height:118px!important}.ghsvc2-card em{position:absolute;top:7px;left:8px;font-size:10px;font-style:normal;color:var(--g);background:#eef8f1;border-radius:9px;padding:2px 5px}.ghsvc2-card:active{transform:scale(.98)}.ghsvc2-request{margin-top:3px;border:1px solid var(--line);background:#f7faf8;color:var(--g);border-radius:9px;padding:5px 8px;font-size:10px;cursor:pointer}.ghsvc2-modal{position:fixed;inset:0;background:#0007;z-index:999;display:flex;align-items:flex-end;justify-content:center;padding:12px}.ghsvc2-panel{width:min(620px,100%);background:#fff;border-radius:22px;padding:16px;box-shadow:0 20px 60px #0004}.ghsvc2-panel h3{margin:0 0 5px;color:var(--g)}.ghsvc2-panel p{font-size:12px;color:var(--muted);margin:0 0 12px}.ghsvc2-panel input,.ghsvc2-panel textarea{width:100%;box-sizing:border-box;border:1px solid var(--line);border-radius:12px;padding:10px;margin:5px 0;font:inherit}.ghsvc2-actions{display:flex;gap:8px;margin-top:8px}.ghsvc2-actions button{flex:1;padding:10px;border-radius:12px;border:1px solid var(--line);background:#fff;color:var(--g)}.ghsvc2-actions button.primary{background:var(--g);color:#fff;border-color:var(--g)}`;document.head.appendChild(s)}
function request(name,desc){
 let m=document.getElementById('ghSvc2Modal');if(m)m.remove();m=document.createElement('div');m.id='ghSvc2Modal';m.className='ghsvc2-modal';m.innerHTML=`<div class="ghsvc2-panel" role="dialog" aria-modal="true"><h3>${esc(name)}</h3><p>${esc(desc)}</p><input aria-label="الاسم" placeholder="اسمك"><input aria-label="رقم التواصل" inputmode="tel" placeholder="رقم التواصل"><textarea rows="3" placeholder="اكتب تفاصيل طلب الخدمة"></textarea><div class="ghsvc2-actions"><button type="button" data-close>إلغاء</button><button type="button" class="primary" data-send>إرسال الطلب</button></div></div>`;document.body.appendChild(m);m.querySelector('[data-close]').onclick=()=>m.remove();m.onclick=e=>{if(e.target===m)m.remove()};m.querySelector('[data-send]').onclick=()=>{const i=m.querySelectorAll('input');if(!i[0].value.trim()||!i[1].value.trim()){alert('أدخل الاسم ورقم التواصل');return}m.querySelector('.ghsvc2-panel').innerHTML='<h3>تم تجهيز طلب الخدمة</h3><p>سيتم ربط الطلب بمقدمي الخدمة عند توفرهم في الحي. يمكنك إضافة تفاصيل أخرى لاحقًا من خدمات الجيران.</p><div class="ghsvc2-actions"><button type="button" class="primary" data-close>إغلاق</button></div>';m.querySelector('[data-close]').onclick=()=>m.remove()};
}
function mount(){
 const p=document.getElementById('ghServicesHub');if(!p)return;style();
 let g=p.querySelector('.ghsvc2-grid');if(!g){
   const shell=p.querySelector('.gh5-shell');if(!shell)return;
   const old=shell.querySelector('.gh5-grid');if(old)old.remove();
   shell.insertAdjacentHTML('beforeend',`<div class="ghsvc2"><p class="ghsvc2-note">خدمات الحي في مكان واحد — اختر الخدمة ثم اطلبها. ويمكن للمستخدم إخفاء أو إعادة إظهار الأيقونات من تخصيص الشاشة الرئيسية.</p><div class="gh5-grid ghsvc2-grid"></div></div>`);g=shell.querySelector('.ghsvc2-grid');
 }
 g.innerHTML=C.map((x,i)=>`<button type="button" class="gh5-tile ghsvc2-card" data-ghsvc="${i}"><em>خدمة</em><span>${x[0]}</span><b>${esc(x[1])}</b><small>${esc(x[2])}</small><span class="ghsvc2-request">طلب الخدمة</span></button>`).join('');
 g.querySelectorAll('[data-ghsvc]').forEach(b=>b.onclick=()=>request(C[Number(b.dataset.ghsvc)][1],C[Number(b.dataset.ghsvc)][2]));
}
function boot(){mount();[400,1000,2000,4000].forEach(ms=>setTimeout(mount,ms));new MutationObserver(()=>setTimeout(mount,50)).observe(document.body,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.GhadeerServicesV2={catalog:C,mount};
})();
