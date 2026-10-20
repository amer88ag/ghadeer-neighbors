import { esc, empty, fmtDateTime, todayISO } from '../lib/dom.js';
import { calendarHtml, isSuspension } from '../lib/school.js';
import * as data from '../lib/data.js';
import { isSchoolNews } from '../lib/ticker.js';

/** بطاقة خبر محلي من مصدر موثوق (يفتح المصدر في نافذة جديدة). */
const localRow = n => `<a class="row-item col" href="${esc(n.link)}" target="_blank" rel="noopener">
  <b>${isSchoolNews(n.title) ? '📚 ' : '📰 '}${esc(n.title)}</b><small class="muted">${esc(n.source)}${n.date ? ' · ' + fmtDateTime(n.date) : ''}</small></a>`;

/** أخبار الحي: الإعلانات ورسائل المناسبات من الإدارة، وأخبار الدراسة والإجازات والأخبار المحلية (للجميع). */
export async function render(el, [tab = 'all']) {
  const [ann, local] = await Promise.all([
    data.announcements(true),
    data.localNews().catch(() => [])
  ]);
  const rows = data.visibleAnnouncements(ann);
  const news = (local || []).filter(n => n && n.title && n.link && n.source);
  const school = news.filter(n => isSchoolNews(n.title));
  const tabs = [['all', 'الكل'], ['school', '📚 الدراسة والإجازات'], ['notices', '🔔 الإعلانات'], ['local', '📰 أخبار المنطقة']];
  // تهاني المناسبات الدينية والوطنية تظهر ضمن الكل والإعلانات (مناسبات الجيران لها أيقونتها المستقلة).
  const annList = rows;
  const annHtml = annList.length ? `<div class="list">${annList.map(a => `<article class="row-item col">
      <div class="row-head"><b>${a.is_occasion ? (a.occasion_type === 'وطنية' ? '🇸🇦 ' : '🕌 ') : '🔔 '}${esc(a.title)}</b>${a.is_occasion ? `<span class="pill">${esc(a.occasion_type || 'مناسبة')}</span>` : ''}</div>
      <p>${esc(a.message || '')}</p><small class="muted">${esc(a.sender_name || 'إدارة الحي')} · ${fmtDateTime(a.scheduled_at || a.created_at)}</small></article>`).join('')}</div>` : empty('لا توجد أخبار أو إعلانات منشورة حاليًا.');
  const schoolHtml = school.length ? `<div class="list">${school.map(localRow).join('')}</div>` : empty('لا توجد أخبار دراسة أو إجازات خلال الأيام الثلاثة الماضية.');
  const localHtml = news.length ? `<div class="list">${news.map(localRow).join('')}</div>` : empty('تعذر جلب أخبار المنطقة الآن.');
  let body;
  if (tab === 'school') {
    const stop = school.filter(n => isSuspension(n.title));
    body = `<div class="card school-alert${stop.length ? ' on' : ''}"><h3>⛔ تعليق الدراسة</h3>${stop.length
      ? `<div class="list">${stop.map(localRow).join('')}</div>`
      : '<p class="muted">لا يوجد إعلان عن تعليق الدراسة في عسير خلال الأيام الثلاثة الماضية. الدراسة حضورية كالمعتاد.</p>'}</div>
      ${calendarHtml(todayISO())}
      <div class="card"><h3>📰 أخبار الدراسة والإجازات</h3>${schoolHtml}</div>`;
  }
  else if (tab === 'local') body = `<div class="card">${localHtml}</div>`;
  else if (tab === 'all') body = `${school.length ? `<div class="card"><h3>📚 الدراسة والإجازات</h3>${schoolHtml}</div>` : ''}<div class="card"><h3>🔔 الإعلانات والتهاني</h3>${annHtml}</div>`;
  else body = `<div class="card">${annHtml}</div>`;
  el.innerHTML = `<div class="segmented scroll">${tabs.map(([k, t]) => `<a href="#/news${k === 'all' ? '' : '/' + k}" class="${tab === k ? 'active' : ''}">${t}</a>`).join('')}</div>
    ${body}<p class="muted center"><small>أخبار الدراسة والمنطقة من مصادر سعودية موثوقة (واس، عكاظ، الرياض…) وتُحدّث كل نصف ساعة.</small></p>`;
}
