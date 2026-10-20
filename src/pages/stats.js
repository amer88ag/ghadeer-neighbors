import { esc, fmtDateTime } from '../lib/dom.js';
import { state } from '../lib/session.js';
import { call } from '../lib/api.js';
import { GROUPS } from './home.js';

/* إحصاء شامل للمطور فقط (أعداد مجمعة). */
const SECTIONS = [
  ['members', '👥 الأعضاء', { active: 'نشطون', suspended: 'موقوفون', supervisors: 'مشرفون', seen_7d: 'دخلوا خلال 7 أيام', seen_30d: 'دخلوا خلال 30 يومًا', never_seen: 'لم يدخلوا أبدًا', terms_accepted: 'وافقوا على الشروط الحالية', remembered_devices: 'أجهزة محفوظة', pin_reset_open: 'طلبات استعادة مفتوحة' }],
  ['coffee', '☕ القهوة', { total: 'كل المواعيد', upcoming: 'القادمة', apologies: 'اعتذارات' }],
  ['outings', '🚐 الطلعات', { scheduled_total: 'المعتمدة', upcoming: 'القادمة', plans_voting: 'مقترحة قيد التصويت', plans_scheduled: 'مقترحات أُدرجت', votes: 'أصوات', ratings: 'تقييمات' }],
  ['events', '🎉 المناسبات', { total: 'الكل', upcoming: 'القادمة', cancelled: 'الملغاة', participants: 'مشاركون' }],
  ['communication', '💬 التواصل', { group_messages: 'رسائل المجموعة', group_messages_30d: 'رسائل آخر 30 يومًا', private_conversations: 'محادثات خاصة', private_messages: 'رسائل خاصة', reports: 'بلاغات', announcements: 'إعلانات ومناسبات', suggestions: 'اقتراحات' }],
  ['services', '🤝 خدمات الحي', { help_open: 'طلبات/عروض خدمات', market_open: 'سوق الحي', lost_open: 'المفقودات', initiatives: 'مبادرات', rentals_open: 'إعلانات سكن', checks_open: 'حالات تفقد مفتوحة', checks_total: 'كل حالات التفقد' }],
  ['communities', '🏘️ المجتمعات الجديدة', { pending: 'طلبات قيد المراجعة', active: 'نشطة', suspended: 'موقوفة', members: 'أعضاؤها' }]
];

export async function render(el) {
  if (!state.manager) { el.innerHTML = '<div class="card"><p>الإحصاءات للمطور فقط.</p><a class="btn secondary" href="#/manager">دخول المطور</a></div>'; return; }
  const r = await call('manager_full_stats', { p_manager_pin: state.pin });
  if (!r.ok) { el.innerHTML = `<div class="card"><p class="status bad">${esc(r.message)}</p></div>`; return; }
  const d = r.data;
  const u = await call('manager_usage_stats', { p_manager_pin: state.pin, p_days: 30 });
  el.innerHTML = `<div class="segmented"><a href="#stats-members">👥 الأعضاء</a><a href="#stats-usage">📊 الأيقونات</a><a href="#stats-totals">🔢 الأعداد</a></div>
    ${u.ok ? membersCard(u.data.members) + usageCard(u.data) : `<div class="card"><p class="status bad">${esc(u.message)}</p></div>`}
    <h3 id="stats-totals" class="tile-group">🔢 الأعداد العامة</h3>
    <p class="muted center">آخر تحديث: ${fmtDateTime(d.generated_at)}${d.services_paused ? ` · خدمات موقوفة: ${d.services_paused}` : ''}</p>` +
    SECTIONS.map(([k, title, labels]) => `<section class="card"><h3>${title}</h3><div class="stat-grid">${Object.entries(labels).map(([f, l]) =>
      `<div class="stat-box"><b>${d[k]?.[f] ?? '—'}</b><small>${l}</small></div>`).join('')}</div></section>`).join('');
  el.querySelectorAll('.segmented a').forEach(a => a.onclick = e => { e.preventDefault(); document.getElementById(a.getAttribute('href').slice(1))?.scrollIntoView({ behavior: 'smooth' }); });
  el.querySelector('[data-mfilter]')?.addEventListener('change', e => {
    const v = e.target.value;
    el.querySelectorAll('[data-mrow]').forEach(r => { r.hidden = v !== 'all' && r.dataset.mrow !== v; });
  });
}

