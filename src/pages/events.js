import { esc, fmtDate, fmtTime, toast, busy, empty, money, val, options, openModal } from '../lib/dom.js';
import { state, canManage, activeMembers, memberName } from '../lib/session.js';
import { call, list } from '../lib/api.js';
import { canDelete, deleteBtn, deleteGathering } from '../lib/gatherings.js';

/** يبني وسائط الصلاحية: المدير برقمه، والمشرف بعضويته ورقمه. */
const actor = (managerFn, supervisorFn) => state.manager
  ? [managerFn, { p_manager_pin: state.pin }]
  : [supervisorFn, { p_member_id: state.user?.id, p_pin: state.pin }];

export async function render(el) {
  const r = await list('get_neighborhood_events');
  const rows = r.data.filter(e => canManage() || e.status !== 'ملغاة');
  el.innerHTML = `
    ${!r.ok ? `<div class="card"><p class="status bad">${esc(r.message)}</p></div>` : ''}
    ${rows.length ? rows.map(e => `<article class="card"><div class="row-head"><b>🎉 ${esc(e.title)}</b><span class="pill">${e.status === 'ملغاة' ? '⛔ ملغاة' : esc(e.event_type || 'مناسبة')}</span></div>
      <div class="muted">📅 ${fmtDate(e.event_date)} ${e.event_time ? '— ⏰ ' + fmtTime(e.event_time) : ''} ${e.place ? '— 📍 ' + esc(e.place) : ''}</div>
      ${e.purpose ? `<p>${esc(e.purpose)}</p>` : ''}
      <div class="actions"><button class="small-btn" data-details="${e.id}">👥 التفاصيل والمشاركون</button>${canManage() ? `<span class="muted">الميزانية ${money(e.total_budget)}</span>` : ''}${canDelete('event', e) ? deleteBtn('event', e.id) : ''}</div></article>`).join('')
      : (r.ok ? `<div class="card">${empty('لا توجد مناسبات حاليًا.')}</div>` : '')}
    ${canManage() ? `<details class="card"><summary><b>➕ إضافة مناسبة</b></summary><form data-create>
      <label>اسم المناسبة</label><input name="title" required>
      <div class="grid2"><div><label>النوع</label><input name="type" value="تكريم"></div><div><label>المكان</label><input name="place"></div></div>
      <div class="grid2"><div><label>التاريخ</label><input name="date" type="date" required></div><div><label>الوقت</label><input name="time" type="time"></div></div>
      <label>الهدف</label><input name="purpose"><label>الميزانية (ريال)</label><input name="budget" type="number" min="0" value="0">
      <div class="grid2"><div><label>المنظم</label><select name="organizer"><option value="">—</option>${options(activeMembers(), m => m.name)}</select></div>
      <div><label>المضيف/المستقبل</label><select name="host"><option value="">—</option>${options(activeMembers(), m => m.name)}</select></div></div>
      <label>رسالة الترحيب</label><textarea name="welcome"></textarea><label>رسالة الشكر للمنظمين</label><textarea name="thanks"></textarea>
      <button class="btn primary block">إنشاء المناسبة</button></form></details>` : ''}`;

  el.querySelectorAll('[data-details]').forEach(b => b.onclick = () => details(Number(b.dataset.details)));
  el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => busy(b, async () => { if (await deleteGathering('event', b.dataset.id)) render(el); }));

  const f = el.querySelector('[data-create]');
  if (f) f.onsubmit = e => { e.preventDefault(); busy(f.querySelector('button'), async () => {
    const [fn, auth] = actor('manager_create_neighborhood_event', 'supervisor_create_neighborhood_event');
    const res = await call(fn, { ...auth, p_title: val(f, 'title'), p_event_type: val(f, 'type') || 'مناسبة', p_date: val(f, 'date'), p_time: val(f, 'time') || null, p_place: val(f, 'place'), p_purpose: val(f, 'purpose'), p_organizer_id: Number(val(f, 'organizer')) || null, p_host_id: Number(val(f, 'host')) || null, p_welcome: val(f, 'welcome'), p_thanks: val(f, 'thanks'), p_budget: Number(val(f, 'budget')) || 0 });
    if (!res.ok) return toast(res.message, false);
    toast('تم إنشاء المناسبة.'); render(el);
  }); };
}

