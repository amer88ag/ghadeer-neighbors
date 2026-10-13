import { esc, fmtTime, todayISO, $ } from '../lib/dom.js';
import { state, memberName, activeMembers, showLogin, canManage } from '../lib/session.js';
import * as data from '../lib/data.js';
import { showJoinRequest, showGuestWelcome } from '../lib/join.js';
import { prayerTimes, renderPrayer, renderWeather, DHIKR, HADITH } from '../lib/widgets.js';
import { LOCATION } from '../config.js';

/*
 * أيقونات الرئيسية مصنفة. access: all = متاح للجميع، member = يحتاج دخول عضو للمشاركة، admin = للمدير والمشرفين فقط.
 * كل مسار هنا يجب أن يكون صفحة مسجلة في app.js (يتحقق منها scripts/check.js).
 */
export const GROUPS = [
  ['🏘️ الحي', [
    ['coffee', '☕', 'القهوة', 'الجدول والاعتذار', 'all'],
    ['outings', '🚐', 'الطلعات', 'التصويت والجدول', 'all'],
    ['events', '🎉', 'مناسبات الحي', 'المناسبات والمشاركون', 'all'],
    ['neighbors', '👥', 'الجيران', 'دليل الجيران', 'all'],
    ['news', '📢', 'أخبار الحي', 'الإعلانات والمناسبات', 'all'],
    ['messages', '💬', 'الرسائل', 'المجموعة والخاص', 'member'],
    ['check', '❤️', 'تفقد جارك', 'مريض • محتاج • مساعدة', 'member'],
    ['community', '🏘️', 'مجتمع جديد', 'أنشئ مجتمعك الخاص', 'member']
  ]],
  ['🤝 خدمات الحي', [
    ['services/help', '🤝', 'خدمات الجيران', 'اطلب أو اعرض خدمة', 'all'],
    ['services/market', '🛍️', 'سوق الحي', 'بيع وإهداء وطلب', 'all'],
    ['services/lost', '🔎', 'المفقودات', 'مفقود أو معثور عليه', 'all'],
    ['services/initiative', '💡', 'المبادرات', 'أفكار لخدمة الحي', 'all'],
    ['housing', '🏠', 'سكن الحي', 'عروض وطلبات الإيجار', 'all'],
    ['services/catalog', '📚', 'دليل الخدمات', 'صيانة • نقل • تعليم', 'all'],
    ['links/jobs', '💼', 'الوظائف', 'بوابات التوظيف', 'all']
  ]],
  ['🕌 يومياتي', [
    ['prayer', '🕌', 'مواقيت الصلاة', 'الأذان والإقامة', 'all'],
    ['weather', '🌤️', 'الطقس', 'الآن والأيام القادمة', 'all'],
    ['azkar', '📿', 'الذكر', 'مسبحة وأحاديث الجوار', 'all']
  ]],
  ['🔗 روابط', [
    ['links/news', '📰', 'الأخبار والصحف', 'السعودية والعالم', 'all'],
    ['links/sports', '⚽', 'الرياضة', 'الدوري والبطولات', 'all'],
    ['links/gov', '🏛️', 'خدمات عامة', 'حكومية • المساجد', 'all']
  ]],
  ['👤 حسابي', [
    ['account', '👤', 'حسابي', 'الدخول والرقم السري', 'all'],
    ['neighbors/me', '🪪', 'بطاقتي', 'بياناتي وطرق التواصل', 'member'],
    ['install', '📲', 'النشر والتثبيت', 'شارك وثبّت البرنامج', 'all'],
    ['terms', '📜', 'الشروط والأحكام', 'الأنظمة والإقرارات', 'all'],
    ['about', '©️', 'عن البرنامج', 'الملكية والخصوصية', 'all'],
    ['manager', '🛠️', 'لوحة الإدارة', 'للمطور والمشرفين', 'admin'],
    ['stats', '📊', 'الإحصاءات', 'إحصاء شامل للمطور', 'dev']
  ]]
];
export const TILES = GROUPS.flatMap(([, items]) => items);
// أيقونات يفتحها الزائر دون تسجيل (يطابق PUBLIC في app.js).
const OPEN = new Set(['account', 'terms', 'about', 'install']);

/** ترتيب الأيقونات حسب إعدادات المطور وإخفاء الموقوفة عن غير المدير. */
function arrange(items, svc) {
  return items
    .filter(t => (t[4] !== 'admin' || canManage()) && (t[4] !== 'dev' || state.manager))
    .filter(t => state.manager || svc[t[0]]?.enabled !== false)
    .map((t, i) => [t, svc[t[0]]?.sort_order ?? (100 + i)])
    .sort((a, b) => a[1] - b[1]).map(x => x[0]);
}

