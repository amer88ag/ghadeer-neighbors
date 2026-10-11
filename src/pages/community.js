import { esc, toast, busy, empty, val, fmtDateTime, confirmBox, $ } from '../lib/dom.js';
import { creds, requirePin } from '../lib/session.js';
import { call, list } from '../lib/api.js';

/*
 * مجتمع جديد (المرحلة الأولى): طلب إنشاء مجتمع خاص ← اعتماد المطور ← رمز انضمام
 * ← صاحب المجتمع يقبل الأعضاء. المطور والمشرفون المخوّلون يستطيعون إيقاف أي مجتمع.
 */
const STATUS = { pending: '⏳ قيد مراجعة المطور', active: '✅ نشط', rejected: '⛔ مرفوض', suspended: '⏸️ موقوف من الإدارة' };
const ROLE = { owner: '👑 صاحب المجتمع', admin: '🛡️ مشرف', member: '👤 عضو' };

export async function render(el, [tab = 'mine', arg]) {
  if (!(await requirePin())) { el.innerHTML = '<div class="card"><p>سجّل الدخول لإدارة مجتمعاتك.</p></div>'; return; }
  if (tab === 'manage') return manage(el, Number(arg));
  const r = await list('community_my_list', creds());
  el.innerHTML = `
    <section class="card"><h3>🏘️ ما هو «المجتمع الجديد»؟</h3>
      <p>مجتمع خاص مماثل لمجتمع حي الغدير، لمجموعة أشخاص تختارهم أنت. لا يدخله إلا من توافق عليه، ويبقى تحت إشراف مطور البرنامج.</p>
      <ol class="steps"><li>ترسل طلب الإنشاء.</li><li>يراجعه المطور ويعتمده.</li><li>تحصل على رمز انضمام ترسله لمن تريد.</li><li>توافق على طلبات الانضمام بنفسك.</li></ol></section>
    <section class="card"><h3>📋 مجتمعاتي</h3>${!r.ok ? `<p class="status bad">${esc(r.message)}</p>` : r.data.length ? `<div class="list">${r.data.map(c => `
      <div class="row-item col"><div class="row-head"><b>${esc(c.name)}</b><span class="pill">${STATUS[c.status] || esc(c.status)}</span></div>
        <small class="muted">${ROLE[c.my_role] || ''}${c.my_status === 'pending' ? ' · طلب انضمامك قيد المراجعة' : ''} · ${c.members_count} عضو · صاحبه: ${esc(c.owner_name)}</small>
        ${c.description ? `<p>${esc(c.description)}</p>` : ''}${c.review_note ? `<p class="muted">ملاحظة الإدارة: ${esc(c.review_note)}</p>` : ''}
        ${c.join_code ? `<p>رمز الانضمام: <code class="code">${esc(c.join_code)}</code></p>` : ''}
        ${c.status === 'active' && c.my_status === 'approved' ? `<a class="small-btn" href="#/community/manage/${c.id}">👥 الأعضاء${c.pending_count ? ` <span class="badge">${c.pending_count}</span>` : ''}</a>` : ''}</div>`).join('')}</div>` : empty('لست عضوًا في أي مجتمع جديد بعد.')}</section>
    <form class="card" data-join><h3>🔑 الانضمام برمز</h3><input name="code" maxlength="6" placeholder="مثال: A1B2C3" required autocomplete="off" style="text-transform:uppercase"><button class="btn secondary block">طلب الانضمام</button></form>
    <form class="card" data-create><h3>➕ طلب إنشاء مجتمع جديد</h3>
      <label>اسم المجتمع</label><input name="name" maxlength="80" required placeholder="مثال: جيران حي النخيل">
      <label>نبذة عن المجتمع وأعضائه</label><textarea name="desc" maxlength="1000" placeholder="من هم الأعضاء؟ وما الغرض من المجتمع؟"></textarea>
      <p class="muted">بإرسال الطلب تلتزم بالأنظمة والشروط، وتكون مسؤولًا عن إدارة مجتمعك وقبول أعضائه.</p>
      <button class="btn primary block">إرسال الطلب للمطور</button></form>`;
  const onSubmit = (sel, fn) => { const f = $(sel, el); f.onsubmit = e => { e.preventDefault(); busy(f.querySelector('button'), async () => { const res = await fn(f); if (!res.ok) return toast(res.message, false); toast(res.message || 'تم.'); render(el, ['mine']); }); }; };
  onSubmit('[data-create]', f => call('community_request_create', { ...creds(), p_name: val(f, 'name'), p_description: val(f, 'desc') }));
  onSubmit('[data-join]', f => call('community_join_by_code', { ...creds(), p_code: val(f, 'code').toUpperCase() }));
}

