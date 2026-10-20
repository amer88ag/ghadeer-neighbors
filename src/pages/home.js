import { esc, fmtTime, todayISO, $ } from '../lib/dom.js';
import { state, memberName, activeMembers, canManage } from '../lib/session.js';
import * as data from '../lib/data.js';
import { showJoinRequest, showGuestWelcome } from '../lib/join.js';
import { prayerTimes, renderPrayer, renderWeather, DHIKR, HADITH } from '../lib/widgets.js';
import { LOCATION } from '../config.js';
import { newsItems, fillTicker } from '../lib/ticker.js';
import { arrangeTiles, widgetOn } from '../lib/prefs.js';
import { compose, tileHtml } from '../lib/layout.js';

/*
 * أيقونات الرئيسية مصنفة. access: all = متاح للجميع، member = يحتاج دخول عضو للمشاركة، admin = للمدير والمشرفين فقط.
 * كل مسار هنا يجب أن يكون صفحة مسجلة في app.js (يتحقق منها scripts/check.js).
 */
export const GROUPS = [
  ['🤝 مجتمعنا', [
    ['news', '📢', 'أخبار الحي', 'الإعلانات والمناسبات', 'all'],
    ['messages', '💬', 'الرسائل', 'المجموعة والخاص', 'member'],
    ['whatsapp', '🟢', 'واتساب', 'راسل شخصًا أو مجموعة', 'member'],
    ['neighbors', '👥', 'الجيران', 'دليل الجيران', 'all'],
    ['check', '❤️', 'تفقد جارك', 'مريض • محتاج • مساعدة', 'member'],
    ['events', '🎉', 'مناسبات الحي', 'أفراح ومواساة ولقاءات', 'all'],
    ['invite', '💌', 'ادعُ جارك', 'دعوة ونشر وتثبيت', 'all']
  ]],
  ['🛠️ تعاون وخدمات', [
    ['services/help', '🤝', 'خدمات الجيران', 'اطلب أو اعرض خدمة', 'all'],
    ['services/market', '🛍️', 'سوق الحي', 'بيع وإهداء وطلب', 'all'],
    ['services/lost', '🔎', 'المفقودات', 'مفقود أو معثور عليه', 'all'],
    ['services/initiative', '💡', 'المبادرات', 'أفكار لخدمة الحي', 'all'],
    ['services/catalog', '📚', 'دليل الخدمات', 'صيانة • نقل • تعليم', 'all'],
    ['offers', '🏷️', 'عروض اليوم', 'عروض الأسواق والمحلات', 'all'],
    ['housing', '🏠', 'سكن الحي', 'عروض وطلبات الإيجار', 'all'],
    ['community', '🏘️', 'مجتمع جديد', 'أنشئ مجتمعك الخاص', 'member']
  ]],
  ['☕ لقاءات اختيارية', [
    ['coffee', '☕', 'القهوة', 'لمن يرغب بالمشاركة', 'all'],
    ['outings', '🚐', 'الطلعات', 'لمن يرغب بالمشاركة', 'all']
  ]],
  ['🕌 يومياتي', [
    ['azkar', '📿', 'الذكر', 'مسبحة وأحاديث الجوار', 'all'],
    ['links/news', '📰', 'الأخبار', 'الصحف والقنوات الإخبارية', 'all'],
    ['links/sports', '⚽', 'الرياضة', 'الدوريات والمباريات', 'all'],
    ['links', '🔗', 'روابط مفيدة', 'خدمات حكومية • وظائف • طوارئ • مساجد', 'all']
  ]],
  ['👤 حسابي', [
    ['account', '👤', 'حسابي', 'الدخول وبطاقتي', 'all'],
    ['display', '🎨', 'إعداد الشاشة', 'الحجم والترتيب والمظهر', 'all'],
    ['about', '©️', 'عن البرنامج', 'الشروط والخصوصية', 'all'],
    ['manager', '🛠️', 'لوحة الإدارة', 'للمطور والمشرفين', 'admin'],
    ['stats', '📊', 'الإحصاءات', 'إحصاء شامل للمطور', 'dev']
  ]]
];
export const DEFAULT_WELCOME = 'مجتمع يجمع جيران الحي على التواصل والتعاون والتكاتف.';
export const TILES = GROUPS.flatMap(([, items]) => items);
// أيقونات يفتحها الزائر دون تسجيل (يطابق PUBLIC في app.js).
const OPEN = new Set(['account', 'terms', 'about', 'install', 'invite', 'display']);

/** ترتيب الأيقونات حسب إعدادات المطور وإخفاء الموقوفة عن غير المدير. */
export function arrange(items, svc) {
  return items
    .filter(t => (t[4] !== 'admin' || canManage()) && (t[4] !== 'dev' || state.manager))
    .filter(t => state.manager || svc[t[0]]?.enabled !== false)
    .map((t, i) => [t, svc[t[0]]?.sort_order ?? (100 + i)])
    .sort((a, b) => a[1] - b[1]).map(x => x[0]);
}

