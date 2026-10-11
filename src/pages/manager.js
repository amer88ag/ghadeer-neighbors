/* لوحة الإدارة: المدير بكل الصلاحيات، والمشرف المفوض بما تسمح به دوال المشرف. */
import { esc, toast, busy, empty, val, options, fmtDate, fmtTime, fmtDateTime, confirmBox, promptBox, todayISO, $ } from '../lib/dom.js';
import { state, canManage, activeMembers, memberName, loadMembers, logout, showManagerLogin, showLogin } from '../lib/session.js';
import { call, list, table } from '../lib/api.js';
import * as data from '../lib/data.js';
import { PIN_PATTERN } from '../config.js';
import { refresh } from '../lib/router.js';

const TABS = [
  ['schedules', '☕🚐 الجداول', 'any'],
  ['plans', '🗳️ الطلعات المقترحة', 'any'],
  ['occasions', '🎉 المناسبات', 'any'],
  ['messages', '💬 الرسائل والتنبيهات', 'manager'],
  ['members', '👥 الأعضاء والأرقام', 'manager'],
  ['permissions', '🛡️ المشرفون', 'manager'],
  ['rules', '⚙️ القواعد', 'any'],
  ['checks', '❤️ التفقد', 'manager'],
  ['reports', '📊 التقارير والنسخ', 'manager']
];

const M = () => ({ p_manager_pin: state.pin });
const S = () => ({ p_member_id: state.user?.id, p_pin: state.pin });

/** يربط نموذجًا بمعالج: يمنع الإرسال المزدوج ويعرض النتيجة ويعيد الرسم عند النجاح. */
function bind(el, sel, handler, after) {
  el.querySelectorAll(sel).forEach(f => {
    f.onsubmit = e => {
      e.preventDefault();
      busy(f.querySelector('button[type=submit],button:not([type])'), async () => {
        const r = await handler(f, e.submitter);
        if (!r) return;
        if (!r.ok) return toast(r.message, false);
        toast(r.message && r.message.length < 120 ? r.message : 'تم الحفظ.');
        await after?.(r);
      });
    };
  });
}

const memberOpts = sel => options(activeMembers(), m => m.name, sel);

export async function render(el, [tab]) {
  if (!canManage() || !state.pin) {
    el.innerHTML = `<div class="card"><p>لوحة الإدارة للمدير والمشرفين المفوضين.</p><button class="btn primary block" data-mgr>🛠️ دخول المدير</button><button class="btn secondary block" data-sup>🔐 دخول المشرف</button></div>`;
    $('[data-mgr]', el).onclick = async () => { if (await showManagerLogin()) refresh(); };
    $('[data-sup]', el).onclick = async () => { if (await showLogin()) refresh(); };
    return;
  }
  const allowed = TABS.filter(t => state.manager || t[2] === 'any');
  if (!allowed.some(t => t[0] === tab)) tab = allowed[0][0];
  el.innerHTML = `<div class="segmented scroll">${allowed.map(([k, l]) => `<a href="#/manager/${k}" class="${k === tab ? 'active' : ''}">${l}</a>`).join('')}</div><div data-tab></div>`;
  const box = $('[data-tab]', el);
  const again = () => { data.invalidate(); render(el, [tab]); };
  await ({ schedules, plans, occasions, messages, members, permissions, rules, checks, reports })[tab](box, again);
}

