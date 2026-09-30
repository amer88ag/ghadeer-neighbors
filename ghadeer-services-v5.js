/* Ghadeer Services v5 — additional service catalog, grouped for discoverability. */
(()=>{'use strict';
const groups={
'🏠 المنزل والصيانة':[
['🪟','زجاج وألمنيوم','تركيب وإصلاح الزجاج والألمنيوم'],['🚪','أبواب ومطابخ','أبواب، مطابخ وتركيب'],['🧱','دهانات وديكور','دهانات وديكور وتشطيبات'],['🪚','نجارة','تفصيل وإصلاح الأثاث الخشبي'],['🔩','حدادة ولحام','أعمال الحديد واللحام'],['🧱','بلاط ورخام','تركيب وصيانة البلاط والرخام'],['🛁','أدوات صحية','تركيب وإصلاح الأدوات الصحية'],['🧰','أجهزة منزلية','صيانة الأجهزة المنزلية'],['🧹','تنظيف منازل','تنظيف دوري أو حسب الطلب'],['🪜','نقل أثاث','فك ونقل وتركيب الأثاث']
],
'🚗 السيارات والنقل':[
['🔧','ميكانيكا سيارات','فحص وصيانة وإصلاح السيارات'],['🛞','إطارات وبنشر','إطارات، بنشر وخدمة متنقلة'],['🔋','بطاريات سيارات','فحص وتغيير البطاريات'],['🚿','غسيل سيارات','غسيل وتلميع داخل الحي'],['🛻','سطحة ونقل مركبات','نقل المركبات عند الحاجة'],['🚘','فحص وتجهيز سيارات','خدمات تجهيز وفحص قبل البيع'],['📦','نقل وشحن','نقل أغراض وشحن محلي'],['🚐','نقل مدرسي','نقل الطلاب وفق الأنظمة والتحقق']
],
'👨‍👩‍👧 الأسرة والمجتمع':[
['👶','رعاية الأطفال','خدمات رعاية أطفال موثوقة بعد التحقق'],['👵','رعاية كبار السن','مساعدة منزلية ورعاية مجتمعية'],['♿','مساندة ذوي الإعاقة','خدمات ومساعدة مناسبة للاحتياج'],['🧑‍🏫','دروس خصوصية','دروس ومراجعة للطلاب'],['🎓','تدريب وتعليم','دورات ومهارات وتدريب'],['🗣️','ترجمة ولغات','ترجمة ومساعدة لغوية'],['📄','خدمات مكتبية','نماذج، كتابة وطباعة مستندات'],['💼','توظيف وفرص عمل','وظائف وخدمات مهنية']
],
'🛍️ التسوق والطلبات':[
['🥩','لحوم ودواجن','طلبات اللحوم والدواجن'],['🥬','خضار وفواكه','طلبات المنتجات الطازجة'],['🍰','حلويات ومخبوزات منزلية','طلبات المناسبات والضيافة'],['🎈','مستلزمات حفلات','تجهيز المناسبات والاحتفالات'],['👕','ملابس وتفصيل','ملابس، تعديل وتفصيل'],['👟','أحذية ومستلزمات','متاجر ومستلزمات شخصية'],['🛒','تسوق بالنيابة','شراء وتسليم داخل الحي'],['🚚','توصيل طلبات','استلام وتسليم الطلبات']
],
'🌿 المزارع والحدائق':[
['🌱','مشاتل ونباتات','نباتات وأشجار ومستلزمات'],['🌳','تنسيق حدائق','تصميم وصيانة الحدائق'],['💧','ري ومضخات','شبكات ري ومضخات وآبار'],['🪴','صيانة نباتات','عناية بالنباتات المنزلية'],['🐝','مستلزمات زراعية','تربة وأسمدة وأدوات'],['🐑','مواشي وأعلاف','مستلزمات وتوريد محلي']
],
'💻 التقنية والخدمات الرقمية':[
['💻','صيانة حاسب','صيانة وترقية أجهزة الحاسب'],['📱','صيانة جوالات','صيانة وإعداد الأجهزة'],['🌐','شبكات وإنترنت','إعداد الشبكات والمساعدة التقنية'],['🖨️','طباعة وتصوير','طباعة وتصوير مستندات'],['🎨','تصميم وإعلانات','تصميم مواد إعلانية'],['📷','تصوير','تصوير مناسبات ومنتجات'],['🔒','أمن رقمي','مساعدة في حماية الحسابات والأجهزة']
],
'🎉 المناسبات والضيافة':[
['💐','تنسيق مناسبات','تجهيز وترتيب المناسبات'],['📸','تصوير مناسبات','صور وفيديو للمناسبات'],['🍽️','ضيافة وتموين','ضيافة وتجهيز الطعام'],['🪑','تأجير مستلزمات','كراسي وطاولات وتجهيزات'],['🎤','صوتيات','أنظمة صوت ومستلزمات مناسبات'],['🚐','نقل مناسبات','نقل الضيوف والمستلزمات']
],
'🐾 الحيوانات':[
['🐕','رعاية حيوانات','رعاية وإيواء الحيوانات الأليفة'],['🐈','مستلزمات حيوانات','أغذية ومستلزمات'],['🩺','بيطري','خدمات بيطرية من جهات مختصة']
],
'⚖️ خدمات مهنية':[
['📐','هندسة واستشارات','استشارات هندسية ومخططات'],['🏗️','مقاولات','تنفيذ وصيانة أعمال البناء'],['📊','محاسبة','خدمات محاسبية للأفراد والمنشآت'],['⚖️','استشارات قانونية','الوصول لمختصين مرخصين'],['🏢','عقار','تسويق وإدارة عقارات'],['💰','تقييم عقاري','تقييم من مختصين معتمدين']
],
'🚨 السلامة والمساعدة':[
['🧯','السلامة المنزلية','فحص وتجهيزات السلامة'],['🆘','مساعدة عاجلة','مساعدة مجتمعية غير طارئة'],['📍','مفقودات ومعثورات','الإبلاغ عن المفقودات والمعثورات'],['🤝','متطوعون','طلبات التطوع والمساعدة المجتمعية']
]};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function style(){if(document.getElementById('ghSvc5Style'))return;const s=document.createElement('style');s.id='ghSvc5Style';s.textContent=`.ghsvc5{margin-top:14px}.ghsvc5-group{border-top:1px solid var(--line);padding-top:12px;margin-top:12px}.ghsvc5-title{font-weight:900;color:var(--g);margin:0 0 8px}.ghsvc5-note{font-size:11px;color:var(--muted);margin:0 0 9px}.ghsvc5-card{min-height:100px!important}.ghsvc5-card small{line-height:1.35}.ghsvc5-badge{font-size:9px;color:var(--muted)}`;document.head.appendChild(s)}
function openService(name,desc){let m=document.getElementById('ghSvc5Modal');if(m)m.remove();m=document.createElement('div');m.id='ghSvc5Modal';m.style.cssText='position:fixed;inset:0;z-index:1100;background:#0007;display:flex;align-items:flex-end;padding:12px';m.innerHTML=`<div style="width:min(680px,100%);margin:auto;background:#fff;border-radius:22px;padding:16px"><h3 style="margin:0;color:var(--g)">${esc(name)}</h3><p style="color:var(--muted);font-size:12px">${esc(desc)}</p><input placeholder="موقع الخدمة أو الحي" style="width:100%;box-sizing:border-box;padding:10px;border:1px solid var(--line);border-radius:10px"><textarea rows="3" placeholder="تفاصيل الطلب والموعد" style="width:100%;box-sizing:border-box;padding:10px;margin-top:7px;border:1px solid var(--line);border-radius:10px"></textarea><div style="display:flex;gap:8px;margin-top:8px"><button type="button" data-close class="btn secondary" style="flex:1">إلغاء</button><button type="button" data-send class="btn" style="flex:1">إرسال الطلب</button></div></div>`;document.body.appendChild(m);m.onclick=e=>{if(e.target===m)m.remove()};m.querySelector('[data-close]').onclick=()=>m.remove();m.querySelector('[data-send]').onclick=()=>{alert('تم تجهيز طلب الخدمة. سيتم ربطه بمزود الخدمة الفعلي بعد تسجيله والتحقق منه.');m.remove()}}
function mount(){const p=document.getElementById('ghServicesHub');if(!p)return;style();const shell=p.querySelector('.gh5-shell');if(!shell)return;let box=shell.querySelector('.ghsvc5');if(!box){box=document.createElement('div');box.className='ghsvc5';shell.appendChild(box)}box.innerHTML=`<p class="ghsvc5-title">🧩 خدمات إضافية</p><p class="ghsvc5-note">الخدمات منظمة حسب الاختصاص ولا تُضاف للشاشة الرئيسية تلقائيًا. اختر ما تحتاجه ثم استخدم تخصيص الرئيسية لإظهارها.</p>${Object.entries(groups).map(([g,items])=>`<section class="ghsvc5-group"><h3 class="ghsvc5-title">${g}</h3><div class="gh5-grid">${items.map(x=>`<button type="button" class="gh5-tile ghsvc5-card" data-s5-name="${esc(x[1])}" data-s5-desc="${esc(x[2])}"><span>${x[0]}</span><b>${esc(x[1])}</b><small>${esc(x[2])}</small><span class="ghsvc5-badge">طلب الخدمة • إضافة للرئيسية</span></button>`).join('')}</div></section>`).join('')}`;box.querySelectorAll('[data-s5-name]').forEach(b=>b.onclick=()=>openService(b.dataset.s5Name,b.dataset.s5Desc))}
function boot(){mount();[500,1500,3000,6000].forEach(ms=>setTimeout(mount,ms));new MutationObserver(()=>setTimeout(mount,40)).observe(document.body,{childList:true,subtree:true})}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();window.GhadeerServicesV5={groups,mount};})();