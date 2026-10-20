import { esc } from '../lib/dom.js';
import * as data from '../lib/data.js';
import { clean } from '../lib/layout.js';

/* صفحة نصية أنشأها المطور من «تنظيم الواجهة». */
export async function render(el, [id]) {
  const c = clean((await data.appStatus()).home_layout).custom.find(x => x.id === id);
  if (!c) { el.innerHTML = '<div class="card"><p>هذه الصفحة غير موجودة.</p><a class="btn secondary" href="#/home">الرئيسية</a></div>'; return; }
  el.innerHTML = `<section class="card"><h3>${esc(c.icon || '⭐')} ${esc(c.title)}</h3>${c.desc ? `<p class="muted">${esc(c.desc)}</p>` : ''}
    <div class="custom-content">${esc(c.content || '').replace(/\n/g, '<br>')}</div>
    ${c.url ? `<a class="btn primary block" href="${esc(c.url)}" target="_blank" rel="noopener">فتح الرابط ↗</a>` : ''}</section>`;
}