/* ---------------- الجداول ---------------- */
async function schedules(el, again) {
  const [coffee, outings] = await Promise.all([data.coffee(true), data.outings(true)]);
  const cLabel = x => `${fmtDate(x.coffee_date)} — ${memberName(x.member_id)}`;
  const oLabel = x => `${fmtDate(x.outing_date)} — ${x.outing_type || memberName(x.member1_id) + ' + ' + memberName(x.member2_id)}`;
  el.innerHTML = `
  <details class="card" open><summary><b>☕ موعد قهوة جديد</b></summary><form data-f="coffee-new"><label>الجار</label><select name="member">${memberOpts()}</select>
    <div class="grid2"><div><label>التاريخ</label><input name="date" type="date" required></div><div><label>الوقت</label><input name="time" type="time"></div></div>
    <label>التاريخ الهجري (اختياري)</label><input name="hijri"><label>ملاحظات</label><input name="notes"><button class="btn primary block">➕ إنشاء</button></form></details>
  <details class="card"><summary><b>☕ تعديل / حذف موعد قهوة</b></summary><form data-f="coffee-edit"><select name="rid" data-pick="coffee">${options(coffee, cLabel)}</select>
    <label>الجار</label><select name="member">${memberOpts()}</select>
    <div class="grid2"><div><label>التاريخ</label><input name="date" type="date"></div><div><label>الوقت</label><input name="time" type="time"></div></div>
    <label>ملاحظات</label><input name="notes"><div class="actions"><button class="btn primary" value="save">حفظ</button>${state.manager ? '<button class="btn danger" value="delete">🗑️ حذف</button>' : ''}</div></form></details>
  ${state.manager ? `<details class="card"><summary><b>🔁 تبديل موعدي قهوة</b></summary><form data-f="coffee-swap"><select name="a">${options(coffee, cLabel)}</select><select name="b">${options(coffee, cLabel)}</select><button class="btn secondary block">تبديل</button></form></details>` : ''}
  <details class="card"><summary><b>🚐 موعد طلعة يدوي</b></summary><form data-f="outing-new"><div class="grid2"><div><label>المنظم الأول</label><select name="m1">${memberOpts()}</select></div><div><label>المنظم الثاني</label><select name="m2">${memberOpts()}</select></div></div>
    <div class="grid2"><div><label>التاريخ</label><input name="date" type="date" required></div><div><label>الوقت</label><input name="time" type="time"></div></div>
    <label>التاريخ الهجري (اختياري)</label><input name="hijri"><label>ملاحظات</label><input name="notes"><button class="btn primary block">➕ إنشاء</button></form></details>
  <details class="card"><summary><b>🚐 تعديل / حذف طلعة</b></summary><form data-f="outing-edit"><select name="rid" data-pick="outing">${options(outings, oLabel)}</select>
    <div class="grid2"><div><label>المنظم الأول</label><select name="m1">${memberOpts()}</select></div><div><label>المنظم الثاني</label><select name="m2">${memberOpts()}</select></div></div>
    <div class="grid2"><div><label>التاريخ</label><input name="date" type="date"></div><div><label>الوقت</label><input name="time" type="time"></div></div>
    <label>ملاحظات</label><input name="notes">
    <div class="actions"><button class="btn primary" value="save">حفظ</button><button class="btn secondary" value="time">🕐 تعديل الوقت فقط</button><button class="btn secondary" value="cost">💰 التكاليف</button>${state.manager ? '<button class="btn danger" value="delete">🗑️ حذف</button>' : ''}</div></form></details>
  ${state.manager ? `<details class="card"><summary><b>🔁 تبديل موعدي طلعتين</b></summary><form data-f="outing-swap"><select name="a">${options(outings, oLabel)}</select><select name="b">${options(outings, oLabel)}</select><button class="btn secondary block">تبديل</button></form></details>` : ''}
  <details class="card"><summary><b>🎲 جدول طلعات عشوائي جديد</b></summary><form data-f="outing-random"><p class="muted">يُنشئ جدولًا جديدًا من اليوم وفق القواعد (يتطلب عددًا زوجيًا من الجيران النشطين).</p><button class="btn secondary block">🎲 إنشاء الجدول</button></form></details>`;

  const fillCoffee = f => { const x = coffee.find(c => String(c.id) === f.rid.value); if (!x) return; f.member.value = x.member_id; f.date.value = x.coffee_date; f.time.value = fmtTime(x.coffee_time).replace('—', ''); f.notes.value = x.notes || ''; };
  const fillOuting = f => { const x = outings.find(c => String(c.id) === f.rid.value); if (!x) return; f.m1.value = x.member1_id ?? ''; f.m2.value = x.member2_id ?? ''; f.date.value = x.outing_date; f.time.value = fmtTime(x.outing_time).replace('—', ''); f.notes.value = x.notes || ''; };
  const ce = $('[data-f=coffee-edit]', el), oe = $('[data-f=outing-edit]', el);
  ce.rid.onchange = () => fillCoffee(ce); fillCoffee(ce);
  oe.rid.onchange = () => fillOuting(oe); fillOuting(oe);

  bind(el, '[data-f=coffee-new]', f => state.manager
    ? call('manager_create_coffee', { ...M(), p_member_id: Number(f.member.value), p_date: f.date.value, p_time: f.time.value || null, p_hijri: val(f, 'hijri'), p_notes: val(f, 'notes') })
    : call('supervisor_insert_coffee', { ...S(), p_target_member_id: Number(f.member.value), p_date: f.date.value, p_hijri: val(f, 'hijri'), p_notes: val(f, 'notes') }), again);
  bind(el, '[data-f=coffee-edit]', async (f, btn) => {
    if (btn?.value === 'delete') { if (!(await confirmBox('حذف موعد القهوة نهائيًا؟'))) return null; return call('manager_delete_coffee', { ...M(), p_id: Number(f.rid.value) }); }
    if (!state.manager) return call('supervisor_update_coffee_assignment', { ...S(), p_id: Number(f.rid.value), p_target_member_id: Number(f.member.value), p_date: f.date.value, p_time: f.time.value || null, p_notes: val(f, 'notes') });
    return call('manager_update_coffee_assignment', { ...M(), p_id: Number(f.rid.value), p_member_id: Number(f.member.value), p_date: f.date.value, p_time: f.time.value || null, p_notes: val(f, 'notes') });
  }, again);
  bind(el, '[data-f=coffee-swap]', f => f.a.value === f.b.value ? { ok: false, message: 'اختر موعدين مختلفين.' } : call('manager_swap_coffee_dates', { ...M(), p_id1: Number(f.a.value), p_id2: Number(f.b.value) }), again);
  bind(el, '[data-f=outing-new]', f => state.manager
    ? call('manager_create_outing', { ...M(), p_member1_id: Number(f.m1.value), p_member2_id: Number(f.m2.value), p_date: f.date.value, p_time: f.time.value || null, p_hijri: val(f, 'hijri'), p_notes: val(f, 'notes') })
    : call('supervisor_insert_outing', { ...S(), p_member1_id: Number(f.m1.value), p_member2_id: Number(f.m2.value), p_date: f.date.value, p_hijri: val(f, 'hijri'), p_notes: val(f, 'notes') }), again);
  bind(el, '[data-f=outing-edit]', async (f, btn) => {
    const id = Number(f.rid.value);
    if (btn?.value === 'delete') { if (!(await confirmBox('حذف موعد الطلعة نهائيًا؟'))) return null; return call('manager_delete_outing', { ...M(), p_id: id }); }
    if (btn?.value === 'time') { if (!f.time.value) return { ok: false, message: 'حدد الوقت الجديد.' }; return state.manager ? call('manager_update_outing_time', { ...M(), p_id: id, p_new_time: f.time.value }) : call('supervisor_update_outing_time', { ...S(), p_id: id, p_new_time: f.time.value }); }
    if (btn?.value === 'cost') return outingCost(id);
    if (!state.manager) return call('supervisor_update_outing_assignment', { ...S(), p_id: id, p_member1_id: Number(f.m1.value), p_member2_id: Number(f.m2.value), p_date: f.date.value, p_time: f.time.value || null, p_notes: val(f, 'notes') });
    return call('manager_update_outing_assignment', { ...M(), p_id: id, p_member1_id: Number(f.m1.value), p_member2_id: Number(f.m2.value), p_date: f.date.value, p_time: f.time.value || null, p_notes: val(f, 'notes') });
  }, again);
  bind(el, '[data-f=outing-swap]', f => f.a.value === f.b.value ? { ok: false, message: 'اختر موعدين مختلفين.' } : call('manager_swap_outing_dates', { ...M(), p_id1: Number(f.a.value), p_id2: Number(f.b.value) }), again);
  bind(el, '[data-f=outing-random]', async () => { if (!(await confirmBox('إنشاء جدول طلعات جديد ونشره؟', { danger: false }))) return null; return state.manager ? call('manager_randomize_outings', { ...M(), p_start_date: todayISO() }) : call('supervisor_randomize_outings', { ...S(), p_start_date: todayISO() }); }, again);
}

