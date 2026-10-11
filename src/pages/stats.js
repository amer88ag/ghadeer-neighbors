import { esc, fmtDateTime } from '../lib/dom.js';
import { state } from '../lib/session.js';
import { call } from '../lib/api.js';

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
  el.innerHTML = `<p class="muted center">آخر تحديث: ${fmtDateTime(d.generated_at)}${d.services_paused ? ` · خدمات موقوفة: ${d.services_paused}` : ''}</p>` +
    SECTIONS.map(([k, title, labels]) => `<section class="card"><h3>${title}</h3><div class="stat-grid">${Object.entries(labels).map(([f, l]) =>
      `<div class="stat-box"><b>${d[k]?.[f] ?? '—'}</b><small>${l}</small></div>`).join('')}</div></section>`).join('') +
    `<p class="muted center">لتفاصيل نشاط كل عضو: لوحة الإدارة ← التقارير والنسخ.</p>`;
}
