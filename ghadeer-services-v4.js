/* Ghadeer Services v4 — remaining neighborhood categories, demo providers, ratings and request flow. */
(()=>{
'use strict';
const extra=[
 ['💊','صيدليات ودواء','صيدلية، توصيل دواء، مستلزمات صحية'],
 ['🍽️','مطاعم ومطابخ','مطاعم، مطابخ منزلية، وجبات ومناسبات'],
 ['🥖','مخابز وتموينات','مخابز، تموينات، احتياجات يومية'],
 ['☕','مقاهي','قهوة ومشروبات ومواعيد الاستلام'],
 ['💈','حلاقة وتجميل','حلاقة، صالونات وخدمات منزلية'],
 ['🧺','مغاسل وكي','غسيل وكي واستلام وتسليم'],
 ['📚','قرطاسية ومستلزمات مدرسية','كتب، أدوات مدرسية وطباعة'],
 ['🖨️','طباعة وتصميم','طباعة، تصوير مستندات وتصميم'],
 ['🎁','هدايا وتغليف','هدايا، ورد وتغليف للمناسبات'],
 ['🌹','ورد ونباتات','تنسيق ورد ونباتات وهدايا'],
 ['🏪','محلات وخدمات قريبة','دليل المحلات والخدمات داخل الحي'],
 ['🏨','حجوزات واستراحات','استراحات ومرافق وحجوزات محلية'],
 ['🚕','نقل أفراد','مشاوير أفراد ونقل داخل الحي'],
 ['🧯','سلامة ومكافحة حريق','طفايات وفحص وتجهيزات سلامة'],
 ['🔐','حراسة وأمن منشآت','خدمات أمنية مرخصة عند توفرها'],
 ['🚑','طوارئ ومساعدة عاجلة','الوصول السريع لخدمات الطوارئ الرسمية والمساعدة المجتمعية']
];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function style(){if(document.getElementById('ghSvc4Style'))return;const s=document.createElement('style');s.id='ghSvc4Style';s.textContent=`.ghsvc4{margin-top:14px}.ghsvc4-title{font-weight:900;color:var(--g);margin:0 0 5px}.ghsvc4-note{font-size:11px;color:var(--muted);margin:0 0 10px}.ghsvc4-card{min-height:122px!important}.ghsvc4-demo{font-size:9px;color:var(--muted);margin-top:2px}.ghsvc4-modal{position:fixed;inset:0;z-index:1000;background:#0007;display:flex;align-items:flex-end;justify-content:center;padding:12px}.ghsvc4-panel{width:min(680px,100%);max-height:88vh;overflow:auto;background:#fff;border-radius:22px;padding:16px}.ghsvc4-panel h3{margin:0;color:var(--g)}.ghsvc4-providers{display:grid;gap:8px;margin:12px 0}.ghsvc4-provider{border:1px solid var(--line);border-radius:14px;padding:10px}.ghsvc4-provider b{display:block}.ghsvc4-provider small{color:var(--muted);display:block;margin:3px 0}.ghsvc4-provider .rate{color:#c58a16;font-weight:800}.ghsvc4-provider button{margin-top:7px;border:1px solid var(--line);border-radius:9px;background:#f4faf6;color:var(--g);padding:7px 10px}.ghsvc4-actions{display:flex;gap:8px}.ghsvc4-actions button{flex:1;border:1px solid var(--line);border-radius:11px;padding:10px;background:#fff;color:var(--g)}.ghsvc4-actions .primary{background:var(--g);color:#fff}`;document.head.appendChild(s)}
function providers(i){
 const x=extra[i];
 const demo=[
  ['مزود خدمة تجريبي 1','متاح داخل الحي','05••••••••','4.8'],
  ['مزود خدمة تجريبي 2','متاح حسب الموعد','05••••••••','4.6']
 ];
 let m=document.getElementById('ghSvc4Modal');if(m)m.remove();m=document.createElement('div');m.id='ghSvc4Modal';m.className='ghsvc4-modal';m.innerHTML=`<div class="ghsvc4-panel" role="dialog" aria-modal="true"><h3>${x[0]} ${x[1]}</h3><p class="ghsvc4-note">${x[2]}</p><div class="ghsvc4-providers">${demo.map(p=>`<div class="ghsvc4-provider"><b>${p[0]}</b><small>${p[1]} • ${p[2]}</small><span class="rate">★ ${p[3]} — تقييم تجريبي</span><br><button type="button" data-request="${esc(p[0])}">طلب الخدمة</button></div>`).join('')}</div><div class="ghsvc4-actions"><button type="button" data-close>إغلاق</button><button type="button" class="primary" data-offer>أعرض خدمتي</button></div></div>`;document.body.appendChild(m);m.onclick=e=>{if(e.target===m)m.remove()};m.querySelector('[data-close]').onclick=()=>m.remove();m.querySelector('[data-offer]').onclick=()=>offer(x[1]);m.querySelectorAll('[data-request]').forEach(b=>b.onclick=()=>request(x[1],b.dataset.request));
}
function request(service,provider){
 const m=document.getElementById('ghSvc4Modal');if(!m)return;m.querySelector('.ghsvc4-panel').innerHTML=`<h3>طلب ${esc(service)}</h3><p class="ghsvc4-note">المزود: ${esc(provider)}</p><input id="ghSvc4Phone" inputmode="tel" placeholder="رقم التواصل" style="width:100%;box-sizing:border-box;padding:10px;border:1px solid var(--line);border-radius:11px"><textarea id="ghSvc4Details" rows="4" placeholder="تفاصيل الطلب والموعد والموقع" style="width:100%;box-sizing:border-box;padding:10px;margin-top:7px;border:1px solid var(--line);border-radius:11px"></textarea><div class="ghsvc4-actions" style="margin-top:8px"><button type="button" data-close>إلغاء</button><button type="button" class="primary" data-send>إرسال</button></div>`;m.querySelector('[data-close]').onclick=()=>m.remove();m.querySelector('[data-send]').onclick=()=>{const p=m.querySelector('#ghSvc4Phone').value.trim();if(!p){alert('أدخل رقم التواصل');return}m.querySelector('.ghsvc4-panel').innerHTML='<h3>تم تجهيز الطلب</h3><p class="ghsvc4-note">سيظهر الطلب ضمن مسار خدمات الجيران عند ربطه بالمزود الفعلي. بيانات المزود المعروضة حاليًا تجريبية وليست بيانات أشخاص حقيقيين.</p><div class="ghsvc4-actions"><button type="button" class="primary" data-close>إغلاق</button></div>';m.querySelector('[data-close]').onclick=()=>m.remove()}
}
function offer(service){const m=document.getElementById('ghSvc4Modal');if(!m)return;m.querySelector('.ghsvc4-panel').innerHTML=`<h3>أعرض خدمتي: ${esc(service)}</h3><p class="ghsvc4-note">إضافة مقدم خدمة حقيقي تكون من خلال حساب العضو، مع بيانات التواصل والتقييم بعد التحقق.</p><input placeholder="اسم الخدمة أو المهنة" style="width:100%;box-sizing:border-box;padding:10px;border:1px solid var(--line);border-radius:11px"><textarea rows="3" placeholder="الخبرة، نطاق الخدمة، أوقات العمل" style="width:100%;box-sizing:border-box;padding:10px;margin-top:7px;border:1px solid var(--line);border-radius:11px"></textarea><div class="ghsvc4-actions" style="margin-top:8px"><button type="button" data-close>إلغاء</button><button type="button" class="primary" data-save>متابعة</button></div>`;m.querySelector('[data-close]').onclick=()=>m.remove();m.querySelector('[data-save]').onclick=()=>{alert('سيتم ربط إضافة مقدم الخدمة بحساب العضو والتحقق قبل نشر بيانات التواصل.');m.remove()}}
function mount(){const p=document.getElementById('ghServicesHub');if(!p)return;style();const shell=p.querySelector('.gh5-shell');if(!shell)return;let box=shell.querySelector('.ghsvc4');if(!box){box=document.createElement('div');box.className='ghsvc4';shell.appendChild(box)}box.innerHTML=`<p class="ghsvc4-title">➕ خدمات إضافية</p><p class="ghsvc4-note">هذه الخدمات لا تُكرر خدمات الحي الأساسية، ويمكن إخفاء أي خدمة من الشاشة الرئيسية عبر التخصيص.</p><div class="gh5-grid">${extra.map((x,i)=>`<button type="button" class="gh5-tile ghsvc4-card" data-ghsvc4="${i}"><span>${x[0]}</span><b>${esc(x[1])}</b><small>${esc(x[2])}</small><span class="ghsvc4-demo">مزودون وتقييمات تجريبية حتى إضافة مزودين حقيقيين</span></button>`).join('')}</div>`;box.querySelectorAll('[data-ghsvc4]').forEach(b=>b.onclick=()=>providers(Number(b.dataset.ghsvc4)))}
function boot(){mount();[500,1500,3000,6000].forEach(ms=>setTimeout(mount,ms));new MutationObserver(()=>setTimeout(mount,50)).observe(document.body,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();window.GhadeerServicesV4={catalog:extra,mount};
})();
