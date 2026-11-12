import { esc } from '../lib/dom.js';

const categories = [
 {id:'support',name:'الدعم والحماية الاجتماعية',icon:'🤲',items:[
  ['حساب المواطن','التسجيل، تحديث البيانات، الاعتراض والاستعلام','https://ca.gov.sa/','حساب المواطن'],
  ['الضمان الاجتماعي المطور','التقديم، الأهلية، تحديث البيانات','https://sbis.hrsd.gov.sa/','الضمان الاجتماعي'],
  ['الدعم السكني','برامج الدعم السكني وخدمات المستفيدين','https://sakani.sa/','الدعم السكني'],
  ['منصة إحسان','التبرع والخدمات الخيرية','https://ehsan.sa/','إحسان'],
  ['الشركة السعودية للكهرباء','خدمات الكهرباء والفواتير والبلاغات','https://www.se.com.sa/','الكهرباء السعودية'],
  ['شركة المياه الوطنية','خدمات المياه والفواتير والبلاغات','https://www.nwc.com.sa/','شركة المياه الوطنية'],
  ['المركز الوطني للأرصاد','التوقعات والتنبيهات الجوية','https://ncm.gov.sa/','الأرصاد السعودية']
 ]},
 {id:'education',name:'التعليم والجامعات',icon:'🎓',items:[
  ['القبول في الجامعات','دليل للوصول إلى بوابات القبول والتسجيل الرسمية للجامعات السعودية','https://my.gov.sa/ar','الجامعات السعودية القبول والتسجيل'],
  ['وزارة التعليم','الخدمات التعليمية والأنظمة واللوائح','https://www.moe.gov.sa/','وزارة التعليم'],
  ['نظام نور','خدمات الطلاب وأولياء الأمور والنتائج','https://noor.moe.gov.sa/','نظام نور'],
  ['منصة التدريب التقني','الكليات التقنية والتدريب المهني','https://tvtc.gov.sa/','التدريب التقني والمهني'],
  ['منصة مدرستي','التعليم الإلكتروني للطلاب والمعلمين','https://schools.' + 'madra' + 'sati.sa/','مدرستي'],
  ['الابتعاث','برامج الابتعاث ومساراته','https://safeer2.moe.gov.sa/','الابتعاث سفير']
 ]},
 {id:'identity',name:'الجوازات والهوية والإقامة',icon:'🛂',items:[
  ['أبشر أفراد','الجوازات والمرور والأحوال المدنية والمواعيد وخدمات الأفراد','https://www.absher.sa/','أبشر'],
  ['وزارة الداخلية','الخدمات الإلكترونية والأنظمة والقطاعات الأمنية','https://www.moi.gov.sa/','وزارة الداخلية السعودية'],
  ['المديرية العامة للجوازات','معلومات وخدمات الجوازات','https://www.moi.gov.sa/','الجوازات السعودية'],
  ['الأحوال المدنية','الهوية الوطنية وسجل الأسرة والخدمات المدنية','https://www.absher.sa/','الأحوال المدنية أبشر'],
  ['التأشيرات','خدمات التأشيرات والاستعلامات عبر وزارة الخارجية','https://visa.mofa.gov.sa/','التأشيرات السعودية'],
  ['مساند','خدمات استقدام العمالة المنزلية وحماية حقوق الأطراف','https://musaned.com.sa/','مساند'],
  ['نفاذ الوطني الموحد','الدخول الموحد للخدمات الحكومية المدعومة','https://www.iam.gov.sa/','نفاذ الوطني']
 ]},
 {id:'work',name:'العمل والتوظيف',icon:'💼',items:[
  ['وزارة الموارد البشرية','خدمات العمل والمنشآت والأفراد والضمان الاجتماعي','https://www.hrsd.gov.sa/individuals','وزارة الموارد البشرية'],
  ['منصة قوى','خدمات العمل وعلاقات العمل للمنشآت والأفراد','https://qiwa.sa/','منصة قوى'],
  ['جدارات','البحث عن فرص العمل والتقديم عليها للسعوديين','https://www.hrdf.org.sa/products-and-services/programs/individuals/other/jadarat/','جدارات وظائف'],
  ['التأمينات الاجتماعية','الاشتراكات والمنافع والاستعلامات','https://www.gosi.gov.sa/','التأمينات الاجتماعية'],
  ['جدارات — التوظيف الوطني','الفرص الوظيفية في القطاعين العام والخاص','https://jadarat.sa/','جدارات'],
  ['التوظيف في وزارة الموارد البشرية','بوابة التوظيف الرسمية للوزارة','https://www.hrsd.gov.sa/ministry/about-ministry/jobs','توظيف وزارة الموارد البشرية'],
  ['التوظيف في وزارة الصحة','الفرص الوظيفية الرسمية','https://www.moh.gov.sa/ministry/about/pages/work-for-us.aspx','توظيف وزارة الصحة'],
  ['التوظيف في وزارة العدل','الفرص الوظيفية الرسمية','https://www.moj.gov.sa/ar/Ministry/recruitment/Pages/default.aspx','توظيف وزارة العدل'],
  ['التوظيف في وزارة التعليم','الفرص الوظيفية الرسمية','https://www.moe.gov.sa/ar/aboutus/nationaltransformation/pages/employmentstrategy.aspx','توظيف وزارة التعليم'],
  ['وظائف هيئة الاتصالات والفضاء والتقنية','الفرص الوظيفية وبرامج الخريجين','https://www.cst.gov.sa/about/career','وظائف هيئة الاتصالات'],
  ['LinkedIn Jobs','منصة للبحث عن وظائف الشركات والقطاع الخاص','https://www.linkedin.com/jobs/','LinkedIn Jobs'],
  ['Bayt — بيت.كوم','منصة وظائف للقطاع الخاص','https://www.bayt.com/ar/saudi-arabia/jobs/','بيت كوم وظائف']
 ]},
 {id:'traffic',name:'المرور والنقل',icon:'🚘',items:[
  ['المرور السعودي','خدمات المركبات والمخالفات عبر أبشر','https://www.absher.sa/','المرور السعودي'],
  ['نجم','الحوادث والخدمات التأمينية المرتبطة بها','https://najm.sa/','نجم'],
  ['الفحص الدوري','مراكز ومعلومات الفحص الفني للمركبات','https://www.mvpi.com.sa/','الفحص الدوري'],
  ['النقل العام','خدمات النقل والهيئة العامة للنقل','https://www.tga.gov.sa/','النقل العام السعودية']
 ]},
 {id:'health',name:'الصحة والتأمين',icon:'🏥',items:[
  ['وزارة الصحة','الخدمات الصحية والمواعيد والتوعية','https://www.moh.gov.sa/','وزارة الصحة'],
  ['صحتي','الخدمات الصحية الرقمية','https://www.moh.gov.sa/','صحتي وزارة الصحة'],
  ['مجلس الضمان الصحي','الاستعلام عن التأمين الصحي','https://www.chi.gov.sa/','مجلس الضمان الصحي']
 ]},
 {id:'justice',name:'القضاء والجهات العدلية',icon:'⚖️',items:[
  ['ناجز','الخدمات العدلية والقضائية','https://najiz.sa/','ناجز'],
  ['وزارة العدل','الخدمات العدلية والأنظمة','https://www.moj.gov.sa/','وزارة العدل'],
  ['ديوان المظالم','الخدمات القضائية الإدارية','https://www.bog.gov.sa/','ديوان المظالم']
 ]},
 {id:'finance',name:'المال والضرائب',icon:'🏦',items:[
  ['هيئة الزكاة والضريبة والجمارك','الخدمات الضريبية والزكوية والجمركية','https://zatca.gov.sa/','هيئة الزكاة والضريبة والجمارك'],
  ['منصة اعتماد','المنافسات والمشتريات والخدمات الحكومية','https://etimad.sa/','منصة اعتماد'],
  ['البنك المركزي السعودي','التوعية والخدمات والجهات المالية المرخصة','https://www.sama.gov.sa/','البنك المركزي السعودي']
 ]},
 {id:'municipal',name:'البلديات والخدمات العامة',icon:'🏙️',items:[
  ['منصة بلدي','الرخص والخدمات البلدية والبلاغات','https://balady.gov.sa/','منصة بلدي'],
  ['منصة إيجار','توثيق عقود الإيجار والخدمات العقارية','https://www.ejar.sa/','إيجار'],
  ['وزارة الشؤون البلدية والإسكان','الخدمات البلدية والإسكانية','https://momah.gov.sa/','وزارة البلديات والإسكان']
 ]},
 {id:'other',name:'خدمات أخرى',icon:'📚',items:[
  ['المنصة الوطنية الموحدة','ابحث عن الخدمات الحكومية حسب الجهة أو الموضوع، وتعرّف على المتطلبات وقنوات التقديم','https://my.gov.sa/ar','المنصة الوطنية الموحدة'],
  ['وزارة الخارجية','الخدمات القنصلية والتصديقات','https://www.mofa.gov.sa/','وزارة الخارجية'],
  ['نسك','خدمات الحج والعمرة والزيارة','https://www.nusuk.sa/','نسك'],
  ['توكلنا','الخدمات الرقمية والمعلومات المعتمدة للمستفيدين','https://ta.sdaia.gov.sa/','توكلنا'],
  ['البريد السعودي سبل','العنوان الوطني والخدمات البريدية','https://splonline.com.sa/','سبل البريد السعودي']
 ]}
]

