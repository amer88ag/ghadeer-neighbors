import { esc, fmtTime, todayISO, $ } from '../lib/dom.js';
import { state, memberName, activeMembers, canManage } from '../lib/session.js';
import * as data from '../lib/data.js';
import { showJoinRequest, showGuestWelcome } from '../lib/join.js';
import { prayerTimes, renderPrayer, renderWeather, DHIKR, HADITH } from '../lib/widgets.js';
import { LOCATION } from '../config.js';
import { newsItems, fillTicker } from '../lib/ticker.js';

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
  const tiles = GROUPS.flatMap(([, items]) => arrange(items, svc));
  el.innerHTML = `
    <div class="ticker" aria-label="الذكر والأحاديث"><div class="ticker-track" data-ticker></div></div>
    <div class="ticker news-ticker" aria-label="أخبار الحي"><span class="tk-label">أخبار الحي</span><div class="ticker-track" data-news-ticker></div></div>
    <section class="home-top">
      <div class="home-hello"><h2>${state.user ? 'أهلًا ' + esc(state.user.name) : 'مرحبًا بكم في جيران حي الغدير'}</h2>
        ${state.user ? '' : '<button class="btn primary small-btn" data-join>🌟 انضم إلى الجيران</button>'}</div>
      <button type="button" class="weather-badge" data-weather aria-label="الطقس الآن، اضغط للتفاصيل"><span data-weather-temp>…°</span></button>
    </section>
    <section class="card prayer-card" data-prayer><p class="muted">جارٍ تحميل المواقيت…</p></section>
    <section class="upcoming" aria-label="القادم">
      <a href="#/coffee" class="up-row"><span class="up-ic">☕</span><span class="up-v" data-next-coffee>…</span></a>
      <a href="#/outings" class="up-row"><span class="up-ic">🚐</span><span class="up-v" data-next-outing>…</span></a>
    </section>
    <nav class="tiles home-tiles" aria-label="خدمات البرنامج">${tiles.map(([id, i, t, d]) => `<a class="tile${svc[id]?.enabled === false ? ' off' : ''}" href="#/${id}" data-tile="${id}" title="${esc(d)}"><span class="tile-icon">${i}</span><b>${esc(t)}</b>${svc[id]?.enabled === false ? '<em class="off-tag">موقوفة</em>' : ''}</a>`).join('')}</nav>
    <p class="muted center home-foot">👥 ${activeMembers().length} جار نشط في البرنامج</p>`;

  $('[data-join]', el)?.addEventListener('click', () => showJoinRequest());
  el.querySelectorAll('.tiles a.tile').forEach(tile => tile.addEventListener('click', event => {
    if (state.user && state.termsOk || state.manager) return;
    const id = tile.dataset.tile || '';
    if (['account', 'terms', 'about', 'install'].includes(id)) return;
    event.preventDefault();
    showGuestWelcome(tile.querySelector('b')?.textContent || 'خدمات الحي');
  }));

  fillTicker($('[data-ticker]', el), [
    ...DHIKR.map(x => `<span class="tk-item">🤲 ${esc(x)}</span>`),
    ...HADITH.map(h => `<a class="tk-item tk-hadith" href="#/azkar">🌿 قال ﷺ: «${esc(h.text)}»</a>`)
  ]);
  const newsTrack = $('[data-news-ticker]', el);
  const drawNews = (src = {}) => fillTicker(newsTrack, newsItems({ ...src, memberName }).map(i => `<span class="tk-item tk-${i.kind}">${i.html}</span>`));
  drawNews();

  const prayerEl = $('[data-prayer]', el);
  prayerTimes().then(p => renderPrayer(prayerEl, p, LOCATION.label, { compact: true }))
    .catch(() => { prayerEl.innerHTML = '<p class="muted">🕌 تعذر جلب المواقيت الآن.</p>'; });
  const weatherBtn = $('[data-weather]', el);
  renderWeather(weatherBtn);
  weatherBtn.addEventListener('click', () => { location.hash = '#/weather'; });

  const [coffee, outings, ann] = await Promise.all([data.coffee(), data.outings(), data.announcements()]);
  const today = todayISO();
  const c = coffee.find(x => x.coffee_date >= today);
  const o = outings.find(x => x.outing_date >= today);
  drawNews({ announcements: ann, coffee, outings });
  data.localNews().then(local => { if (newsTrack.isConnected) drawNews({ announcements: ann, coffee, outings, local }); }).catch(() => {});
  const short = d => new Date(d + 'T00:00:00').toLocaleDateString('ar-SA', { weekday: 'short', day: 'numeric', month: 'short' });
  $('[data-next-coffee]', el).innerHTML = c ? `<b>${esc(memberName(c.member_id))}</b> · ${short(c.coffee_date)}${c.coffee_time ? ' · ' + fmtTime(c.coffee_time) : ''}` : 'لا يوجد موعد قهوة قادم';
  $('[data-next-outing]', el).innerHTML = o ? `<b>${esc(o.outing_type || [memberName(o.member1_id), memberName(o.member2_id)].join(' + '))}</b> · ${short(o.outing_date)}${o.outing_time ? ' · ' + fmtTime(o.outing_time) : ''}` : 'لا توجد طلعة قادمة';
}
