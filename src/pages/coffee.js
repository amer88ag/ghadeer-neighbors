import { esc, fmtDate, fmtTime, todayISO, toast, busy, empty, confirmBox } from '../lib/dom.js';
import { state, memberName, requirePin, creds } from '../lib/session.js';
import { call } from '../lib/api.js';
import * as data from '../lib/data.js';

export async function render(el, [mode = 'upcoming']) {
  const rows = await data.coffee();
  const today = todayISO();
  const list = mode === 'all' ? rows : rows.filter(x => x.coffee_date >= today);
  const mine = id => state.user && Number(id) === Number(state.user.id);
  el.innerHTML = `
    <div class="segmented"><a href="#/coffee" class="${mode !== 'all' ? 'active' : ''}">القادمة</a><a href="#/coffee/all" class="${mode === 'all' ? 'active' : ''}">كل المواعيد</a></div>
    <div class="card">${list.length ? `<div class="list">${list.map(x => `
      <div class="row-item${mine(x.member_id) ? ' mine' : ''}">
        <div class="row-main"><b>${esc(memberName(x.member_id))}</b><span class="muted">${fmtDate(x.coffee_date)} — ${fmtTime(x.coffee_time)}${x.hijri_date ? ' — ' + esc(x.hijri_date) : ''}</span>${x.notes ? `<small>${esc(x.notes)}</small>` : ''}</div>
        <div class="row-side"><span class="pill">${esc(x.status || 'مجدول')}</span>
        ${mine(x.member_id) && x.coffee_date >= today ? `<button class="small-btn" data-apology="${x.id}">اعتذار</button><button class="small-btn ghost" data-undo="${x.id}">إلغاء الاعتذار</button>` : ''}</div>
      </div>`).join('')}</div>` : empty('لا توجد مواعيد.')}</div>
    <p class="muted center">${state.user ? 'يظهر زر الاعتذار على مواعيدك فقط.' : 'سجّل الدخول لإدارة اعتذارك عن موعدك.'}</p>`;

  el.querySelectorAll('[data-apology],[data-undo]').forEach(b => b.onclick = () => busy(b, async () => {
    const undo = 'undo' in b.dataset;
    if (!undo && !(await confirmBox('تأكيد الاعتذار عن موعد القهوة؟', { okText: 'اعتذار' }))) return;
    if (!(await requirePin())) return;
    const r = await call(undo ? 'member_undo_apologize_coffee' : 'member_apologize_coffee', { p_id: Number(b.dataset.apology || b.dataset.undo), ...creds() });
    if (!r.ok) return toast(r.message, false);
    toast(undo ? 'تم إلغاء الاعتذار.' : 'تم تسجيل الاعتذار.');
    data.invalidate('coffee'); render(el, [mode]);
  }));
}