async function details(id) {
  const r = await call('get_event_details', { p_event_id: id });
  if (!r.ok) return toast(r.message, false);
  const d = r.data || {}, ev = d.event || {};
  const parts = d.participants || [], exps = d.expenses || [];
  const manage = canManage();
  openModal({
    title: '🎉 ' + (ev.title || 'المناسبة'), wide: true,
    body: `${ev.welcome_text ? `<p>${esc(ev.welcome_text)}</p>` : ''}
      <h3>👥 المشاركون (${parts.length})</h3>${parts.length ? `<div class="list">${parts.map(p => `<div class="row-item"><div class="row-main"><b>${esc(p.member_name || memberName(p.member_id))}</b><small>${esc(p.role || 'مشارك')}</small></div>${manage ? `<div class="row-side muted">المطلوب ${money(p.amount_due)} · المدفوع ${money(p.amount_paid)}</div>` : ''}</div>`).join('')}</div>` : empty('لا يوجد مشاركون بعد.')}
      ${manage ? `<h3>💰 المصروفات</h3>${exps.length ? `<div class="list">${exps.map(x => `<div class="row-item"><div class="row-main"><b>${esc(x.category || 'مصاريف')}</b><small>${esc(x.note || '')}</small></div><div class="row-side">${money(x.amount)}</div></div>`).join('')}</div>` : empty('لا توجد مصروفات.')}
      <form data-part class="card soft"><b>تسجيل مشارك</b><select name="member">${options(activeMembers(), m => m.name)}</select>
        <div class="grid3"><input name="role" placeholder="الدور" value="مشارك"><input name="due" type="number" min="0" placeholder="المطلوب"><input name="paid" type="number" min="0" placeholder="المدفوع"></div><button class="small-btn">حفظ المشارك</button></form>
      <form data-exp class="card soft"><b>إضافة مصروف</b><div class="grid3"><input name="amount" type="number" min="0" placeholder="المبلغ" required><input name="category" placeholder="طعام/مكان/ضيافة"><input name="note" placeholder="ملاحظة"></div><button class="small-btn">إضافة المصروف</button></form>` : ''}`,
    onMount(card, close) {
      const pf = card.querySelector('[data-part]'), xf = card.querySelector('[data-exp]');
      if (pf) pf.onsubmit = e => { e.preventDefault(); busy(pf.querySelector('button'), async () => {
        const target = Number(val(pf, 'member'));
        const common = { p_event_id: id, p_role: val(pf, 'role') || 'مشارك', p_amount_due: Number(val(pf, 'due')) || 0, p_amount_paid: Number(val(pf, 'paid')) || 0 };
        const res = state.manager
          ? await call('manager_set_event_participant', { p_manager_pin: state.pin, p_member_id: target, ...common })
          : await call('supervisor_set_event_participant', { p_member_id: state.user.id, p_pin: state.pin, p_target_member_id: target, ...common });
        if (!res.ok) return toast(res.message, false);
        toast('تم حفظ المشارك.'); close(); details(id);
      }); };
      if (xf) xf.onsubmit = e => { e.preventDefault(); busy(xf.querySelector('button'), async () => {
        const common = { p_event_id: id, p_category: val(xf, 'category') || 'مصاريف', p_amount: Number(val(xf, 'amount')) || 0, p_note: val(xf, 'note') };
        const res = state.manager
          ? await call('manager_add_event_expense', { p_manager_pin: state.pin, p_member_id: null, ...common })
          : await call('supervisor_add_event_expense', { p_member_id: state.user.id, p_pin: state.pin, p_target_member_id: null, ...common });
        if (!res.ok) return toast(res.message, false);
        toast('تم تسجيل المصروف.'); close(); details(id);
      }); };
    }
  });
}
