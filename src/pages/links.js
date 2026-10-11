import { esc } from '../lib/dom.js';
import { NEWS, SPORTS, JOBS, GOV, linkList } from '../lib/links.js';

const TABS = [['news', '📰 الأخبار'], ['sports', '⚽ الرياضة'], ['jobs', '💼 الوظائف'], ['gov', '🏛️ خدمات عامة']];

export async function render(el, [tab = 'news']) {
  const tabs = `<div class="segmented scroll">${TABS.map(([k, l]) => `<a href="#/links/${k}" class="${tab === k ? 'active' : ''}">${l}</a>`).join('')}</div>`;
  let body = '';
  if (tab === 'sports') body = `<div class="card"><p class="muted">المصادر الرسمية للمباريات والنتائج والترتيب.</p>${linkList(SPORTS)}</div>`;
  else if (tab === 'jobs') body = `<div class="card"><p class="muted">بوابات توظيف رسمية ومنصات معروفة. لا تشارك بياناتك إلا عبر المواقع الرسمية.</p>${linkList(JOBS)}</div>`;
  else if (tab === 'gov') body = `<div class="card">${linkList(GOV)}</div>`;
  else body = Object.entries(NEWS).map(([g, items]) => `<details class="card"${g.includes('السعودية') ? ' open' : ''}><summary><b>${esc(g)}</b></summary>${linkList(items)}</details>`).join('');
  el.innerHTML = tabs + body + '<p class="muted center">الروابط تفتح في نافذة جديدة خارج البرنامج.</p>';
}
