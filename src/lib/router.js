/* موجّه وحيد يعتمد على العنوان (#/page). كل صفحة تملك محتواها فقط. */
import { esc } from './dom.js';

const pages = new Map();
let current = null;
let guard = null;
/** حارس اختياري: يعيد نص HTML لمنع عرض الصفحة (مثل خدمة موقوفة)، أو null للسماح. */
export const setGuard = fn => { guard = fn; };

/** تسجيل صفحة: { id, title, icon, render(el, params), nav?:boolean } */
export function register(page) {
  if (pages.has(page.id)) throw new Error('صفحة مكررة: ' + page.id);
  pages.set(page.id, page);
}
export const allPages = () => [...pages.values()];

export function go(id, params = '') {
  const hash = '#/' + id + (params ? '/' + params : '');
  if (location.hash === hash) render(); else location.hash = hash;
}

export function parse() {
  const [, id = 'home', ...rest] = (location.hash || '#/home').split('/');
  return { id: pages.has(id) ? id : 'home', params: rest.map(decodeURIComponent) };
}

export async function render() {
  const { id, params } = parse();
  const page = pages.get(id);
  const main = document.getElementById('main');
  current = id;
  document.title = page.title + ' — جيران حي الغدير';
  document.querySelectorAll('[data-nav]').forEach(b => b.classList.toggle('active', b.dataset.nav === id));
  main.innerHTML = `<div class="page-head">${id === 'home' ? '' : `<a class="back" href="#/home" aria-label="الرئيسية">→</a>`}<h1>${page.icon} ${esc(page.title)}</h1></div><div class="page-body" data-page="${id}"><div class="skeleton"></div></div>`;
  window.scrollTo({ top: 0 });
  const body = main.querySelector('.page-body');
  try {
    const blocked = guard ? await guard(id, params) : null;
    if (blocked) { if (current === id) body.innerHTML = blocked; return; }
    await page.render(body, params);
  } catch (e) {
    console.error(e);
    if (current === id) body.innerHTML = `<div class="card"><p class="status bad">تعذر عرض الصفحة: ${esc(e.message || e)}</p><button class="btn secondary" onclick="location.reload()">إعادة المحاولة</button></div>`;
  }
}

/** إعادة رسم الصفحة الحالية (بعد تغيير الدخول مثلًا). */
export const refresh = () => render();
export const currentPage = () => current;

export function start() {
  window.addEventListener('hashchange', render);
  render();
}
