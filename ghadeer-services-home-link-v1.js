/* Ghadeer Services Home Link v1 — make “add to home” a real action without duplicating the service catalog. */
(()=>{
'use strict';
const KEY='ghadeer_home_layout_v3';
const ALL={
'زجاج وألمنيوم':'🪟','أبواب ومطابخ':'🚪','دهانات وديكور':'🧱','نجارة':'🪚','حدادة ولحام':'🔩','بلاط ورخام':'🧱','أدوات صحية':'🛁','أجهزة منزلية':'🧰','تنظيف منازل':'🧹','نقل أثاث':'🪜','ميكانيكا سيارات':'🔧','إطارات وبنشر':'🛞','بطاريات سيارات':'🔋','غسيل سيارات':'🚿','سطحة ونقل مركبات':'🛻','فحص وتجهيز سيارات':'🚘','نقل وشحن':'📦','نقل مدرسي':'🚐','رعاية الأطفال':'👶','رعاية كبار السن':'👵','مساندة ذوي الإعاقة':'♿','دروس خصوصية':'🧑‍🏫','تدريب وتعليم':'🎓','ترجمة ولغات':'🗣️','خدمات مكتبية':'📄','توظيف وفرص عمل':'💼','لحوم ودواجن':'🥩','خضار وفواكه':'🥬','حلويات ومخبوزات منزلية':'🍰','مستلزمات حفلات':'🎈','ملابس وتفصيل':'👕','أحذية ومستلزمات':'👟','تسوق بالنيابة':'🛒','توصيل طلبات':'🚚','مشاتل ونباتات':'🌱','تنسيق حدائق':'🌳','ري ومضخات':'💧','صيانة نباتات':'🪴','مستلزمات زراعية':'🐝','مواشي وأعلاف':'🐑','صيانة حاسب':'💻','صيانة جوالات':'📱','شبكات وإنترنت':'🌐','طباعة وتصوير':'🖨️','تصميم وإعلانات':'🎨','تصوير':'📷','أمن رقمي':'🔒','تنسيق مناسبات':'💐','تصوير مناسبات':'📸','ضيافة وتموين':'🍽️','تأجير مستلزمات':'🪑','صوتيات':'🎤','نقل مناسبات':'🚐','رعاية حيوانات':'🐕','مستلزمات حيوانات':'🐈','بيطري':'🩺','هندسة واستشارات':'📐','مقاولات':'🏗️','محاسبة':'📊','استشارات قانونية':'⚖️','عقار':'🏢','تقييم عقاري':'💰','السلامة المنزلية':'🧯','مساعدة عاجلة':'🆘','مفقودات ومعثورات':'📍','متطوعون':'🤝'};
function keyFor(name){return 'svc:'+String(name||'').trim()}
function add(name){const api=window.GhadeerHomeCustomizer;if(api&&typeof api.get==='function'&&typeof api.save==='function'){
 const a=api.get();const k=keyFor(name);if(!a.includes(k))api.save(a.concat(k));
 localStorage.setItem('ghadeer_home_service_pending',JSON.stringify({key:k,name,icon:ALL[name]||'🧰'}));
 alert('تمت إضافة الخدمة إلى قائمة الرئيسية. افتح تخصيص الرئيسية لإظهارها وترتيبها.');
 return;
 }
 alert('افتح الشاشة الرئيسية ثم حاول مرة أخرى.');}
function style(){if(document.getElementById('ghSvcHomeLinkStyle'))return;const s=document.createElement('style');s.id='ghSvcHomeLinkStyle';s.textContent='.ghsvc-home-add{display:block;width:100%;margin-top:6px;border:1px solid var(--line);border-radius:10px;padding:7px;background:#f4faf6;color:var(--g);font-size:11px;font-weight:800}.ghsvc-home-add.done{background:#eef2ee;color:#6b746d}';document.head.appendChild(s)}
function mount(){const root=document.getElementById('ghServicesHub');if(!root)return;style();root.querySelectorAll('[data-s5-name]').forEach(card=>{if(card.querySelector('.ghsvc-home-add'))return;const name=card.dataset.s5Name;const b=document.createElement('button');b.type='button';b.className='ghsvc-home-add';b.textContent='＋ إضافة للرئيسية';b.onclick=e=>{e.preventDefault();e.stopPropagation();add(name)};card.appendChild(b)})}
function boot(){mount();[700,1600,3000,6000].forEach(ms=>setTimeout(mount,ms));new MutationObserver(()=>setTimeout(mount,40)).observe(document.body,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();window.GhadeerServicesHomeLink={add};
})();
