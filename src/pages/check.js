import { esc, toast, busy, empty, val, options, fmtDateTime, $ } from '../lib/dom.js';
import { state, activeMembers, memberName, requirePin, creds, showLogin } from '../lib/session.js';
import { call, list } from '../lib/api.js';

const CATEGORIES = ['مريض', 'محتاج', 'فقير', 'كبير سن', 'غائب أو وحيد', 'يحتاج مساعدة عاجلة', 'زيارة وتواصل', 'تفقد عادي'];
const STATUSES = ['تم التواصل', 'تمت المساعدة', 'مغلقة'];

export async function render(el) {
  if (!state.user || state.manager) {
    el.innerHTML = `<div class="card"><p>«تفقد جارك» مساحة خاصة بالأعضاء لتسجيل حالات تحتاج زيارة أو مساعدة، بسرية.</p>${state.manager ? '<p class="muted">حالات التفقد للمدير موجودة في لوحة المدير.</p><a class="btn secondary" href="#/manager/checks">فتح لوحة المدير</a>' : '<button class="btn primary" data-login>🔐 دخول</button>'}</div>`;
    $('[data-login]', el)?.addEventListener('click', async () => { if (await showLogin()) render(el); });
    return;
  }
  el.innerHTML = `<form class="card" data-new><h3>🤍 تسجيل حالة تحتاج تفقدًا</h3>
      <label>الجار (اختياري)</label><select name="target"><option value="">— بدون تحديد —</option>${options(activeMembers().filter(m => Number(m.id) !== Number(state.user.id)), m => m.name)}</select>
      <label>نوع الحالة</label><select name="cat">${CATEGORIES.map(c => `<option>${c}</option>`).join('')}</select>
      <label>تفاصيل مختصرة (اختياري)</label><textarea name="details" maxlength="1000"></textarea>
      <label>من يرى الحالة</label><select name="vis"><option value="للمشرفين">المشرفون فقط</option><option value="لجيران الحي">جيران الحي</option></select>
      <button class="btn primary block">❤️ تسجيل الحالة</button></form>
    <div class="card"><h3>📋 الحالات المتاحة لك</h3><div data-list><p class="muted">…</p></div></div>`;

  const listEl = $('[data-list]', el);
  const load = async () => {
    if (!state.pin) { listEl.innerHTML = '<button class="btn secondary" data-pin>🔐 أدخل رقمك لعرض الحالات</button>'; $('[data-pin]', listEl).onclick = async () => { if (await requirePin()) load(); }; return; }
    const r = await list('get_neighbor_checks', creds());
    listEl.innerHTML = !r.ok ? `<p class="status bad">${esc(r.message)}</p>` : r.data.length ? `<div class="list">${r.data.map(x => `<div class="row-item col">
      <div class="row-head"><b>❤️ ${esc(x.category)}${x.target_member_id ? ' — ' + esc(memberName(x.target_member_id)) : ''}</b><span class="pill">${esc(x.status)}</span></div>
      <p>${esc(x.details || 'بدون تفاصيل')}</p><small class="muted">${fmtDateTime(x.created_at)}</small>
      <div class="actions small">${STATUSES.map(s => `<button class="small-btn" data-id="${x.id}" data-status="${s}">${s}</button>`).join('')}</div></div>`).join('')}</div>` : empty('لا توجد حالات حاليًا.');
    listEl.querySelectorAll('[data-status]').forEach(b => b.onclick = () => busy(b, async () => {
      const res = await call('update_neighbor_check_status', { ...creds(), p_id: Number(b.dataset.id), p_status: b.dataset.status });
      if (!res.ok) return toast(res.message, false);
      toast('تم التحديث.'); load();
    }));
  };
  load();

  const f = $('[data-new]', el);
  f.onsubmit = e => { e.preventDefault(); busy(f.querySelector('button'), async () => {
    if (!(await requirePin())) return;
    const r = await call('create_neighbor_check', { ...creds(), p_target_member_id: Number(val(f, 'target')) || null, p_category: val(f, 'cat'), p_details: val(f, 'details'), p_visibility: val(f, 'vis') });
    if (!r.ok) return toast(r.message, false);
    f.reset(); toast('تم تسجيل الحالة، جزاك الله خيرًا.'); load();
  }); };
}
