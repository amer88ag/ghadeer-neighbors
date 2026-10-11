import { esc, empty, fmtDateTime } from '../lib/dom.js';
import * as data from '../lib/data.js';

/** أخبار الحي: الإعلانات ورسائل المناسبات المنشورة من الإدارة (للجميع). */
export async function render(el, [tab = 'all']) {
  const rows = data.visibleAnnouncements(await data.announcements(true));
  const list = tab === 'occasions' ? rows.filter(a => a.is_occasion) : tab === 'notices' ? rows.filter(a => !a.is_occasion) : rows;
  el.innerHTML = `<div class="segmented"><a href="#/news" class="${tab === 'all' ? 'active' : ''}">الكل</a><a href="#/news/notices" class="${tab === 'notices' ? 'active' : ''}">🔔 الإعلانات</a><a href="#/news/occasions" class="${tab === 'occasions' ? 'active' : ''}">🎉 المناسبات</a></div>
    <div class="card">${list.length ? `<div class="list">${list.map(a => `<article class="row-item col">
      <div class="row-head"><b>${a.is_occasion ? (a.occasion_type === 'وطنية' ? '🇸🇦 ' : '🕌 ') : '🔔 '}${esc(a.title)}</b>${a.is_occasion ? `<span class="pill">${esc(a.occasion_type || 'مناسبة')}</span>` : ''}</div>
      <p>${esc(a.message || '')}</p><small class="muted">${esc(a.sender_name || 'إدارة الحي')} · ${fmtDateTime(a.scheduled_at || a.created_at)}</small></article>`).join('')}</div>` : empty('لا توجد أخبار أو إعلانات منشورة حاليًا.')}</div>`;
}