async function outingCost(id) {
  const ask = async (label, def = '0') => promptBox({ title: '💰 تكاليف الطلعة', label, type: 'number', value: def, inputmode: 'decimal', okText: 'التالي' });
  const food = await ask('تكلفة الأكل (ريال)'); if (food === null) return null;
  const place = await ask('تكلفة المكان (ريال)'); if (place === null) return null;
  const other = await ask('تكاليف أخرى (ريال)'); if (other === null) return null;
  const notes = await promptBox({ title: '💰 تكاليف الطلعة', label: 'ملاحظات (اختياري)', required: false, okText: 'حفظ' });
  if (notes === null) return null;
  return call(state.manager ? 'manager_set_outing_cost_breakdown' : 'supervisor_set_outing_cost_breakdown', { ...(state.manager ? M() : S()), p_outing_id: id, p_food: Number(food) || 0, p_place: Number(place) || 0, p_other: Number(other) || 0, p_notes: notes.trim() });
}

/* ---------------- الطلعات المقترحة ---------------- */
async function plans(el, again) {
  const rows = (await data.outingPlans(true)).filter(p => p.status !== 'rejected');
  const label = p => `${p.outing_type} — ${fmtDate(p.outing_date)} — ${p.attending_count || 0} مشارك`;
  el.innerHTML = `<div class="card"><h3>📊 طلبات الطلعات</h3>${rows.length ? `<div class="list">${rows.map(p => `<div class="row-item col"><b>🚐 ${esc(p.outing_type)} — ${esc(p.outing_place)}</b>
      <small class="muted">${fmtDate(p.outing_date)} · ${p.attending_count || 0} مشارك · المدير ${p.manager_approved ? '✅' : '⏳'} · المشرف ${p.supervisor_approved ? '✅' : '⏳'} · المنظمون: ${esc((p.organizers || []).map(o => o.member_name).join('، ') || 'لم يوزعوا')}</small></div>`).join('')}</div>` : empty('لا توجد طلبات.')}</div>
    ${rows.length ? `${state.manager ? `<form class="card" data-f="random"><h3>🎲 توزيع المنظمين والمشاركين عشوائيًا</h3><select name="plan">${options(rows, label)}</select><label>عدد المنظمين</label><input name="count" type="number" min="1" max="20" value="2"><button class="btn secondary block">🎲 توزيع</button></form>` : ''}
    <form class="card" data-f="approve"><h3>✅ اعتماد الطلعة</h3><p class="muted">تُدرج الطلعة في الجدول بعد موافقة المدير والمشرف.</p><select name="plan">${options(rows, label)}</select><button class="btn primary block">${state.manager ? '✅ موافقة المدير' : '🤝 موافقة المشرف'}</button></form>` : ''}`;
  bind(el, '[data-f=random]', async f => { const r = await call('manager_randomize_outing_plan', { ...M(), p_plan_id: Number(f.plan.value), p_organizer_count: Number(f.count.value) || 1 }); if (r.ok) r.message = `تم اختيار ${r.data?.organizers ?? f.count.value} منظمين وتوزيع ${r.data?.participants ?? 0} مشاركًا.`; return r; }, again);
  bind(el, '[data-f=approve]', async f => { const r = await call('approve_outing_plan', { p_member_id: state.manager ? 0 : state.user.id, p_pin: state.pin, p_plan_id: Number(f.plan.value) }); if (r.ok) r.message = r.data?.scheduled ? 'اكتمل الاعتماد وأُدرجت الطلعة في الجدول.' : 'تم تسجيل موافقتك.'; return r; }, again);
}

