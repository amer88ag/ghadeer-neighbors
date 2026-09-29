(()=>{
  const esc2=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const jobs=[
    {n:'جدارات — المنصة الوطنية الموحدة للتوظيف',t:'حكومي + خاص',u:'https://jadarat.sa/',d:'المنصة الوطنية الموحدة للتوظيف؛ تعرض فرص القطاعين العام والخاص.'},
    {n:'وزارة الموارد البشرية والتنمية الاجتماعية',t:'حكومي',u:'https://www.hrsd.gov.sa/ministry/about-ministry/jobs',d:'صفحة التوظيف الرسمية للوزارة.'},
    {n:'وزارة الصحة',t:'حكومي',u:'https://www.moh.gov.sa/ministry/about/pages/work-for-us.aspx',d:'بوابة التوظيف الرسمية وبيانات فرص الوزارة.'},
    {n:'وزارة العدل',t:'حكومي',u:'https://www.moj.gov.sa/ar/Ministry/recruitment/Pages/default.aspx',d:'التوظيف الرسمي بوزارة العدل.'},
    {n:'وزارة التعليم',t:'حكومي',u:'https://www.moe.gov.sa/ar/aboutus/nationaltransformation/pages/employmentstrategy.aspx',d:'قنوات التوظيف الرسمية للوزارة.'},
    {n:'هيئة الاتصالات والفضاء والتقنية',t:'حكومي',u:'https://www.cst.gov.sa/about/career',d:'الفرص الوظيفية وبرامج الخريجين.'},
    {n:'LinkedIn Jobs',t:'خاص',u:'https://www.linkedin.com/jobs/',d:'وظائف الشركات وحسابات أصحاب العمل.'},
    {n:'Bayt',t:'خاص',u:'https://www.bayt.com/ar/saudi-arabia/jobs/',d:'منصة وظائف للقطاع الخاص.'}
  ];
  const realEstate=[
    {n:'الهيئة العامة للعقار',t:'رسمي',u:'https://rega.gov.sa/',d:'التحقق من الوسطاء والإعلانات والخدمات والمؤشرات العقارية.'},
    {n:'إيجار',t:'رسمي',u:'https://rega.gov.sa/rega-services/platforms/ejar/',d:'تنظيم الإيجار وتوثيق العقود وحفظ حقوق الأطراف.'},
    {n:'سكني',t:'رسمي',u:'https://sakani.sa/',d:'حلول وخدمات سكنية وعقارية.'},
    {n:'عقار',t:'مرخّص',u:'https://sa.aqar.fm/',d:'بحث عن البيع والإيجار؛ تحقّق من ترخيص الإعلان والوسيط قبل التعامل.'},
    {n:'بيوت السعودية',t:'مرخّص',u:'https://www.bayut.sa/',d:'عروض بيع وإيجار عقارية.'},
    {n:'Property Finder السعودية',t:'مرخّص',u:'https://www.propertyfinder.sa/',d:'عروض عقارية للبيع والإيجار.'},
    {n:'شبكة عقار',t:'مرخّص',u:'https://aqar.net.sa/',d:'منصة عقارية مرخّصة وفق دليل الهيئة.'},
    {n:'سندك',t:'مرخّص',u:'https://sanadak.sa/',d:'منصة عقارية مدرجة ضمن منصات الوساطة المرخّصة.'},
    {n:'سهيل',t:'مرخّص',u:'https://www.suhail.ai/',d:'منصة عقارية مدرجة ضمن منصات الوساطة المرخّصة.'},
    {n:'صكوك العقارية',t:'مرخّص',u:'https://sokok.sa/',d:'منصة عقارية مدرجة ضمن منصات الوساطة المرخّصة.'},
    {n:'طوبة',t:'مرخّص',u:'https://tuba.com.sa/',d:'منصة عقارية مدرجة ضمن منصات الوساطة المرخّصة.'}
  ];
  function card(x){return `<a class="card source-card" target="_blank" rel="noopener noreferrer" href="${esc2(x.u)}"><div class="source-head"><b>${esc2(x.n)}</b><span class="pill">${esc2(x.t)}</span></div><div class="muted">${esc2(x.d)}</div><div class="source-open">فتح المصدر ↗</div></a>`}
  function page(id,title,icon,intro,items){return `<section id="${id}" class="page"><div class="hero"><div class="source-page-head"><div><h2>${icon} ${title}</h2><p class="muted">${intro}</p></div><button class="btn secondary" onclick="openPage('home')">↩️ العودة للبرنامج</button></div></div><div class="card"><div class="source-toolbar"><input id="${id}Search" placeholder="🔎 ابحث في المصادر…"><span class="muted">تحديث القائمة: ${new Date().toLocaleDateString('ar-SA')}</span></div><div id="${id}Grid" class="source-grid">${items.map(card).join('')}</div></div><div class="card"><h3>⚠️ التحقق قبل التقديم أو التعامل</h3><p class="muted">البرنامج يوجّهك إلى مصادر موثوقة، لكن لا يضمن صحة أي إعلان فردي. في العقار خصوصًا استخدم أدوات الهيئة العامة للعقار للتحقق من رخصة الوسيط والإعلان قبل الدفع أو توقيع أي التزام.</p><button class="btn secondary" onclick="openPage('home')">🏠 إغلاق والعودة للرئيسية</button></div></section>`}
  function add(){
    const main=document.querySelector('main.wrap'); if(!main||document.getElementById('jobs'))return;
    const footer=main.querySelector('.footer');
    const anchor=footer||main.lastElementChild;
    anchor.insertAdjacentHTML('beforebegin',page('jobs','الوظائف','💼','قناة موحدة للوظائف الحكومية والخاصة من مصادر رسمية ومنصات توظيف معروفة.',jobs)+page('realEstate','العقار','🏠','البيع والإيجار والخدمات العقارية، مع فصل المصادر الرسمية عن المنصات المرخّصة والتحقق من الإعلانات.',realEstate));
    const homeGrid=[...main.querySelectorAll('#home .grid')].find(g=>g.innerText.includes('الخدمات السريعة'));
    if(homeGrid){
      homeGrid.insertAdjacentHTML('beforeend',`<button class="card icon-card" onclick="openPage('jobs')"><span class="icon">💼</span><span><b>الوظائف</b><br><small>حكومي وخاص</small></span></button><button class="card icon-card" onclick="openPage('realEstate')"><span class="icon">🏠</span><span><b>العقار</b><br><small>بيع • إيجار • خدمات</small></span></button>`);
    }
    const nav=document.querySelector('.bottom-nav');
    if(nav){
      const btn=document.createElement('button');btn.dataset.page='jobs';btn.innerHTML='💼<br>الوظائف';nav.appendChild(btn);
    }
    ['jobs','realEstate'].forEach(id=>{const input=document.getElementById(id+'Search');const grid=document.getElementById(id+'Grid');if(input&&grid)input.addEventListener('input',()=>{const q=input.value.trim().toLowerCase();grid.querySelectorAll('.source-card').forEach(c=>c.style.display=(!q||c.innerText.toLowerCase().includes(q))?'':'none');});});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',add);else add();
})();
