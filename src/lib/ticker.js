/* شريط أخبار الحي: إعلانات الإدارة، الشكر بعد القهوة والطلعة، تهاني المناسبات، الدعاء، والأخبار المحلية. */
import { esc } from './dom.js';

const DAY = 864e5;
const THANKS_TITLE = /رسالة شكر/;

export const DUA = 'اللهم احفظ خادم الحرمين الشريفين وولي عهده الأمين، ووفقهما لما تحب وترضى، واحفظ رجال قواتنا المسلحة وانصرهم، وأدم على بلادنا الأمن والأمان.';

/**
 * يبني عناصر الشريط مرتبة حسب الأهمية.
 * @returns {{kind:string, html:string}[]}
 */
export function newsItems({ announcements = [], coffee = [], outings = [], local = [], memberName = id => '', now = Date.now() }) {
  const items = [];

  // 1) تهاني المناسبات الدينية والوطنية: 24 ساعة من وقت المناسبة.
  for (const a of announcements) {
    if (!a.is_occasion) continue;
    const at = new Date(a.scheduled_at || a.created_at).getTime();
    if (at <= now && now < at + DAY) items.push({ kind: 'occasion', html: `🎉 <b>${esc(a.title)}</b>${a.message ? ' — ' + esc(a.message) : ''}` });
  }

  // 2) إعلانات الإدارة والمشرفين في فترتها المحددة؛ والإعلانات العامة القديمة (بلا فترة) ليومين من نشرها.
  for (const a of announcements) {
    if (a.is_occasion || THANKS_TITLE.test(a.title || '')) continue;
    const start = new Date(a.scheduled_at || a.created_at).getTime();
    const end = a.expires_at ? new Date(a.expires_at).getTime() : start + 2 * DAY;
    const color = /^#[0-9a-f]{6}$/i.test(a.ticker_color || '') ? a.ticker_color : '';
    if (start <= now && now < end) items.push({ kind: 'news', color, html: `📢 <b>${esc(a.title)}</b>${a.message ? ' — ' + esc(a.message) : ''}` });
  }

  // 3) الشكر والعرفان: يبدأ تلقائيًا بعد موعد القهوة أو الطلعة ويستمر 24 ساعة.
  //    إن لم يُحدد وقت للموعد يُعدّ بعد صلاة العشاء (9 مساءً بتوقيت الرياض).
  const after = (date, time) => Date.parse(`${date}T${String(time || '21:00').slice(0, 5)}:00+03:00`);
  const active = start => start <= now && now < start + DAY;
  for (const c of coffee) {
    if (c.status !== 'مؤجل' && active(after(c.coffee_date, c.coffee_time))) items.unshift({ kind: 'thanks', html: `🌹 شكرًا وعرفانًا لـ <b>${esc(memberName(c.member_id))}</b> على استضافة قهوة الجيران، جزاه الله خيرًا وبارك في كرمه.` });
  }
  for (const o of outings) {
    if (!['مؤجل', 'ملغاة', 'cancelled', 'postponed'].includes(o.status) && active(after(o.outing_date, o.outing_time))) {
      items.unshift({ kind: 'thanks', html: `🌹 شكرًا وعرفانًا لـ <b>${esc(memberName(o.member1_id))}</b> و<b>${esc(memberName(o.member2_id))}</b> على تنظيم طلعة الجيران، جزاهما الله خيرًا.` });
    }
  }

  // 4) الدعاء لولاة الأمر ورجال القوات المسلحة.
  items.push({ kind: 'dua', html: `🇸🇦 ${esc(DUA)}` });

  // 5) أخبار محلية من مصادر موثوقة.
  for (const n of local.filter(x => x.source && x.link).slice(0, 10)) {
    items.push({ kind: 'local', html: `<a href="${esc(n.link)}" target="_blank" rel="noopener">📰 ${esc(n.title)}</a> <small>(${esc(n.source)})</small>` });
  }
  return items;
}

/** يملأ شريطًا متحركًا بعناصر HTML ويضبط سرعته حسب طوله. */
export function fillTicker(track, htmlItems) {
  const items = htmlItems.join('<span class="tk-sep">✦</span>') + '<span class="tk-sep">✦</span>';
  track.innerHTML = `<span class="tk-run">${items}</span><span class="tk-run" aria-hidden="true">${items}</span>`;
  requestAnimationFrame(() => { const w = track.firstElementChild?.offsetWidth || 0; track.style.animationDuration = Math.max(25, Math.round(w / 45)) + 's'; });
}
