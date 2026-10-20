/*
 * التقويم الدراسي 1448هـ (2026–2027م) للتعليم العام — منطقة عسير ضمن «بقية إدارات التعليم» (أربع إجازات إضافية).
 * المصدر: وزارة التعليم (moe.gov.sa) كما نقلته الصحف السعودية. إجازتا العيدين تقديريتان وتتبعان رؤية الهلال.
 * from = أول يوم إجازة، to = آخر يوم إجازة (العودة في اليوم التالي). عند تعديل الوزارة للتقويم يُحدَّث هذا الملف فقط.
 */
import { esc } from './dom.js';

export const SCHOOL_YEAR = '1448هـ (2026–2027م)';
export const CALENDAR = [
  { from: '2026-08-23', title: 'بداية العام الدراسي', icon: '🎒', kind: 'start' },
  { from: '2026-09-23', to: '2026-09-26', title: 'إجازة اليوم الوطني 96', icon: '🇸🇦' },
  { from: '2026-10-25', to: '2026-10-25', title: 'الإجازة الإضافية الأولى', icon: '📅', note: 'تمتد مع نهاية الأسبوع' },
  { from: '2026-11-20', to: '2026-11-29', title: 'إجازة الخريف + الإجازة الإضافية الثانية', icon: '🍂' },
  { from: '2027-01-07', to: '2027-01-16', title: 'إجازة منتصف العام + الإجازة الإضافية الثالثة', icon: '🏖️', note: 'بعدها يبدأ الفصل الدراسي الثاني' },
  { from: '2027-02-19', to: '2027-02-22', title: 'إجازة يوم التأسيس', icon: '🏰' },
  { from: '2027-02-26', to: '2027-03-13', title: 'إجازة عيد الفطر', icon: '🌙', note: 'تقديرية حسب رؤية الهلال' },
  { from: '2027-04-11', to: '2027-04-11', title: 'الإجازة الإضافية الرابعة', icon: '📅', note: 'تمتد مع نهاية الأسبوع' },
  { from: '2027-05-07', to: '2027-05-22', title: 'إجازة عيد الأضحى', icon: '🐑', note: 'تقديرية حسب رؤية الهلال' },
  { from: '2027-06-24', title: 'بداية إجازة نهاية العام (الصيفية)', icon: '☀️', kind: 'end' },
  { from: '2027-08-22', title: 'بداية العام الدراسي القادم 1449هـ', icon: '🎒', kind: 'start' }
];

/** تعليق الدراسة أو تحويلها عن بعد (أخبار الطوارئ والأمطار). */
export const isSuspension = t => /تعليق الدراسة|تعليق الحضور|عن بعد|عن بُعد|منصة مدرستي|الدراسة الحضورية/.test(String(t || ''));

const DAY = 864e5;
const at = iso => new Date(iso + 'T00:00:00+03:00').getTime();
const dayAfter = iso => new Date(Date.parse(iso + 'T00:00:00Z') + DAY).toISOString().slice(0, 10);
const greg = iso => new Date(iso + 'T12:00:00+03:00').toLocaleDateString('ar-SA-u-ca-gregory', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const hijri = iso => new Date(iso + 'T12:00:00+03:00').toLocaleDateString('ar-SA-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' });
const days = (a, b) => Math.round((at(b) - at(a)) / DAY) + 1;

/** الحالة الآن: إجازة جارية، أو الإجازة القادمة وعدد الأيام المتبقية. */
export function schoolStatus(today) {
  const holidays = CALENDAR.filter(e => e.to);
  const current = holidays.find(e => e.from <= today && today <= e.to);
  const next = holidays.find(e => e.from > today) || CALENDAR.find(e => e.kind === 'end' && e.from > today);
  return { current, next, inDays: next ? Math.round((at(next.from) - at(today)) / DAY) : null };
}

/** سطر للشريط: الإجازة الجارية، أو القادمة خلال أسبوع. */
export function tickerLine(today) {
  const { current, next, inDays } = schoolStatus(today);
  if (current) return `🏫 ${esc(current.title)} — العودة ${esc(greg(dayAfter(current.to)))}`;
  if (next && inDays <= 7) return `🏫 ${esc(next.title)} ${inDays === 1 ? 'غدًا' : `بعد ${inDays} أيام`} (${esc(greg(next.from))})`;
  return '';
}

/** بطاقة الحالة الحالية + جدول التقويم كاملًا. */
export function calendarHtml(today) {
  const { current, next, inDays } = schoolStatus(today);
  const hero = current
    ? `<div class="school-now on"><b>🎉 ${esc(current.title)}</b><span>العودة للدراسة: ${esc(greg(dayAfter(current.to)))}</span></div>`
    : next ? `<div class="school-now"><small>الإجازة القادمة</small><b>${next.icon} ${esc(next.title)}</b>
        <span>${inDays === 0 ? 'اليوم' : inDays === 1 ? 'غدًا' : `بعد <em>${inDays}</em> يومًا`} — ${esc(greg(next.from))}</span></div>` : '';
  const rows = CALENDAR.map(e => {
    const done = (e.to || e.from) < today, now = e.to && e.from <= today && today <= e.to;
    const range = e.to ? (e.to === e.from ? greg(e.from) : `من ${greg(e.from)}<br>إلى ${greg(e.to)}`) : greg(e.from);
    const extra = e.to ? `${days(e.from, e.to) > 1 ? `${days(e.from, e.to)} أيام · ` : ''}العودة ${greg(dayAfter(e.to))}` : '';
    return `<div class="row-item col school-row${done ? ' done' : ''}${now ? ' now' : ''}">
      <div class="row-head"><b>${e.icon} ${esc(e.title)}</b>${now ? '<span class="pill">الآن</span>' : done ? '<span class="pill muted-pill">انتهت</span>' : ''}</div>
      <small class="school-date">${range}</small><small class="muted school-date">${esc(hijri(e.from))}${extra ? ' · ' + extra : ''}${e.note ? ' · ' + esc(e.note) : ''}</small></div>`;
  }).join('');
  return `${hero}<div class="card"><h3>📅 التقويم الدراسي ${SCHOOL_YEAR}</h3><div class="list">${rows}</div>
    <p class="muted"><small>تقويم وزارة التعليم لمنطقة عسير (أربع إجازات إضافية). إجازتا العيدين تقديريتان حسب رؤية الهلال، ويُعتمد ما تعلنه الوزارة وتعليم عسير.</small></p></div>`;
}