const ago = t => {
  if (!t) return 'لم يدخل بعد';
  const m = Math.round((Date.now() - new Date(t).getTime()) / 60000);
  if (m < 60) return m <= 1 ? 'الآن' : `قبل ${m} دقيقة`;
  const h = Math.round(m / 60); if (h < 24) return `قبل ${h} ساعة`;
  const dd = Math.round(h / 24); return dd < 30 ? `قبل ${dd} يوم` : fmtDateTime(t);
};

function membersCard(rows) {
  const st = m => !m.last_seen_at ? 'never' : (Date.now() - new Date(m.last_seen_at)) < 7 * 864e5 ? 'week' : 'old';
  const n = k => rows.filter(m => st(m) === k).length;
  return `<section class="card" id="stats-members"><h3>👥 من دخل وسجّل في البرنامج</h3>
    <div class="stat-grid"><div class="stat-box"><b>${rows.length - n('never')}</b><small>دخلوا البرنامج</small></div><div class="stat-box"><b>${rows.filter(m => m.terms_at).length}</b><small>وافقوا على الشروط</small></div><div class="stat-box"><b>${n('never')}</b><small>لم يدخلوا بعد</small></div></div>
    <select data-mfilter aria-label="تصفية"><option value="all">الكل (${rows.length})</option><option value="week">دخلوا هذا الأسبوع (${n('week')})</option><option value="old">دخلوا قبل أسبوع أو أكثر (${n('old')})</option><option value="never">لم يدخلوا بعد (${n('never')})</option></select>
    <div class="list">${rows.map(m => `<div class="row-item${m.active === false ? ' inactive' : ''}" data-mrow="${st(m)}"><div class="row-main"><b>${esc(m.name)}</b>
      <small>${st(m) === 'never' ? '⚪' : st(m) === 'week' ? '🟢' : '🟡'} ${esc(ago(m.last_seen_at))}${m.terms_at ? ' · ✅ وافق على الشروط' : ''}${m.devices ? ` · 📱 ${m.devices} جهاز` : ''}${m.pages_30d ? ` · استخدم ${m.pages_30d} أيقونة` : ''}${m.has_phone ? ' · ☎️' : ''}</small></div></div>`).join('')}</div></section>`;
}

function usageCard(u) {
  const labels = new Map([['home', '🏠 الرئيسية'], ['manager', '🛠️ لوحة الإدارة'], ['stats', '📊 الإحصاءات'], ['terms', '📜 الشروط'], ['install', '📲 التثبيت'], ['prayer', '🕌 مواقيت الصلاة'], ['weather', '🌤️ الطقس']]);
  GROUPS.forEach(([, items]) => items.forEach(([id, i, t]) => labels.set(id, i + ' ' + t)));
  const label = p => labels.get(p) || labels.get(p.split('/')[0]) || p;
  const max = Math.max(1, ...u.pages.map(p => p.hits));
  const total = u.pages.reduce((a, p) => a + p.hits, 0);
  return `<section class="card" id="stats-usage"><h3>📊 استخدام الأيقونات (آخر 30 يومًا)</h3>
    <p class="muted">${total} فتحة صفحة منذ بدء التسجيل. «أعضاء» = عدد الأعضاء المختلفين الذين فتحوها.</p>
    ${u.pages.length ? `<div class="usage-bars">${u.pages.map(p => `<div class="ubar"><span class="ulabel">${esc(label(p.page))}</span><span class="utrack"><i style="width:${Math.round(p.hits / max * 100)}%"></i></span><b>${p.hits}</b><small>${p.members} عضو</small></div>`).join('')}</div>`
      : '<p class="empty">بدأ تسجيل الاستخدام الآن، وستظهر الأرقام بعد أن يستخدم الأعضاء البرنامج.</p>'}
  </section>`;
}