/* ---------------- المناسبات ---------------- */
async function occasions(el, again) {
  const rows = (await data.announcements(true)).filter(a => a.is_occasion === true);
  const rules = await list('get_occasion_automation_rules');
  const lbl = x => `${x.occasion_type === 'وطنية' ? '🇸🇦' : '🕌'} ${x.title} — ${fmtDateTime(x.scheduled_at || x.created_at)}`;
  const typeSel = v => `<select name="type"><option value="دينية"${v === 'دينية' ? ' selected' : ''}>🕌 دينية</option><option value="وطنية"${v === 'وطنية' ? ' selected' : ''}>🇸🇦 وطنية</option></select>`;
  el.innerHTML = `<form class="card" data-f="new"><h3>🎉 رسالة مناسبة جديدة</h3>${typeSel('دينية')}<label>العنوان</label><input name="ttl" required><label>الرسالة</label><textarea name="msg" required></textarea>
      <label>وقت الظهور (فارغ = الآن)</label><input name="at" type="datetime-local"><button class="btn primary block">➕ نشر / جدولة</button></form>
    ${rows.length ? `<form class="card" data-f="edit"><h3>📝 تعديل أو حذف</h3><select name="rid">${options(rows, lbl)}</select>${typeSel('')}<label>العنوان</label><input name="ttl"><label>الرسالة</label><textarea name="msg"></textarea><label>وقت الظهور</label><input name="at" type="datetime-local">
      <div class="actions"><button class="btn primary" value="save">حفظ</button><button class="btn danger" value="delete">🗑️ حذف</button></div></form>` : ''}
    <div class="card"><h3>⚙️ المناسبات التلقائية</h3>${!rules.ok ? `<p class="status bad">${esc(rules.message)}</p>` : rules.data.length ? `<div class="list">${rules.data.map(x => `<div class="row-item"><div class="row-main"><b>${x.occasion_type === 'وطنية' ? '🇸🇦' : '🕌'} ${esc(x.title)}</b><small>${x.calendar_type === 'hijri' ? 'هجري' : 'ميلادي'} — ${x.enabled ? 'مفعّل' : 'متوقف'}</small></div><button class="small-btn" data-rule="${esc(x.rule_key)}" data-on="${x.enabled ? 1 : 0}">${x.enabled ? '⏸️ إيقاف' : '▶️ تشغيل'}</button></div>`).join('')}</div>` : empty('لا توجد قواعد تلقائية.')}</div>`;
  const toIso = v => v ? new Date(v).toISOString() : null;
  const local = d => { if (!d) return ''; const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 16); };
  const ef = $('[data-f=edit]', el);
  if (ef) { const fill = () => { const x = rows.find(r => String(r.id) === ef.rid.value); if (!x) return; ef.type.value = x.occasion_type || 'دينية'; ef.ttl.value = x.title || ''; ef.msg.value = x.message || ''; ef.at.value = local(x.scheduled_at); }; ef.rid.onchange = fill; fill(); }
  const auth = state.manager ? M() : S();
  const fn = op => (state.manager ? 'manager_' : 'supervisor_') + op + '_occasion_message';
  bind(el, '[data-f=new]', f => call(fn('create'), { ...auth, p_type: f.type.value, p_title: val(f, 'ttl'), p_message: val(f, 'msg'), p_scheduled_at: toIso(f.at.value) || new Date().toISOString() }), again);
  bind(el, '[data-f=edit]', async (f, btn) => {
    if (btn?.value === 'delete') { if (!(await confirmBox('حذف رسالة المناسبة نهائيًا؟'))) return null; return call(fn('delete'), { ...auth, p_id: Number(f.rid.value) }); }
    return call(fn('update'), { ...auth, p_id: Number(f.rid.value), p_type: f.type.value, p_title: val(f, 'ttl'), p_message: val(f, 'msg'), p_scheduled_at: toIso(f.at.value) });
  }, again);
  el.querySelectorAll('[data-rule]').forEach(b => b.onclick = () => busy(b, async () => {
    const enabled = b.dataset.on !== '1';
    const r = state.manager ? await call('manager_set_occasion_automation', { ...M(), p_rule_key: b.dataset.rule, p_enabled: enabled }) : await call('supervisor_set_occasion_automation', { ...S(), p_rule_key: b.dataset.rule, p_enabled: enabled });
    if (!r.ok) return toast(r.message, false);
    toast('تم التحديث.'); again();
  }));
}

