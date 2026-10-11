/* أدوات الواجهة المشتركة: الهروب، التنسيق، الإشعارات، النوافذ. */
import { TIMEZONE } from '../config.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** يحوّل الأرقام العربية-الهندية إلى أرقام لاتينية. */
export const normalizeDigits = v => String(v ?? '').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).trim();

export const fmtDate = d => d ? new Date(String(d).slice(0, 10) + 'T00:00:00').toLocaleDateString('ar-SA', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : '—';
export const fmtTime = t => t ? String(t).slice(0, 5) : '—';
export const fmtDateTime = d => d ? new Date(d).toLocaleString('ar-SA', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
export const money = n => Number(n || 0).toLocaleString('ar-SA', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' ريال';
export const todayISO = () => new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

/** قيمة حقل داخل جذر معين (نص مقصوص). */
export const val = (root, name) => (root.querySelector(`[name="${name}"]`)?.value ?? '').trim();

let toastTimer;
export function toast(msg, ok = true) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = 'toast show ' + (ok ? 'ok' : 'bad');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast'; }, 3400);
}

/**
 * يفتح نافذة حوار. `body` نص HTML.
 * onMount(card, close) لربط الأحداث، و onClose يُستدعى مرة واحدة عند الإغلاق.
 */
export function openModal({ title, body, onMount, onClose, wide = false }) {
  const root = document.getElementById('modalRoot');
  const wrap = document.createElement('div');
  wrap.className = 'modal';
  wrap.innerHTML = `<div class="modal-card${wide ? ' wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <div class="modal-head"><h2>${esc(title)}</h2><button type="button" class="icon-btn" data-close aria-label="إغلاق">×</button></div>
    <div class="modal-body">${body}</div></div>`;
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    wrap.remove();
    document.body.classList.toggle('modal-open', !!root.children.length);
    onClose?.();
  };
  wrap.addEventListener('click', e => { if (e.target === wrap || e.target.closest('[data-close]')) close(); });
  root.appendChild(wrap);
  document.body.classList.add('modal-open');
  const card = wrap.querySelector('.modal-card');
  onMount?.(card, close);
  card.querySelector('input:not([type=hidden]),select,textarea')?.focus();
  return { el: wrap, card, close };
}

/** تأكيد بنافذة داخل التطبيق بدل confirm(). */
export function confirmBox(message, { okText = 'تأكيد', danger = true } = {}) {
  return new Promise(resolve => {
    let ok = false;
    openModal({
      title: 'تأكيد',
      body: `<p>${esc(message)}</p><div class="actions"><button class="btn ${danger ? 'danger' : 'primary'}" data-ok>${esc(okText)}</button><button class="btn secondary" data-close>إلغاء</button></div>`,
      onMount: (card, close) => { card.querySelector('[data-ok]').onclick = () => { ok = true; close(); }; },
      onClose: () => resolve(ok)
    });
  });
}

/** يطلب قيمة نصية عبر نافذة داخل التطبيق بدل prompt(). يعيد null عند الإلغاء. */
export function promptBox({ title, label, type = 'text', value = '', inputmode = '', okText = 'حفظ', required = true }) {
  return new Promise(resolve => {
    let result = null;
    openModal({
      title,
      body: `<form data-form><label>${esc(label)}</label><input name="v" type="${type}" value="${esc(value)}" ${inputmode ? `inputmode="${inputmode}"` : ''} autocomplete="off" ${required ? 'required' : ''}>
        <div class="actions"><button class="btn primary">${esc(okText)}</button><button type="button" class="btn secondary" data-close>إلغاء</button></div></form>`,
      onMount: (card, close) => {
        card.querySelector('[data-form]').onsubmit = e => { e.preventDefault(); result = card.querySelector('[name=v]').value; close(); };
      },
      onClose: () => resolve(result)
    });
  });
}

/** يعطل الزر أثناء تنفيذ عملية غير متزامنة لمنع الضغط المزدوج. */
export async function busy(btn, fn) {
  if (!btn) return fn();
  if (btn.disabled) return;
  btn.disabled = true;
  btn.classList.add('loading');
  try { return await fn(); } finally { btn.disabled = false; btn.classList.remove('loading'); }
}

export const empty = text => `<p class="empty">${esc(text)}</p>`;
export const options = (rows, labelFn, selected) => rows.map(r => `<option value="${esc(r.id)}"${String(r.id) === String(selected ?? '') ? ' selected' : ''}>${esc(labelFn(r))}</option>`).join('');
