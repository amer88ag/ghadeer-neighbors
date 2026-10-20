import { esc } from '../lib/dom.js';
import * as data from '../lib/data.js';
import { GROUPS, arrange } from './home.js';
import { compose, tileHtml } from '../lib/layout.js';

/* مجلد أيقونات أنشأه المطور: يعرض الأيقونات التي نقلها إليه. */
export async function render(el, [id]) {
  const [svc, st] = await Promise.all([data.serviceSettings(), data.appStatus()]);
  const meta = new Map();
  GROUPS.forEach(([, items]) => arrange(items, svc).forEach(t => meta.set(t[0], t)));
  const { byId } = compose(meta, st.home_layout);
  const f = byId.get(id);
  if (!f || f.kind !== 'folder') { el.innerHTML = '<div class="card"><p>هذا المجلد غير موجود.</p><a class="btn secondary" href="#/home">الرئيسية</a></div>'; return; }
  const items = f.items.map(i => byId.get(i)).filter(Boolean);
  el.innerHTML = `<h2 class="mgr-title">${esc(f.icon)} ${esc(f.title)}</h2>${items.length ? `<nav class="tiles link-tiles">${items.map(t => tileHtml(t)).join('')}</nav>` : '<p class="empty">المجلد فارغ.</p>'}`;
}
