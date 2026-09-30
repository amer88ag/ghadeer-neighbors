/* Ghadeer UI v4 — single-entry navigation, deduplicated services, compact home. */
(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const go=id=>window.openPage?.(id);
  const action=a=>{if(a==='services:help'||a==='services:market')return go('ghServicesHub');return go(a)};
  const css=`
    #ghV4Home,#ghV4Services,#ghV4More{margin:12px 0}
    .gh4-shell{background:#fff;border:1px solid var(--line);border-radius:22px;padding:14px;box-shadow:0 8px 24px #0000000a}
    .gh4-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}
    .gh4-head h2{margin:0;color:var(--g);font-size:21px}.gh4-head p{margin:4px 0 0;color:var(--muted);font-size:12px}
    .gh4-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}
    .gh4-tile{border:1px solid var(--line);background:linear-gradient(180deg,#fff,#fbfaf7);border-radius:17px;padding:11px 7px;min-height:84px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;text-align:center;color:var(--txt);box-shadow:0 3px 12px #00000008}
    .gh4-tile .i{font-size:27px;line-height:1}.gh4-tile b{font-size:13px}.gh4-tile small{font-size:10px;color:var(--muted)}
    .gh4-feature{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:10px}.gh4-mini{border:1px solid var(--line);border-radius:16px;background:#fff;padding:12px;min-height:78px}.gh4-mini b{display:block;margin-bottom:5px}.gh4-mini small{color:var(--muted)}
    .gh4-more-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
    .gh4-hidden{display:none!important}
    .gh4-nav{position:fixed!important;bottom:0;left:0;right:0;background:#fff!important;border-top:1px solid var(--line);z-index:80;display:grid!important;grid-template-columns:repeat(5,1fr);max-width:none!important}
    .gh4-nav button{max-width:none!important;border:0!important;background:#fff!important;padding:8px 3px!important;font-size:11px!important;color:var(--muted)!important}.gh4-nav button:hover{background:#f4faf6!important}
    @media(max-width:650px){.gh4-grid{grid-template-columns:repeat(3,1fr)}.gh4-feature{grid-template-columns:1fr}.gh4-more-grid{grid-template-columns:1fr}}
  `;
  const tile=(i,t,d,id)=>`<button type="button" class="gh4-tile" data-gh4="${esc(id)}"><span class="i">${i}</span><b>${esc(t)}</b><small>${esc(d)}</small></button>`;
  function installStyle(){if($('ghV4Style'))return;const s=document.createElement('style');s.id='ghV4Style';s.textContent=css;document.head.appendChild(s)}
  function bind(root){root.querySelectorAll('[data-gh4]').forEach(b=>b.onclick=()=>action(b.dataset.gh4))}
  function hideV3(){['ghHomeHub'].forEach(id=>$(id)?.classList.add('gh4-hidden'));document.querySelectorAll('.gh-v3-nav').forEach(n=>n.classList.add('gh4-hidden'))}
  function home(){const p=$('home');if(!p)return;let old=$('ghV4Home');if(old)old.remove();hideV3();old=document.createElement('section');old.id='ghV4Home';old.className='gh4-shell';old.innerHTML=`
    <div class="gh4-head"><div><h2>🧰 خدمات الحي</h2><p>كل خدمة في مكان واحد — بدون تكرار.</p></div><button class="btn secondary" data-gh4="ghServicesHub">عرض الكل</button></div>
    <div class="gh4-grid">
      ${tile('🤝','خدمات الجيران','طلب أو عرض خدمة','ghServicesHub')}
      ${tile('🛍️','سوق الحي','بيع وشراء','ghServicesHub')}
      ${tile('💼','الوظائف','فرص العمل','jobs')}
      ${tile('🏠','العقار','بيع وإيجار','realEstate')}
      ${tile('🎉','المناسبات','فعاليات الحي','neighborhoodEvents')}
      ${tile('⚽','كرة الحي','مباريات وتنظيم','ghFootball')}
      ${tile('📖','القرآن والأذكار','مصحف وتلاوة','dhikr')}
      ${tile('📰','أخبار الحي','أخبار ومصادر','news')}
      ${tile('❤️','تفقد جار','مساعدة وتواصل','neighborCheck')}
    </div>
    <div class="gh4-feature">
      <button class="gh4-mini" type="button" data-gh4="coffee"><b>☕ القهوة القادمة</b><small>افتح جدول القهوة والتفاصيل</small></button>
      <button class="gh4-mini" type="button" data-gh4="outings"><b>🚐 الطلعات</b><small>موعد وتقييم الطلعات في صفحة واحدة</small></button>
    </div>`;
    const anchor=p.querySelector('.hadith-board')||p.querySelector('.hero');anchor?anchor.insertAdjacentElement('afterend',old):p.appendChild(old);bind(old)
  }
  function services(){const p=$('ghServicesHub');if(!p)return;let body=p.querySelector('#ghServicesHub-body')||p;body.innerHTML=`
    <div class="gh4-shell"><div class="gh4-head"><div><h2>🧰 خدمات الحي</h2><p>الوظائف ضمن الخدمات، والطلعات في قسمها الخاص.</p></div><button class="btn secondary" data-gh4="home">الرئيسية</button></div>
    <div class="gh4-grid">
      ${tile('🤝','خدمات الجيران','طلبات وعروض','services:help')}
      ${tile('🛍️','سوق الحي','منتجات وأغراض','services:market')}
      ${tile('💼','الوظائف','حكومي وخاص','jobs')}
      ${tile('🏠','العقار','بيع وإيجار','realEstate')}
      ${tile('🎉','مناسبات الحي','فعاليات','neighborhoodEvents')}
      ${tile('⚽','كرة الحي','مباريات','ghFootball')}
      ${tile('📖','القرآن والأذكار','مصحف وتلاوة','dhikr')}
      ${tile('📰','الأخبار','مصادر الحي','news')}
      ${tile('❤️','تفقد جار','مساعدة','neighborCheck')}
      ${tile('📢','الإعلانات','إعلانات الحي','messages')}
      ${tile('🔎','المفقودات','بحث وإبلاغ','messages')}
      ${tile('💬','الرسائل','تواصل','messages')}
    </div>
    <div class="gh4-feature"><button class="gh4-mini" data-gh4="homePrayer"><b>🕌 الصلاة</b><small>مواقيت الصلاة</small></button><button class="gh4-mini" data-gh4="homeWeather"><b>🌤️ الطقس</b><small>طقس أبها</small></button></div></div>`;
    bind(p)
  }
  function more(){let p=$('ghMore');if(!p){p=document.createElement('section');p.id='ghMore';p.className='page';document.querySelector('main.wrap')?.appendChild(p)}p.classList.remove('gh4-hidden');p.innerHTML=`<div class="gh4-shell"><div class="gh4-head"><div><h2>☰ المزيد</h2><p>الإدارة والروابط الثانوية فقط.</p></div><button class="btn secondary" data-gh4="home">الرئيسية</button></div><div class="gh4-more-grid">
    ${tile('🔐','دخول الإدارة','للمخولين فقط','manager')}${tile('🛠️','المطور','إدارة البرنامج','developer')}${tile('💬','الرسائل','التواصل','messages')}${tile('📄','المعلومات','المحتوى والحقوق','aboutProject')}${tile('🚪','خروج','تسجيل الخروج','logout')}
  </div></div>`;bind(p)}
  function nav(){const n=document.querySelector('.bottom-nav');if(!n)return;n.className='bottom-nav gh4-nav';n.innerHTML=`<button type="button" data-gh4="home">🏠<br>الرئيسية</button><button type="button" data-gh4="ghServicesHub">🧰<br>الخدمات</button><button type="button" data-gh4="coffee">☕<br>القهوة</button><button type="button" data-gh4="members">👥<br>الجيران</button><button type="button" data-gh4="ghMore">☰<br>المزيد</button>`;bind(n)}
  function dedupeLegacy(){const h=$('home');if(h){h.querySelectorAll('.grid').forEach(g=>{const t=g.textContent||'';if(/الطلعات/.test(t)&&/القرآن/.test(t))g.classList.add('gh4-hidden')})}$('ghNeighborhoodServices')?.classList.add('gh4-hidden')}
  function install(){installStyle();home();services();more();nav();dedupeLegacy()}
  function boot(){install();[300,900,1800,3500,6000].forEach(ms=>setTimeout(install,ms))}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.GhadeerUIv4={install};
})();