/* ---------------- الرسائل والتنبيهات ---------------- */
async function messages(el, again) {
  const msgs = (await data.groupMessages(true)).slice().reverse();
  const lbl = m => `${fmtDateTime(m.created_at)} — ${String(m.message).slice(0, 60)}`;
  el.innerHTML = `<form class="card" data-f="new"><h3>💬 رسالة للمجموعة</h3><textarea name="msg" required></textarea><button class="btn primary block">➕ إرسال</button></form>
    ${msgs.length ? `<form class="card" data-f="edit"><h3>📝 تعديل / حذف رسالة</h3><select name="rid">${options(msgs, lbl)}</select><textarea name="msg"></textarea><div class="actions"><button class="btn primary" value="save">حفظ</button><button class="btn danger" value="delete">🗑️ حذف</button></div></form>` : ''}
    <form class="card" data-f="notify"><h3>🔔 جدولة إعلان</h3><label>العنوان</label><input name="title" required><label>النص</label><textarea name="msg" required></textarea><label>وقت النشر</label><input name="at" type="datetime-local" required><button class="btn secondary block">جدولة</button></form>`;
  const ef = $('[data-f=edit]', el);
  if (ef) { const fill = () => { ef.msg.value = msgs.find(m => String(m.id) === ef.rid.value)?.message || ''; }; ef.rid.onchange = fill; fill(); }
  bind(el, '[data-f=new]', f => call('manager_create_group_message', { ...M(), p_message: val(f, 'msg') }), again);
  bind(el, '[data-f=edit]', async (f, btn) => {
    if (btn?.value === 'delete') { if (!(await confirmBox('حذف الرسالة نهائيًا؟'))) return null; return call('manager_delete_group_message', { ...M(), p_id: Number(f.rid.value) }); }
    return call('manager_update_group_message', { ...M(), p_id: Number(f.rid.value), p_message: val(f, 'msg') });
  }, again);
  bind(el, '[data-f=notify]', f => call('manager_schedule_notification', { ...M(), p_title: val(f, 'title'), p_message: val(f, 'msg'), p_scheduled_at: new Date(f.at.value).toISOString() }), again);
}

