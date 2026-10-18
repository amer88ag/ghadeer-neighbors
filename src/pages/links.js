import { esc } from '../lib/dom.js';
import { NEWS, JOBS, GOV, SPORTS, REAL_ESTATE, MOSQUES, EMERGENCY, linkList } from '../lib/links.js';
import { render as renderFootball } from './football.js';

/*
 * «روابط مفيدة»: أيقونات لكل مجموعة روابط، والضغط على الأيقونة يفتح روابطها.
 * «الأخبار» و«الرياضة» أيقونتان مستقلتان في الرئيسية (#/links/news و #/links/sports).
 */
export const SECTIONS = [
  ['gov', '🏛️', 'الخدمات الحكومية', 'أبشر، نفاذ، بلدي، ناجز…', GOV],
  ['jobs', '💼', 'الوظائف', 'بوابات توظيف رسمية', JOBS],
  ['emergency', '🚨', 'أرقام الطوارئ', 'اتصال مباشر', EMERGENCY],
  ['mosques', '🕌', 'المساجد القريبة', 'على الخريطة', MOSQUES],
  ['realestate', '🏠', 'العقار', 'منصات عقارية موثوقة', REAL_ESTATE],
  ['sportlinks', '🏟️', 'روابط رياضية', 'الاتحادات والبطولات', SPORTS]
];
const NOTES = { jobs: 'لا تشارك بياناتك إلا عبر المواقع الرسمية.', emergency: 'الضغط على الرقم يتصل مباشرة.', realestate: 'تحقق دائمًا من ترخيص المعلن.' };

export async function render(el, [tab = '']) {
  if (tab === 'sports') { el.innerHTML = '<div data-roshn-dashboard></div>'; await renderFootball(el.querySelector('[data-roshn-dashboard]')); return; }
  if (tab === 'news') {
    el.innerHTML = Object.entries(NEWS).map(([g, items]) => `<details class="card"${g.includes('السعودية') ? ' open' : ''}><summary><b>${esc(g)}</b></summary>${linkList(items)}</details>`).join('')
      + '<p class="muted center">الروابط تفتح في نافذة جديدة خارج البرنامج.</p>';
    return;
  }
  const sec = SECTIONS.find(x => x[0] === tab);
  if (sec) {
    el.innerHTML = `<a class="btn secondary" href="#/links">→ كل الروابط</a><section class="card"><h3>${sec[1]} ${esc(sec[2])}</h3>${NOTES[tab] ? `<p class="muted">${NOTES[tab]}</p>` : ''}${linkList(sec[4])}</section>`;
    return;
  }
  el.innerHTML = `<nav class="tiles link-tiles" aria-label="روابط مفيدة">${SECTIONS.map(([k, i, t, d, items]) => `<a class="tile" href="#/links/${k}" data-links="${k}"><span class="tile-icon">${i}</span><b>${esc(t)}</b><small>${esc(d)} · ${items.length}</small></a>`).join('')}</nav>
    <p class="muted center">الروابط تفتح في نافذة جديدة خارج البرنامج.</p>`;
}
