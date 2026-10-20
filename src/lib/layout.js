/* تنظيم الواجهة الذي يحدده المطور للجميع: ترتيب الأيقونات، أيقونات مخصصة، ومجلدات تضم أيقونات أخرى. */
import { esc } from './dom.js';

export const EMPTY_LAYOUT = { order: [], custom: [], folders: [] };
export const clean = l => ({
  order: Array.isArray(l?.order) ? l.order.filter(x => typeof x === 'string') : [],
  custom: Array.isArray(l?.custom) ? l.custom.filter(c => c && /^c\w+$/.test(c.id)) : [],
  folders: Array.isArray(l?.folders) ? l.folders.filter(f => f && /^f\w+$/.test(f.id)).map(f => ({ ...f, items: Array.isArray(f.items) ? f.items : [] })) : []
});
export const newId = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

/** رابط الأيقونة حسب نوعها. */
export function hrefOf(t) {
  if (t.kind === 'link') return t.url;
  if (t.kind === 'page') return '#/custom/' + t.id;
  if (t.kind === 'route') return '#/' + t.route;
  if (t.kind === 'folder') return '#/folder/' + t.id;
  return '#/' + t.id;
}

/**
 * يجمع كل الأيقونات: المدمجة (بعد صلاحيات العضو وإيقاف الخدمات) + المخصصة + المجلدات.
 * @param builtins Map<id, [id, icon, title, desc, access]> بالترتيب الافتراضي
 * @returns {{ top: object[], byId: Map }} الأيقونات الظاهرة في الرئيسية (خارج المجلدات) بترتيب المطور
 */
export function compose(builtins, layoutRaw) {
  const layout = clean(layoutRaw);
  const byId = new Map();
  for (const [id, [, icon, title, desc, acc]] of builtins) byId.set(id, { id, icon, title, desc, acc, kind: 'builtin' });
  for (const c of layout.custom) byId.set(c.id, { ...c, acc: 'all' });
  for (const f of layout.folders) byId.set(f.id, { id: f.id, icon: f.icon || '📁', title: f.title || 'مجلد', desc: 'مجلد أيقونات', kind: 'folder', items: f.items.filter(i => byId.has(i) || builtins.has(i)), acc: 'all' });
  const inFolder = new Set(layout.folders.flatMap(f => f.items));
  const pos = new Map(layout.order.map((id, i) => [id, i]));
  const ids = [...byId.keys()].filter(id => !inFolder.has(id));
  const top = ids.map((id, i) => [id, pos.has(id) ? pos.get(id) : 1000 + i]).sort((a, b) => a[1] - b[1]).map(([id]) => byId.get(id));
  return { top, byId, layout };
}

export function tileHtml(t, cls = '') {
  const href = hrefOf(t), ext = t.kind === 'link';
  return `<a class="tile ${cls}" href="${esc(href)}"${ext ? ' target="_blank" rel="noopener"' : ''} data-tile="${esc(t.kind === 'builtin' ? t.id : (t.kind === 'folder' ? 'folder/' + t.id : t.id))}" title="${esc(t.desc || '')}"><span class="tile-icon">${esc(t.icon || '⭐')}</span><b>${esc(t.title)}</b></a>`;
}