/* ---------------- الأعضاء والأرقام ---------------- */
async function members(el, again) {
  const reqs = await list('manager_get_pin_reset_requests', M());
  el.innerHTML = `<div class="card"><h3>🔑 طلبات استعادة الرقم السري</h3>${!reqs.ok ? `<p class="status bad">${esc(reqs.message)}</p>` : reqs.data.length ? reqs.data.map(r => `
      <form class="row-item col" data-f="reset" data-id="${r.id}"><b>${esc(r.full_name)}</b><small class="muted">${r.phone ? esc(r.phone) : 'لا يوجد جوال'} — ${fmtDateTime(r.created_at)}</small>
      <div class="inline-form"><input name="pin" type="password" inputmode="numeric" maxlength="12" placeholder="الرقم الجديد" required><button class="small-btn">تعيين وإغلاق الطلب</button></div></form>`).join('') : empty('لا توجد طلبات مفتوحة.')}</div>
    <form class="card" data-f="add"><h3>➕ إضافة جار</h3><label>الاسم</label><input name="name" required><label>الجوال (للتحقق عند الاستعادة)</label><input name="phone" inputmode="tel"><label>ملاحظات</label><input name="notes"><label>الرقم السري الأولي (4–12 رقمًا)</label><input name="pin" inputmode="numeric" maxlength="12"><button class="btn primary block">إضافة</button></form>
    <div class="card"><h3>👥 الأعضاء النشطون (${activeMembers().length})</h3><div class="list">${activeMembers().map(m => `<div class="row-item"><div class="row-main"><b>${esc(m.name)}</b></div><div class="row-side">
      <button class="small-btn" data-act="rename" data-id="${m.id}">✏️ الاسم</button><button class="small-btn" data-act="pin" data-id="${m.id}">🔑 الرقم</button><button class="small-btn ghost" data-act="delete" data-id="${m.id}">🗑️</button></div></div>`).join('')}</div></div>
    <form class="card" data-f="mgrpin"><h3>🛠️ تغيير رقم المدير</h3><input name="old" type="password" inputmode="numeric" placeholder="الرقم الحالي" required><input name="next" type="password" inputmode="numeric" placeholder="الرقم الجديد" required><button class="btn secondary block">تغيير</button></form>`;
  const reload = async () => { await loadMembers(); again(); };
  bind(el, '[data-f=reset]', f => PIN_PATTERN.test(f.pin.value) ? call('manager_reset_member_pin_from_request', { ...M(), p_request_id: Number(f.dataset.id), p_new_pin: f.pin.value }) : { ok: false, message: 'الرقم من 4 إلى 12 رقمًا.' }, again);
  bind(el, '[data-f=add]', f => { const pin = val(f, 'pin'); if (pin && !PIN_PATTERN.test(pin)) return { ok: false, message: 'الرقم السري من 4 إلى 12 رقمًا.' }; return call('manager_add_member', { ...M(), p_name: val(f, 'name'), p_phone: val(f, 'phone'), p_notes: val(f, 'notes'), p_member_pin: pin || null }); }, reload);
  bind(el, '[data-f=mgrpin]', async f => { const r = await call('manager_set_manager_pin', { p_current_pin: f.old.value, p_new_pin: f.next.value }); if (r.ok) setTimeout(logout, 600); return r; });
  el.querySelectorAll('[data-act]').forEach(b => b.onclick = () => busy(b, async () => {
    const id = Number(b.dataset.id), name = memberName(id);
    let r;
    if (b.dataset.act === 'rename') { const v = await promptBox({ title: 'تعديل الاسم', label: 'الاسم الجديد', value: name }); if (!v || v.trim() === name) return; r = await call('manager_update_member_name', { ...M(), p_member_id: id, p_name: v.trim() }); }
    else if (b.dataset.act === 'pin') { const v = await promptBox({ title: 'رقم سري جديد لـ ' + name, label: '4 إلى 12 رقمًا', type: 'password', inputmode: 'numeric' }); if (v === null) return; if (!PIN_PATTERN.test(v)) return toast('الرقم من 4 إلى 12 رقمًا.', false); r = await call('manager_set_member_pin', { ...M(), p_member_id: id, p_new_pin: v }); }
    else { if (!(await confirmBox('حذف الجار «' + name + '»؟'))) return; r = await call('manager_delete_member', { ...M(), p_member_id: id }); }
    if (!r.ok) return toast(r.message, false);
    toast('تم.'); if (b.dataset.act !== 'pin') reload();
  }));
}

/* ---------------- المشرفون ---------------- */
const PERMS = [['coffee', 'إدارة القهوة'], ['outings', 'إدارة الطلعات'], ['dates', 'تقديم وتأخير المواعيد'], ['members', 'إدارة الأعضاء والأرقام'], ['rules', 'إدارة القواعد'], ['messages', 'إرسال رسائل المجموعة'], ['lottery', 'القرعة والجدول العشوائي'], ['apologies', 'إدارة الاعتذارات']];
const PERM_COL = { coffee: 'can_manage_coffee', outings: 'can_manage_outings', dates: 'can_manage_dates', members: 'can_manage_members', rules: 'can_manage_rules', messages: 'can_send_group_messages', lottery: 'can_manage_lottery', apologies: 'can_manage_apologies' };

