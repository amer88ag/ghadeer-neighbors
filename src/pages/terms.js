import { esc } from '../lib/dom.js';
import { TERMS_TITLE, TERMS_LABEL, TERMS_SECTIONS, LAWS } from '../lib/terms.js';

/** نص الشروط كاملًا (يُستخدم في الصفحة وفي نافذة الموافقة). */
export function termsHtml() {
  return `<div class="terms"><h2>${esc(TERMS_TITLE)}</h2><p class="muted">${esc(TERMS_LABEL)}</p>
    ${TERMS_SECTIONS.map(s => `<section><h3>${esc(s.title)}</h3>${s.paras.map(p => `<p>${esc(p)}</p>`).join('')}</section>`).join('')}
    <section><h3>الأنظمة الرسمية</h3><div class="links">${LAWS.map(([n, u]) => `<a class="link-item" href="${esc(u)}" target="_blank" rel="noopener noreferrer"><b>${esc(n)}</b><span>↗</span></a>`).join('')}</div></section></div>`;
}

export async function render(el) {
  el.innerHTML = `<div class="card">${termsHtml()}</div>`;
}
