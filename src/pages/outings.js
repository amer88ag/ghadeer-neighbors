import { esc, fmtDate, fmtTime, todayISO, toast, busy, empty, money, val } from '../lib/dom.js';
import { state, memberName, requirePin, creds } from '../lib/session.js';
import { call } from '../lib/api.js';
import * as data from '../lib/data.js';
import { canDelete, deleteBtn, deleteGathering } from '../lib/gatherings.js';

const STATUS = { voting: '🗳️ تصويت', awaiting_approval: '⏳ بانتظار الاعتماد', scheduled: '✅ مدرجة', rejected: '⛔ مرفوضة' };
const RATINGS = [['place', 'المكان', 'place_rating'], ['food', 'الأكل', 'food_rating'], ['time', 'الوقت', 'time_rating'], ['cost', 'التكلفة', 'cost_rating'], ['organization', 'التنظيم', 'organization_rating'], ['cleanliness', 'النظافة', 'cleanliness_rating']];

function planCard(p) {
  const org = (p.organizers || []).map(o => esc(o.member_name)).join('، ');
  const isOrganizer = state.user && (p.organizers || []).some(o => Number(o.member_id) === Number(state.user.id));
  const r = p.my_rating || {};
  return `<article class="card plan">
    <div class="row-head"><b>🚐 ${esc(p.outing_type)}</b><span class="pill">${STATUS[p.status] || '🔧 تنظيم'}</span></div>
    <div class="muted">📍 ${esc(p.outing_place)} — 📅 ${fmtDate(p.outing_date)} — ⏰ ${fmtTime(p.outing_time)}</div>
    <div class="facts"><span>🙋 المشاركون <b>${p.attending_count || 0}</b></span><span>💰 الإجمالي <b>${money(p.total_expense)}</b></span><span>👤 للفرد <b>${money(p.per_person_cost)}</b></span></div>
    ${org ? `<div class="muted">🎲 المنظمون: ${org}</div>` : ''}
    ${p.status !== 'scheduled' && p.status !== 'rejected' ? `<div class="actions">
      <button class="small-btn${p.my_vote === 'attending' ? ' on' : ''}" data-vote="attending" data-plan="${p.id}">${p.my_vote === 'attending' ? '✅ مسجّل: سأطلع' : '🙋 سأطلع'}</button>
      <button class="small-btn ghost${p.my_vote === 'not_attending' ? ' on' : ''}" data-vote="not_attending" data-plan="${p.id}">${p.my_vote === 'not_attending' ? '🚫 معتذر' : 'لن أطلع'}</button></div>` : ''}
    ${canDelete('plan', p) ? `<div class="actions end">${deleteBtn('plan', p.id)}</div>` : ''}
    ${isOrganizer ? `<form class="inline-form" data-expense="${p.id}"><input name="amount" type="number" min="0" step="0.01" placeholder="مبلغ دفعته" required><input name="note" placeholder="ملاحظة (اختياري)"><button class="small-btn">💰 إضافة مصروف</button></form>` : ''}
    ${p.status === 'scheduled' && state.user && !state.manager ? `<details><summary>⭐ تقييم الطلعة (${p.rating_count || 0} تقييم — متوسط ${esc(p.rating_average || '0')})</summary>
      <form data-rate="${p.id}"><div class="rate-grid">${RATINGS.map(([k, label, key]) => `<label>${label}<select name="${k}">${[5, 4, 3, 2, 1].map(n => `<option value="${n}"${Number(r[key] || 5) === n ? ' selected' : ''}>${'⭐'.repeat(n)}</option>`).join('')}</select></label>`).join('')}</div>
      <textarea name="comment" placeholder="ملاحظة اختيارية">${esc(r.comment || '')}</textarea><button class="small-btn">💾 حفظ التقييم</button></form></details>` : ''}
    ${(p.assignments || []).length ? `<details><summary>توزيع المشاركين (${p.assignments.length})</summary><div class="muted">${p.assignments.map(a => esc(a.member_name) + ' ← ' + esc(memberName(a.organizer_id))).join('<br>')}</div></details>` : ''}
  </article>`;
}