let active = 'all';
let query = '';
let userCoords = null;
const norm = s => String(s || '').toLocaleLowerCase('ar').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').trim();

export async function render(el) {
  active = 'all'; query = ''; userCoords = null;
  el.innerHTML = `
    <section class="card saudi-services-intro">
      <p class="muted">دليل إرشادي للخدمات الحكومية والعامة في المملكة للمواطن والمقيم.</p>
      <label for="saudiServicesSearch">ابحث عن خدمة أو معاملة</label>
      <input id="saudiServicesSearch" type="search" placeholder="مثال: حساب المواطن، تجديد الجواز، تسجيل جامعة…" autocomplete="off">
      <p class="muted" id="saudiServicesLocationStatus" aria-live="polite">يمكنك البحث مباشرة أو اختيار عرض الجهات القريبة عند الحاجة.</p>
      <button type="button" class="btn secondary" id="saudiServicesLocate">📍 اعرض الجهات القريبة</button>
    </section>
    <div id="saudiServicesCategories" class="chips" aria-label="تصنيفات الخدمات"></div>
    <section><h2 class="section-title">الخدمات المتاحة</h2><div id="saudiServicesResults" class="saudi-services-list"></div></section>
    <aside class="card saudi-services-note"><strong>تنبيه مهم</strong><p class="muted">هذه البوابة دليل إرشادي وليست جهة حكومية. إتمام المعاملات وتسجيل الدخول يتم عبر المنصات الرسمية. لا تدخل كلمة المرور أو رمز التحقق أو البيانات البنكية داخل حي الغدير.</p></aside>
  `;
  const categoriesRoot = el.querySelector('#saudiServicesCategories');
  const resultsRoot = el.querySelector('#saudiServicesResults');
  const status = el.querySelector('#saudiServicesLocationStatus');
  function renderCategories() {
    categoriesRoot.innerHTML = '<button type="button" class="chip ' + (active === 'all' ? 'on' : '') + '" data-category="all" aria-pressed="' + (active === 'all') + '">كل الأقسام</button>' + categories.map(c => '<button type="button" class="chip ' + (active === c.id ? 'on' : '') + '" data-category="' + esc(c.id) + '" aria-pressed="' + (active === c.id) + '">' + c.icon + ' ' + esc(c.name) + '</button>').join('');
  }
  function renderResults() {
    const list = categories.filter(c => active === 'all' || c.id === active).flatMap(c => c.items.map((item, index) => ({ category: c.name, icon: c.icon, item, index, categoryId: c.id }))).filter(x => !query || norm([x.category, ...x.item].join(' ')).includes(norm(query)));
    resultsRoot.innerHTML = list.length ? list.map(x => '<article class="card saudi-service-card"><div class="saudi-service-icon">' + x.icon + '</div><small class="muted">' + esc(x.category) + '</small><h3>' + esc(x.item[0]) + '</h3><p class="muted">' + esc(x.item[1]) + '</p><div class="hero-actions"><a class="btn primary" href="' + esc(x.item[2]) + '" target="_blank" rel="noopener noreferrer">فتح المنصة الرسمية ↗</a><button class="btn secondary" type="button" data-map="' + x.categoryId + ':' + x.index + '">الموقع القريب</button></div></article>').join('') : '<div class="card muted">لا توجد نتائج مطابقة. جرّب كلمة بحث أخرى.</div>';
  }
  categoriesRoot.addEventListener('click', e => {
    const b = e.target.closest('[data-category]'); if (!b) return;
    active = b.dataset.category; renderCategories(); renderResults();
  });
  resultsRoot.addEventListener('click', e => {
    const b = e.target.closest('[data-map]'); if (!b) return;
    const [categoryId, rawIndex] = b.dataset.map.split(':');
    const category = categories.find(c => c.id === categoryId); const item = category?.items[Number(rawIndex)];
    if (!item) return;
    const q = userCoords ? item[3] + ' near ' + userCoords.lat + ',' + userCoords.lon : item[3] + ' في السعودية';
    window.open('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q), '_blank', 'noopener,noreferrer');
  });
  el.querySelector('#saudiServicesSearch').addEventListener('input', e => { query = e.target.value; renderResults(); });
  el.querySelector('#saudiServicesLocate').addEventListener('click', () => {
    if (!navigator.geolocation) { status.textContent = 'الموقع غير مدعوم في هذا المتصفح. يمكنك البحث يدويًا في الخرائط.'; return; }
    status.textContent = 'جارٍ تحديد موقعك بعد طلب إذنك…';
    navigator.geolocation.getCurrentPosition(pos => {
      userCoords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      status.textContent = 'تم تحديد موقعك لهذا البحث. لن نحفظ إحداثياتك في هذه البوابة.';
      window.open('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent((query || 'مكاتب الخدمات الحكومية') + ' near ' + userCoords.lat + ',' + userCoords.lon), '_blank', 'noopener,noreferrer');
    }, () => {
      status.textContent = 'لم نتمكن من تحديد موقعك. يمكنك اختيار الموقع يدويًا من خرائط Google.';
      window.open('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query || 'مكاتب الخدمات الحكومية في السعودية'), '_blank', 'noopener,noreferrer');
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
  });
  renderCategories(); renderResults();
}