async function permissions(el, again) {
  const p = await table('member_permissions', { order: 'member_id' });
  const map = new Map(p.data.map(x => [Number(x.member_id), x]));
  const sups = activeMembers().filter(m => map.get(Number(m.id))?.role === 'supervisor');
  el.innerHTML = `<form class="card" data-f="perm"><h3>🛡️ تعيين مشرف وصلاحياته</h3><select name="member">${memberOpts()}</select>
      ${PERMS.map(([k, l]) => `<label class="check"><input type="checkbox" name="${k}"> ${l}</label>`).join('')}<button class="btn primary block">حفظ الصلاحيات</button></form>
    <div class="card"><h3>المشرفون الحاليون</h3>${!p.ok ? `<p class="status bad">${esc(p.message)}</p>` : sups.length ? `<div class="list">${sups.map(m => `<div class="row-item"><b>${esc(m.name)}</b><button class="small-btn ghost" data-revoke="${m.id}">إلغاء الإشراف</button></div>`).join('')}</div>` : empty('لا يوجد مشرفون.')}</div>`;
  const f = $('[data-f=perm]', el);
  const fill = () => { const x = map.get(Number(f.member.value)) || {}; PERMS.forEach(([k]) => { f[k].checked = !!x[PERM_COL[k]]; }); };
  f.member.onchange = fill; fill();
  bind(el, '[data-f=perm]', ff => call('manager_set_member_permissions', { ...M(), p_member_id: Number(ff.member.value), ...Object.fromEntries(PERMS.map(([k]) => ['p_' + (PERM_COL[k]), ff[k].checked])) }), again);
  el.querySelectorAll('[data-revoke]').forEach(b => b.onclick = () => busy(b, async () => {
    if (!(await confirmBox('إلغاء صلاحيات المشرف؟'))) return;
    const r = await call('manager_remove_supervisor', { ...M(), p_member_id: Number(b.dataset.revoke) });
    if (!r.ok) return toast(r.message, false);
    toast('تم إلغاء الإشراف.'); again();
  }));
}

/* ---------------- القواعد ---------------- */
async function rules(el, again) {
  const s = await data.settings(true);
  const sel = (name, opts, cur) => `<select name="${name}">${opts.map(([v, l]) => `<option value="${v}"${v === cur ? ' selected' : ''}>${l}</option>`).join('')}</select>`;
  el.innerHTML = `<form class="card" data-f="rules"><h3>⚙️ قواعد الجدولة</h3>
    <label>فاصل القهوة بالأيام</label><input name="interval" type="number" min="1" value="${esc(s.coffee_interval_days ?? 14)}">
    <label>ترتيب القهوة</label>${sel('order', [['current', 'الترتيب الحالي'], ['alphabetical', 'أبجدي'], ['random_no_repeat', 'عشوائي بدون تكرار']], s.coffee_order_mode)}
    <label class="check"><input type="checkbox" name="avoid" ${s.coffee_avoid_repeat === false ? '' : 'checked'}> عدم تكرار القهوة</label>
    <label>تكرار الطلعات</label>${sel('freq', [['monthly', 'شهري']], s.outing_frequency)}
    <label>قاعدة يوم الطلعة</label>${sel('rule', [['first_monday_after_27', 'أول اثنين بعد 27'], ['first_monday_of_month', 'أول اثنين من الشهر']], s.outing_day_rule)}
    <label>نمط الأزواج</label>${sel('pair', [['random_no_repeat', 'عشوائي بدون تكرار'], ['current', 'الحالي']], s.outing_pair_mode)}
    <label class="check"><input type="checkbox" name="conflict" ${s.avoid_coffee_conflicts === false ? '' : 'checked'}> منع تعارض القهوة والطلعات</label>
    <button class="btn primary block">حفظ القواعد</button></form>`;
  bind(el, '[data-f=rules]', f => call(state.manager ? 'manager_set_schedule_rules' : 'supervisor_set_schedule_rules', { ...(state.manager ? M() : S()), p_coffee_interval_days: Number(f.interval.value) || 14, p_coffee_order_mode: f.order.value, p_coffee_avoid_repeat: f.avoid.checked, p_outing_frequency: f.freq.value, p_outing_day_rule: f.rule.value, p_outing_pair_mode: f.pair.value, p_avoid_coffee_conflicts: f.conflict.checked }), again);
}