export async function render(el, [tab = 'plans']) {
  const tabs = `<div class="segmented"><a href="#/outings" class="${tab === 'plans' ? 'active' : ''}">🗳️ المطروحة</a><a href="#/outings/schedule" class="${tab === 'schedule' ? 'active' : ''}">📅 الجدول</a><a href="#/outings/new" class="${tab === 'new' ? 'active' : ''}">➕ اقتراح طلعة</a></div>`;

  if (tab === 'new') {
    el.innerHTML = tabs + `<form class="card" data-new>
      <label>نوع الطلعة</label><input name="type" placeholder="مثال: عشاء، رحلة برية" required>
      <label>المكان</label><input name="place" required>
      <div class="grid2"><div><label>التاريخ</label><input name="date" type="date" min="${todayISO()}" required></div><div><label>الوقت</label><input name="time" type="time"></div></div>
      <label>عدد المنظمين المطلوبين</label><input name="count" type="number" min="1" max="20" value="2">
      <button class="btn primary block">➕ طرح الطلعة للتصويت</button></form>`;
    const f = el.querySelector('[data-new]');
    f.onsubmit = e => { e.preventDefault(); busy(f.querySelector('button'), async () => {
      if (!(await requirePin())) return;
      const r = await call('create_outing_plan', { ...creds(), p_outing_type: val(f, 'type'), p_outing_place: val(f, 'place'), p_date: val(f, 'date'), p_time: val(f, 'time') || null, p_organizer_count: Number(val(f, 'count') || 1) });
      if (!r.ok) return toast(r.message, false);
      toast('تم طرح الطلعة للتصويت.'); data.invalidate('plans'); location.hash = '#/outings';
    }); };
    return;
  }

  if (tab === 'schedule') {
    const [rows, plans] = await Promise.all([data.outings(), data.outingPlans()]);
    const planMap = new Map(plans.map(p => [Number(p.id), p]));
    const today = todayISO();
    el.innerHTML = tabs + `<div class="card">${rows.length ? `<div class="list">${rows.map(x => {
      const p = x.plan_id ? planMap.get(Number(x.plan_id)) : null;
      const who = p?.organizers?.length ? p.organizers.map(o => o.member_name).join('، ') : [memberName(x.member1_id), memberName(x.member2_id)].filter(n => n !== '—').join(' + ');
      return `<div class="row-item${x.outing_date < today ? ' past' : ''}"><div class="row-main"><b>${esc(x.outing_type || p?.outing_type || 'طلعة')} — ${esc(x.outing_place || p?.outing_place || 'المكان لاحقًا')}</b>
        <span class="muted">${fmtDate(x.outing_date)} — ${fmtTime(x.outing_time)}</span><small>المنظمون: ${esc(who || '—')}${p ? ' · ' + (p.attending_count || 0) + ' مشارك · للفرد ' + money(p.per_person_cost) : ''}</small></div>
        ${x.outing_date >= today || canDelete('outing', x) ? `<div class="row-side">${x.outing_date >= today ? `<button class="small-btn" data-att="1" data-id="${x.id}">حاضر</button><button class="small-btn ghost" data-att="0" data-id="${x.id}">أعتذر</button>` : ''}${canDelete('outing', x) ? deleteBtn('outing', x.id) : ''}</div>` : ''}</div>`;
    }).join('')}</div>` : empty('لا توجد طلعات معتمدة.')}</div>`;
    el.querySelectorAll('[data-att]').forEach(b => b.onclick = () => busy(b, async () => {
      if (!(await requirePin())) return;
      const att = b.dataset.att === '1';
      const r = await call('set_outing_attendance', { ...creds(), p_outing_id: Number(b.dataset.id), p_attendance: att });
      toast(r.ok ? (att ? 'تم تسجيل حضورك.' : 'تم تسجيل اعتذارك.') : r.message, r.ok);
    }));
    bindDelete(el, () => { data.invalidate('outings', 'plans'); render(el, ['schedule']); });
    return;
  }

  const plans = (await data.outingPlans()).filter(p => p.status !== 'rejected');
  el.innerHTML = tabs + (plans.length ? plans.map(planCard).join('') : `<div class="card">${empty('لا توجد طلعات مطروحة حاليًا.')}<a class="btn primary block" href="#/outings/new">➕ اقترح طلعة</a></div>`);
  const reload = () => { data.invalidate('plans'); render(el, ['plans']); };
  bindDelete(el, () => { data.invalidate('plans', 'outings'); render(el, ['plans']); });

  el.querySelectorAll('[data-vote]').forEach(b => b.onclick = () => busy(b, async () => {
    if (!(await requirePin())) return;
    const r = await call('vote_outing_plan', { ...creds(), p_plan_id: Number(b.dataset.plan), p_vote: b.dataset.vote });
    if (!r.ok) return toast(r.message, false);
    toast(b.dataset.vote === 'attending' ? 'تم تسجيل مشاركتك.' : 'تم تسجيل عدم المشاركة.'); reload();
  }));
  el.querySelectorAll('[data-expense]').forEach(f => f.onsubmit = e => { e.preventDefault(); busy(f.querySelector('button'), async () => {
    if (!(await requirePin())) return;
    const r = await call('add_outing_plan_expense', { ...creds(), p_plan_id: Number(f.dataset.expense), p_amount: Number(val(f, 'amount')), p_note: val(f, 'note') || null });
    if (!r.ok) return toast(r.message, false);
    toast('تم تسجيل المصروف وتقسيمه على المشاركين.'); reload();
  }); });
  el.querySelectorAll('[data-rate]').forEach(f => f.onsubmit = e => { e.preventDefault(); busy(f.querySelector('button'), async () => {
    if (!(await requirePin())) return;
    const v = k => Number(val(f, k) || 5);
    const r = await call('submit_outing_rating', { ...creds(), p_plan_id: Number(f.dataset.rate), p_place: v('place'), p_food: v('food'), p_time: v('time'), p_cost: v('cost'), p_organization: v('organization'), p_cleanliness: v('cleanliness'), p_comment: val(f, 'comment') });
    if (!r.ok) return toast(r.message, false);
    toast('شكرًا، تم حفظ تقييمك.'); reload();
  }); });
}

function bindDelete(el, after) {
  el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => busy(b, async () => {
    if (await deleteGathering(b.dataset.del, b.dataset.id)) after();
  }));
}
