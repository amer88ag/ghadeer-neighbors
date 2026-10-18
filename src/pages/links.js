import { esc } from '../lib/dom.js';
import { NEWS, JOBS, GOV, linkList } from '../lib/links.js';
import { render as renderFootball } from './football.js';

// «الأخبار» و«الرياضة» أيقونتان مستقلتان في الرئيسية؛ «روابط مفيدة» تجمع الوظائف والخدمات العامة فقط.
const TABS = [['jobs', '💼 الوظائف'], ['gov', '🏛️ خدمات عامة']];

export async function render(el, [tab = 'jobs']) {
  const tabs = tab === 'news' || tab === 'sports' ? '' : `<div class="segmented scroll">${TABS.map(([k, l]) => `<a href="#/links/${k}" class="${tab === k ? 'active' : ''}">${l}</a>`).join('')}</div>`;
  let body = '';
  if (tab === 'sports') { el.innerHTML = tabs + '<div data-roshn-dashboard></div>'; await renderFootball(el.querySelector('[data-roshn-dashboard]')); return; }
  else if (tab === 'jobs') body = `<div class="card"><p class="muted">بوابات توظيف رسمية ومنصات معروفة. لا تشارك بياناتك إلا عبر المواقع الرسمية.</p>${linkList(JOBS)}</div>`;
  else if (tab === 'gov') body = `<div class="card">${linkList(GOV)}</div>`;
  else body = Object.entries(NEWS).map(([g, items]) => `<details class="card"${g.includes('السعودية') ? ' open' : ''}><summary><b>${esc(g)}</b></summary>${linkList(items)}</details>`).join('');
  el.innerHTML = tabs + body + '<p class="muted center">الروابط تفتح في نافذة جديدة خارج البرنامج.</p>';
}
