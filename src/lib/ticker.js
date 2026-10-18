/* شريط أخبار الحي: إعلانات الإدارة، الشكر بعد القهوة والطلعة، تهاني المناسبات، الدعاء، والأخبار المحلية. */
import { esc } from './dom.js';
import { TIMEZONE } from '../config.js';

const DAY = 864e5;
const ymd = d => new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
const THANKS_TITLE = /رسالة شكر/;

export const DUA = 'اللهم احفظ خادم الحرمين الشريفين وولي عهده الأمين، ووفقهما لما تحب وترضى، واحفظ رجال قواتنا المسلحة وانصرهم، وأدم على بلادنا الأمن والأمان.';

/**
 * يبني عناصر الشريط مرتبة حسب الأهمية.
 * @returns {{kind:string, html:string}[]}
 */
export function newsItems({ announcements = [], coffee = [], outings = [], local = [], memberName = id => '', now = Date.now() }) {
  const items = [];
  const yesterday = ymd(new Date(now - DAY));

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
    if (start <= now && now < end) items.push({ kind: 'news', html: `📢 <b>${esc(a.title)}</b>${a.message ? ' — ' + esc(a.message) : ''}` });
  }

  // 3) الشكر والعرفان: طوال اليوم التالي للقهوة أو الطلعة (24 ساعة).
  for (const c of coffee) {
    if (c.coffee_date === yesterday && c.status !== 'مؤجل') items.push({ kind: 'thanks', html: `🌷 شكرًا وعرفانًا لـ <b>${esc(memberName(c.member_id))}</b> على استضافة قهوة الجيران أمس، جزاه الله خيرًا وبارك في كرمه.` });
  }
  for (const o of outings) {
    if (o.outing_date === yesterday && !['مؤجل', 'ملغاة', 'cancelled', 'postponed'].includes(o.status)) {
      items.push({ kind: 'thanks', html: `🌷 شكرًا وعرفانًا لـ <b>${esc(memberName(o.member1_id))}</b> و<b>${esc(memberName(o.member2_id))}</b> على تنظيم طلعة الجيران أمس، جزاهما الله خيرًا.` });
    }
  }

  // 4) الدعاء لولاة الأمر ورجال القوات المسلحة.
  items.push({ kind: 'dua', html: `🇸🇦 ${esc(DUA)}` });

  // 5) أخبار محلية من مصادر موثوقة.
  for (const n of local.slice(0, 10)) {
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