export async function render(el) {
  const svc = await data.serviceSettings();
  const groupOf = new Map(); const meta = new Map();
  GROUPS.forEach(([g, items], gi) => arrange(items, svc).forEach(t => { groupOf.set(t[0], [g, gi]); meta.set(t[0], t); }));
  const { top } = compose(meta, (await data.appStatus().catch(() => ({}))).home_layout);
  const byTop = new Map(top.map(t => [t.kind === 'folder' ? 'folder/' + t.id : t.id, t]));
  const tiles = arrangeTiles([...byTop.keys()]).map(id => byTop.get(id));
  if (!tiles.some(t => t.id === 'display') && byTop.has('display')) tiles.push(byTop.get('display'));
  el.innerHTML = `
    <div class="ticker"${widgetOn('dhikr') ? '' : ' hidden'} aria-label="الذكر والأحاديث"><div class="ticker-track" data-ticker></div></div>
    <div class="ticker news-ticker"${widgetOn('news') ? '' : ' hidden'} aria-label="أخبار الحي"><span class="tk-label">أخبار الحي</span><div class="ticker-track" data-news-ticker></div></div>
    <section class="home-top">
      <div class="home-hello"><h2>${state.user ? 'أهلًا ' + esc(state.user.name) : 'مرحبًا بكم في جيران حي الغدير'}</h2><p class="home-tagline" data-welcome>${esc(DEFAULT_WELCOME)}</p>
        ${state.user ? '' : '<button class="btn primary small-btn" data-join>🌟 انضم إلى الجيران</button>'}</div>
      <button type="button" class="weather-badge"${widgetOn('weather') ? '' : ' hidden'} data-weather aria-label="الطقس الآن، اضغط للتفاصيل"><span data-weather-temp>…°</span></button>
    </section>
    <section class="card prayer-card"${widgetOn('prayer') ? '' : ' hidden'} data-prayer><p class="muted">جارٍ تحميل المواقيت…</p></section>
    <nav class="tiles home-tiles" aria-label="خدمات البرنامج">${tiles.map(t => { if (t.kind !== 'builtin') return tileHtml(t, 'g0 custom'); const [g, gi] = groupOf.get(t.id); return `<a class="tile g${gi}${svc[t.id]?.enabled === false ? ' off' : ''}" href="#/${t.id}" data-tile="${t.id}" title="${esc(g + ' — ' + t.desc)}"><span class="tile-icon">${t.icon}</span><b>${esc(t.title)}</b>${svc[t.id]?.enabled === false ? '<em class="off-tag">موقوفة</em>' : ''}</a>`; }).join('')}</nav>
    <section class="upcoming"${widgetOn('upcoming') ? '' : ' hidden'} aria-label="لقاءات الجيران القادمة"><span class="up-title">☕ لقاءات الجيران القادمة <small>(اختيارية)</small></span>
      <a href="#/coffee" class="up-row"><span class="up-ic">☕</span><span class="up-v" data-next-coffee>…</span></a>
      <a href="#/outings" class="up-row"><span class="up-ic">🚐</span><span class="up-v" data-next-outing>…</span></a>
    </section>
    <p class="muted center home-foot">${widgetOn('foot') ? `👥 ${activeMembers().length} جار نشط في البرنامج` : ''}</p>`;

  $('[data-join]', el)?.addEventListener('click', () => showJoinRequest());
  el.querySelectorAll('.tiles a.tile').forEach(tile => tile.addEventListener('click', event => {
    if (state.user && state.termsOk || state.manager) return;
    const id = tile.dataset.tile || '';
    if (OPEN.has(id) || id.startsWith('folder/') || tile.target === '_blank' || tile.classList.contains('custom')) return;
    event.preventDefault();
    showGuestWelcome(tile.querySelector('b')?.textContent || 'خدمات الحي');
  }));

  fillTicker($('[data-ticker]', el), [
    ...DHIKR.map(x => `<span class="tk-item">🤲 ${esc(x)}</span>`),
    ...HADITH.map(h => `<a class="tk-item tk-hadith" href="#/azkar">🌿 قال ﷺ: «${esc(h.text)}»</a>`)
  ]);
  const newsTrack = $('[data-news-ticker]', el);
  const drawNews = (src = {}) => fillTicker(newsTrack, newsItems({ ...src, memberName }).map(i => `<span class="tk-item tk-${i.kind}"${i.color ? ` style="color:${i.color}"` : ''}>${i.html}</span>`));
  drawNews();

  const prayerEl = $('[data-prayer]', el);
  prayerTimes().then(p => renderPrayer(prayerEl, p, LOCATION.label, { compact: true }))
    .catch(() => { prayerEl.innerHTML = '<p class="muted">🕌 تعذر جلب المواقيت الآن.</p>'; });
  prayerEl.addEventListener('click', e => { if (!e.target.closest('a,button')) location.hash = '#/prayer'; });
  data.appStatus().then(st => { const w = $('[data-welcome]', el); if (w && st.home_welcome) w.textContent = st.home_welcome; }).catch(() => {});
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
