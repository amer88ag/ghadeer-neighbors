import { esc, fmtDate, fmtTime, todayISO, $ } from '../lib/dom.js';
import { state, memberName, activeMembers, showLogin } from '../lib/session.js';
import * as data from '../lib/data.js';
import { prayerTimes, renderPrayer, renderWeather, DHIKR, HADITH } from '../lib/widgets.js';
import { LOCATION } from '../config.js';

export const TILES = [
  ['coffee', '☕', 'القهوة', 'الجدول والاعتذار'],
  ['outings', '🚐', 'الطلعات', 'التصويت والجدول'],
  ['events', '🎉', 'مناسبات الحي', 'المناسبات والمشاركون'],
  ['neighbors', '👥', 'الجيران', 'الدليل وبطاقتي'],
  ['messages', '💬', 'الرسائل', 'المجموعة والخاص'],
  ['check', '❤️', 'تفقد جارك', 'مريض • محتاج • مساعدة'],
  ['services', '🤝', 'خدمات الحي', 'طلب وعرض الخدمات'],
  ['housing', '🏠', 'سكن الحي', 'عروض وطلبات الإيجار'],
  ['links', '🔗', 'روابط مفيدة', 'أخبار • رياضة • وظائف']
];

export async function render(el) {
  const day = Math.floor(Date.now() / 86400000);
  let hadithIndex = day % HADITH.length;
  el.innerHTML = `
    <div class="dhikr" aria-live="polite"><b>🤲</b><span data-dhikr>${esc(DHIKR[Math.floor(Date.now() / 60000) % DHIKR.length])}</span></div>
    <section class="hero">
      <div><h2>${state.user ? 'أهلًا ' + esc(state.user.name) : 'مرحبًا بكم في جيران حي الغدير'}</h2>
      <p class="muted">${state.user ? 'كل خدمات الحي في مكان واحد.' : 'سجّل الدخول للمشاركة في القهوة والطلعات والرسائل.'}</p></div>
      ${state.user ? '' : '<button class="btn primary" data-login>🔐 دخول الأعضاء</button>'}
    </section>
    <div class="grid3 summary">
      <a class="card stat-card" href="#/coffee"><small>☕ القهوة القادمة</small><div data-next-coffee class="muted">…</div></a>
      <a class="card stat-card" href="#/outings"><small>🚐 الطلعة القادمة</small><div data-next-outing class="muted">…</div></a>
      <a class="card stat-card" href="#/messages"><small>🔔 آخر إعلان</small><div data-latest class="muted">…</div></a>
    </div>
    <nav class="tiles" aria-label="الخدمات">${TILES.map(([id, i, t, d]) => `<a class="tile" href="#/${id}"><span class="tile-icon">${i}</span><b>${t}</b><small>${d}</small></a>`).join('')}</nav>
    <div class="grid2">
      <section class="card widget" data-prayer><p class="muted">جارٍ تحميل المواقيت…</p></section>
      <section class="card widget" data-weather><p class="muted">جارٍ تحميل الطقس…</p></section>
    </div>
    <section class="card hadith"><div class="widget-head"><b>🌿 لوحة التذكير</b><span class="pill" data-h-topic></span></div>
      <p class="hadith-text" data-h-text></p><div class="hadith-foot"><a target="_blank" rel="noopener" data-h-src></a>
      <span><button class="icon-btn" data-h="-1" aria-label="السابق">›</button><button class="icon-btn" data-h="1" aria-label="التالي">‹</button></span></div></section>
    <p class="muted center">${activeMembers().length} جار نشط في البرنامج</p>`;

  $('[data-login]', el)?.addEventListener('click', () => showLogin());

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
  $('[data-next-coffee]', el).innerHTML = c ? `<b>${esc(memberName(c.member_id))}</b><br>${fmtDate(c.coffee_date)} — ${fmtTime(c.coffee_time)}` : 'لا يوجد موعد قادم';
  $('[data-next-outing]', el).innerHTML = o ? `<b>${esc(o.outing_type || [memberName(o.member1_id), memberName(o.member2_id)].join(' + '))}</b><br>${fmtDate(o.outing_date)} — ${fmtTime(o.outing_time)}` : 'لا توجد طلعة قادمة';
  $('[data-latest]', el).innerHTML = a ? `<b>${esc(a.title)}</b><br>${esc(String(a.message || '').slice(0, 110))}` : 'لا توجد إعلانات';
}