async function manage(el, id) {
  const [mine, r] = await Promise.all([list('community_my_list', creds()), list('community_members', { ...creds(), p_community_id: id })]);
  const c = mine.data.find(x => Number(x.id) === id);
  if (!c || !r.ok) { el.innerHTML = `<div class="card"><p class="status bad">${esc(r.message || 'غير مصرح')}</p><a class="btn secondary" href="#/community">رجوع</a></div>`; return; }
  const canDecide = ['owner', 'admin'].includes(c.my_role), isOwner = c.my_role === 'owner';
  const pending = r.data.filter(m => m.status === 'pending'), approved = r.data.filter(m => m.status === 'approved');
  el.innerHTML = `<div class="card"><div class="row-head"><b>🏘️ ${esc(c.name)}</b><a class="small-btn ghost" href="#/community">كل مجتمعاتي</a></div>
      ${c.join_code ? `<p>رمز الانضمام: <code class="code">${esc(c.join_code)}</code> ${isOwner ? '<button class="small-btn" data-regen>🔄 رمز جديد</button>' : ''}</p>` : ''}</div>
    ${canDecide ? `<div class="card"><h3>⏳ طلبات الانضمام (${pending.length})</h3>${pending.length ? `<div class="list">${pending.map(m => `<div class="row-item"><div class="row-main"><b>${esc(m.name)}</b><small>${fmtDateTime(m.created_at)}</small></div><div class="row-side"><button class="small-btn" data-d="approve" data-m="${m.member_id}">✅ قبول</button><button class="small-btn ghost" data-d="reject" data-m="${m.member_id}">رفض</button></div></div>`).join('')}</div>` : empty('لا توجد طلبات.')}</div>` : ''}
    <div class="card"><h3>👥 الأعضاء (${approved.length})</h3><div class="list">${approved.map(m => `<div class="row-item"><div class="row-main"><b>${esc(m.name)}</b><small>${ROLE[m.role] || ''}</small></div>
      ${canDecide && m.role !== 'owner' ? `<div class="row-side">${isOwner ? (m.role === 'admin' ? `<button class="small-btn ghost" data-d="member" data-m="${m.member_id}">إلغاء الإشراف</button>` : `<button class="small-btn" data-d="admin" data-m="${m.member_id}">🛡️ مشرف</button>`) : ''}<button class="small-btn ghost" data-d="remove" data-m="${m.member_id}">إزالة</button></div>` : ''}</div>`).join('')}</div></div>
    <p class="muted center">خدمات المجتمع (القهوة والطلعات والرسائل…) تُفعَّل في المرحلة الثانية بعد اعتماد المطور لتصميم العزل.</p>`;
  el.querySelectorAll('[data-d]').forEach(b => b.onclick = () => busy(b, async () => {
    if (b.dataset.d === 'remove' && !(await confirmBox('إزالة العضو من المجتمع؟'))) return;
    const res = await call('community_decide_member', { ...creds(), p_community_id: id, p_target_member_id: Number(b.dataset.m), p_decision: b.dataset.d });
    if (!res.ok) return toast(res.message, false);
    toast('تم.'); manage(el, id);
  }));
  $('[data-regen]', el)?.addEventListener('click', e => busy(e.currentTarget, async () => {
    const res = await call('community_regenerate_code', { ...creds(), p_community_id: id });
    if (!res.ok) return toast(res.message, false);
    toast('تم إنشاء رمز جديد، والرمز القديم لم يعد صالحًا.'); manage(el, id);
  }));
}