export async function render(el) {
  const svc = await data.serviceSettings();
  const day = Math.floor(Date.now() / 86400000);
  let hadithIndex = day % HADITH.length;
  el.innerHTML = `
    <div class="dhikr" aria-live="polite"><b>🤲</b><span data-dhikr>${esc(DHIKR[Math.floor(Date.now() / 60000) % DHIKR.length])}</span></div>
    <section class="hero">
      <div><h2>${state.user ? 'أهلًا ' + esc(state.user.name) : 'مرحبًا بكم في جيران حي الغدير'}</h2>
      <p class="muted">${state.user ? 'كل خدمات الحي في مكان واحد.' : 'تصفّح خدمات الحي وتعرّف على مجتمع يجمع الجيران على الألفة والتعاون والمساندة.'}</p></div>
      ${state.user ? '' : '<div class="hero-actions"><button class="btn primary" data-join>🌟 انضم إلى الجيران</button><button class="btn secondary" data-login>🔐 دخول الأعضاء</button></div>'}
    </section>
    <section class="card upcoming" aria-label="القادم">
      <a href="#/coffee" class="up-row"><span class="up-ic">☕</span><span class="up-k">القهوة</span><span class="up-v" data-next-coffee>…</span></a>
      <a href="#/outings" class="up-row"><span class="up-ic">🚐</span><span class="up-k">الطلعة</span><span class="up-v" data-next-outing>…</span></a>
      <a href="#/news" class="up-row"><span class="up-ic">🔔</span><span class="up-k">آخر خبر</span><span class="up-v" data-latest>…</span></a>
    </section>
    ${GROUPS.map(([g, items]) => { const vis = arrange(items, svc); if (!vis.length) return ''; return `<h3 class="group-title">${g}</h3><nav class="tiles" aria-label="${g}">${vis.map(([id, i, t, d, acc]) => `<a class="tile${svc[id]?.enabled === false ? ' off' : ''}" href="#/${id}" data-tile="${id}"><span class="tile-icon">${i}</span><b>${t}</b><small>${d}</small>${svc[id]?.enabled === false ? '<span class="lock" title="موقوفة">⏸️</span>' : !OPEN.has(id) && !state.manager && !(state.user && state.termsOk) ? '<span class="lock" title="للأعضاء">🔒</span>' : ''}</a>`).join('')}</nav>`; }).join('')}
    <div class="grid2">
      <section class="card widget" data-prayer><p class="muted">جارٍ تحميل المواقيت…</p></section>
      <section class="card widget" data-weather><p class="muted">جارٍ تحميل الطقس…</p></section>
    </div>
    <section class="card hadith"><div class="widget-head"><b>🌿 لوحة التذكير</b><span class="pill" data-h-topic></span></div>
      <p class="hadith-text" data-h-text></p><div class="hadith-foot"><a target="_blank" rel="noopener" data-h-src></a>
      <span><button class="icon-btn" data-h="-1" aria-label="السابق">›</button><button class="icon-btn" data-h="1" aria-label="التالي">‹</button></span></div></section>
    <p class="muted center">👥 ${activeMembers().length} جار نشط في البرنامج</p>`;

  $('[data-login]', el)?.addEventListener('click', () => showLogin());
  $('[data-join]', el)?.addEventListener('click', () => showJoinRequest());
  el.querySelectorAll('.tiles a.tile').forEach(tile => tile.addEventListener('click', event => {
    if (state.user && state.termsOk || state.manager) return;
    const id = tile.dataset.tile || '';
    if (['account', 'terms', 'about', 'install'].includes(id)) return;
    event.preventDefault();
    showGuestWelcome(tile.querySelector('b')?.textContent || 'خدمات الحي');
  }));

  const showHadith = () => {
    const h = HADITH[hadithIndex];
    $('[data-h-topic]', el).textContent = h.topic;
    $('[data-h-text]', el).textContent = h.text;
    const a = $('[data-h-src]', el); a.href = h.url; a.textContent = 'المصدر: ' + h.source + ' ↗';
  };
  el.querySelectorAll('[data-h]').forEach(b => b.onclick = () => { hadithIndex = (hadithIndex + Number(b.dataset.h) + HADITH.length) % HADITH.length; showHadith(); });
  showHadith();

  const dh = $('[data-dhikr]', el);
  let di = Math.floor(Date.now() / 60000) % DHIKR.length;
  const timer = setInterval(() => { if (!dh.isConnected) return clearInterval(timer); di = (di + 1) % DHIKR.length; dh.textContent = DHIKR[di]; }, 8000);

  const prayerEl = $('[data-prayer]', el);
  const loadPrayer = async coords => {
    try { renderPrayer(prayerEl, await prayerTimes(coords), coords ? 'حسب موقعك الحالي' : LOCATION.label); }
    catch { prayerEl.innerHTML = '<div class="widget-head"><b>🕌 مواقيت الصلاة</b></div><p class="muted">تعذر جلب المواقيت الآن.</p>'; }
    $('[data-locate]', prayerEl)?.addEventListener('click', () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(p => loadPrayer({ lat: p.coords.latitude.toFixed(4), lon: p.coords.longitude.toFixed(4) }), () => {}, { timeout: 12000, maximumAge: 300000 });
    });
  };
  loadPrayer();
  renderWeather($('[data-weather]', el));

  const [coffee, outings, ann] = await Promise.all([data.coffee(), data.outings(), data.announcements()]);
  const today = todayISO();
  const c = coffee.find(x => x.coffee_date >= today);
  const o = outings.find(x => x.outing_date >= today);
  const a = data.visibleAnnouncements(ann)[0];
  const short = d => new Date(d + 'T00:00:00').toLocaleDateString('ar-SA', { weekday: 'short', day: 'numeric', month: 'short' });
  $('[data-next-coffee]', el).innerHTML = c ? `<b>${esc(memberName(c.member_id))}</b> · ${short(c.coffee_date)}${c.coffee_time ? ' · ' + fmtTime(c.coffee_time) : ''}` : 'لا يوجد موعد قادم';
  $('[data-next-outing]', el).innerHTML = o ? `<b>${esc(o.outing_type || [memberName(o.member1_id), memberName(o.member2_id)].join(' + '))}</b> · ${short(o.outing_date)}${o.outing_time ? ' · ' + fmtTime(o.outing_time) : ''}` : 'لا توجد طلعة قادمة';
  $('[data-latest]', el).innerHTML = a ? `<b>${esc(a.title)}</b>` : 'لا توجد أخبار';
}