/* ---------------- التفقد ---------------- */
async function checks(el, again) {
  const r = await list('manager_get_neighbor_checks', M());
  el.innerHTML = `<div class="card"><h3>❤️ حالات تفقد الجيران</h3>${!r.ok ? `<p class="status bad">${esc(r.message)}</p>` : r.data.length ? `<div class="list">${r.data.map(x => `<div class="row-item col">
    <div class="row-head"><b>${esc(x.category)}${x.target_member_id ? ' — ' + esc(memberName(x.target_member_id)) : ''}</b><span class="pill">${esc(x.status)}</span></div>
    <p>${esc(x.details || 'بدون تفاصيل')}</p><small class="muted">المبلّغ: ${esc(memberName(x.reporter_member_id))} — ${esc(x.visibility || '')} — ${fmtDateTime(x.created_at)}</small>
    <div class="actions small">${['تم التواصل', 'تمت المساعدة', 'مغلقة'].map(s => `<button class="small-btn" data-id="${x.id}" data-status="${s}">${s}</button>`).join('')}<button class="small-btn ghost" data-del="${x.id}">حذف</button></div></div>`).join('')}</div>` : empty('لا توجد حالات.')}</div>`;
  el.querySelectorAll('[data-status]').forEach(b => b.onclick = () => busy(b, async () => { const res = await call('manager_update_neighbor_check', { ...M(), p_id: Number(b.dataset.id), p_status: b.dataset.status }); toast(res.ok ? 'تم التحديث.' : res.message, res.ok); if (res.ok) again(); }));
  el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => busy(b, async () => { if (!(await confirmBox('حذف الحالة؟'))) return; const res = await call('manager_delete_neighbor_check', { ...M(), p_id: Number(b.dataset.del) }); toast(res.ok ? 'تم الحذف.' : res.message, res.ok); if (res.ok) again(); }));
}

/* ---------------- التقارير والنسخ ---------------- */
function statsHtml(obj, depth = 0) {
  if (obj == null || typeof obj !== 'object') return esc(obj);
  if (Array.isArray(obj)) return obj.length ? `<ul>${obj.slice(0, 30).map(x => `<li>${statsHtml(x, depth + 1)}</li>`).join('')}</ul>` : '—';
  return `<dl class="kv">${Object.entries(obj).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${statsHtml(v, depth + 1)}</dd>`).join('')}</dl>`;
}

async function reports(el) {
  el.innerHTML = `<div class="card"><h3>📊 إحصاءات البرنامج</h3><button class="btn secondary block" data-stats>تحديث الإحصاءات</button><div data-out></div></div>
    <div class="card"><h3>💾 النسخ الاحتياطي</h3><p class="muted">تُنزّل نسخة JSON بدون الأرقام السرية.</p><button class="btn secondary block" data-backup>⬇️ تنزيل نسخة احتياطية</button>
      <label class="btn secondary block file-btn">⬆️ استعادة نسخة<input type="file" accept="application/json,.json" data-restore hidden></label></div>`;
  $('[data-stats]', el).onclick = e => busy(e.currentTarget, async () => {
    const r = await call('manager_activity_stats', { ...M(), p_limit: 500 });
    $('[data-out]', el).innerHTML = r.ok || r.data?.totals ? statsHtml(r.data) : `<p class="status bad">${esc(r.message)}</p>`;
  });
  $('[data-backup]', el).onclick = e => busy(e.currentTarget, async () => {
    const r = await call('manager_export_backup', M());
    if (!r.ok) return toast(r.missing ? 'النسخ الاحتياطي يحتاج تطبيق ترحيل قاعدة البيانات الجديد (manager_export_backup).' : r.message, false);
    const blob = new Blob([JSON.stringify({ app: 'جيران حي الغدير', created_at: new Date().toISOString(), ...r.data }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'ghadeer-backup-' + todayISO() + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    toast('تم تنزيل النسخة.');
  });
  $('[data-restore]', el).onchange = async e => {
    const file = e.target.files[0]; e.target.value = '';
    if (!file || !(await confirmBox('الاستعادة قد تعدّل بيانات البرنامج. متابعة؟'))) return;
    try {
      const json = JSON.parse(await file.text());
      if (!json?.tables) throw new Error('ملف النسخة غير صالح');
      const r = await call('manager_restore_backup', { ...M(), p_data: json });
      toast(r.ok ? 'تمت الاستعادة.' : r.message, r.ok);
      if (r.ok) { data.invalidate(); await loadMembers(); }
    } catch (err) { toast('تعذر قراءة الملف: ' + err.message, false); }
  };
}
