import { esc, toast, busy, empty, val, fmtDateTime, $ } from '../lib/dom.js';
import { state, memberName, requirePin, creds, showLogin } from '../lib/session.js';
import { call, list } from '../lib/api.js';
import * as data from '../lib/data.js';

function needLogin(el, tabs, again) {
  el.innerHTML = tabs + `<div class="card"><p>هذا القسم للأعضاء. سجّل الدخول للمتابعة.</p><button class="btn primary" data-login>🔐 دخول</button></div>`;
  $('[data-login]', el).onclick = async () => { if (await showLogin()) again(); };
}

export async function render(el, [tab = 'group', arg]) {
  const tabs = `<div class="segmented"><a href="#/messages" class="${tab === 'group' ? 'active' : ''}">📢 المجموعة</a><a href="#/messages/private" class="${tab === 'private' || tab === 'chat' ? 'active' : ''}">💬 الخاص</a><a href="#/messages/suggest" class="${tab === 'suggest' ? 'active' : ''}">💡 اقتراح</a></div>`;
  const again = () => render(el, [tab, arg]);
  if (tab === 'whatsapp') { location.replace('#/whatsapp'); return; }

  if (tab === 'suggest') {
    el.innerHTML = tabs + `<form class="card" data-sug><label>التصنيف</label><select name="cat">${['عام', 'القهوة', 'الطلعات', 'البرنامج', 'خدمات الحي'].map(c => `<option>${c}</option>`).join('')}</select>
      <label>اقتراحك</label><textarea name="msg" required maxlength="2000"></textarea><button class="btn primary block">إرسال الاقتراح</button><p class="muted">يصل الاقتراح للإدارة فقط.</p></form>`;
    const f = $('[data-sug]', el);
    f.onsubmit = e => { e.preventDefault(); busy(f.querySelector('button'), async () => {
      if (!(await requirePin())) return;
      const r = await call('submit_suggestion', { ...creds(), p_category: val(f, 'cat'), p_message: val(f, 'msg') });
      if (!r.ok) return toast(r.message, false);
      f.reset(); toast('شكرًا، وصل اقتراحك.');
    }); };
    return;
  }

  if (tab === 'private' || tab === 'chat') {
    if (!state.user || state.manager) return needLogin(el, tabs, again);
    if (!state.pin) { el.innerHTML = tabs + '<div class="card"><p>لأمان محادثاتك أدخل رقمك السري.</p><button class="btn primary" data-pin>🔐 تأكيد</button></div>'; $('[data-pin]', el).onclick = async () => { if (await requirePin()) again(); }; return; }
    const convs = await list('neighbor_list_conversations', creds());
    if (tab === 'chat') return chat(el, tabs, Number(arg), convs.data);
    el.innerHTML = tabs + `<div class="card">${!convs.ok ? `<p class="status bad">${esc(convs.message)}</p>` : convs.data.length ? `<div class="list">${convs.data.map(c => `
      <a class="row-item link" href="#/messages/chat/${c.recipient_id}"><div class="row-main"><b>💬 ${esc(c.recipient_name || memberName(c.recipient_id))}</b><small class="ellipsis">${esc(c.last_message || '')}</small></div>${c.unread_count ? `<span class="badge">${c.unread_count}</span>` : ''}</a>`).join('')}</div>`
      : empty('لا توجد محادثات. ابدأ من دليل الجيران.')}<a class="btn secondary block" href="#/neighbors">👥 اختر جارًا لمراسلته</a></div>`;
    return;
  }

  // المجموعة
  const ann = data.visibleAnnouncements(await data.announcements()).slice(0, 10);
  const annHtml = `<div class="card"><h3>🔔 الإعلانات والمناسبات</h3>${ann.length ? `<div class="list">${ann.map(a => `<div class="row-item"><div class="row-main"><b>${a.is_occasion ? (a.occasion_type === 'وطنية' ? '🇸🇦 ' : '🕌 ') : ''}${esc(a.title)}</b><p>${esc(a.message || '')}</p><small class="muted">${fmtDateTime(a.scheduled_at || a.created_at)}</small></div></div>`).join('')}</div>` : empty('لا توجد إعلانات.')}</div>`;
  if (!state.user) { el.innerHTML = tabs + annHtml + `<div class="card"><p>رسائل المجموعة متاحة للأعضاء.</p><button class="btn primary" data-login>🔐 دخول</button></div>`; $('[data-login]', el).onclick = async () => { if (await showLogin()) again(); }; return; }
  const [msgs, perms] = await Promise.all([data.groupMessages(true), data.permissions()]);
  const mine = perms.find(x => Number(x.member_id) === Number(state.user.id)) || {};
  // الإرسال للمجموعة يتحقق منه الخادم؛ نُظهر النموذج فقط لمن يملك الصلاحية.
  const canPost = state.supervisor || ['supervisor', 'super_admin'].includes(mine.role) || mine.can_send_group_messages === true || mine.can_send_messages === true;
  el.innerHTML = tabs + annHtml + `<div class="card"><h3>📢 رسائل المجموعة</h3><div class="chat-box" data-box>${msgs.length ? msgs.map(m => `<div class="bubble ${state.user && Number(m.sender_member_id) === Number(state.user.id) ? 'mine' : ''}"><b>${esc(m.sender_name || memberName(m.sender_member_id))}</b><p>${esc(m.message)}</p><small>${fmtDateTime(m.created_at)}</small></div>`).join('') : empty('لا توجد رسائل.')}</div>
    ${state.manager ? '<p class="muted">رسائل المدير تُرسل من لوحة الإدارة.</p>' : !canPost ? '<p class="muted">رسائل المجموعة تُرسل من الإدارة والمخوّلين. للتواصل مع جار استخدم «الخاص»، وللاقتراحات «اقتراح».</p>' : `<form class="compose" data-send><textarea name="msg" rows="2" maxlength="2000" placeholder="اكتب رسالة للمجموعة…" required></textarea><button class="btn primary">إرسال</button></form>`}</div>`;
  const box = $('[data-box]', el); box.scrollTop = box.scrollHeight;
  const f = $('[data-send]', el);
  if (f) f.onsubmit = e => { e.preventDefault(); busy(f.querySelector('button'), async () => {
    if (!(await requirePin())) return;
    const r = await call('send_group_message', { ...creds(), p_message: val(f, 'msg') });
    if (!r.ok) return toast(r.message, false);
    data.invalidate('messages'); again();
  }); };
}

async function chat(el, tabs, recipientId, convs) {
  let conv = convs.find(c => Number(c.recipient_id) === recipientId);
  const name = conv?.recipient_name || memberName(recipientId);
  el.innerHTML = tabs + `<div class="card"><div class="row-head"><b>💬 ${esc(name)}</b><a class="small-btn ghost" href="#/messages/private">كل المحادثات</a></div>
    <div class="chat-box" data-box><p class="muted">…</p></div>
    <form class="compose" data-send><input name="body" maxlength="2000" placeholder="اكتب رسالتك…" autocomplete="off" required><button class="btn primary">إرسال</button></form></div>`;
  const box = $('[data-box]', el);
  const read = async () => {
    if (!conv) { box.innerHTML = empty('ابدأ المحادثة برسالة.'); return; }
    const r = await list('neighbor_read_conversation', { ...creds(), p_conversation_id: conv.id });
    if (!r.ok) { box.innerHTML = `<p class="status bad">${esc(r.message)}</p>`; return; }
    box.innerHTML = r.data.length ? r.data.map(m => `<div class="bubble ${Number(m.sender_id) === Number(state.user.id) ? 'mine' : ''}"><p>${esc(m.body)}</p><small>${fmtDateTime(m.created_at)}</small>${Number(m.sender_id) !== Number(state.user.id) ? `<button class="link-btn tiny" data-report="${m.id}">إبلاغ</button>` : ''}</div>`).join('') : empty('ابدأ المحادثة.');
    box.scrollTop = box.scrollHeight;
    box.querySelectorAll('[data-report]').forEach(b => b.onclick = async () => {
      const res = await call('report_neighbor_message', { ...creds(), p_message_id: Number(b.dataset.report), p_reason: 'غير مناسب' });
      toast(res.ok ? 'تم إرسال البلاغ للإدارة.' : res.message, res.ok);
    });
  };
  await read();
  const timer = setInterval(() => { if (!box.isConnected) return clearInterval(timer); read(); }, 15000);
  const f = $('[data-send]', el);
  f.onsubmit = e => { e.preventDefault(); busy(f.querySelector('button'), async () => {
    const r = await call('neighbor_send_message', { ...creds(), p_recipient_id: recipientId, p_body: val(f, 'body') });
    if (!r.ok) return toast(r.message, false);
    if (!conv && r.data?.conversation_id) conv = { id: r.data.conversation_id, recipient_id: recipientId };
    f.reset(); read();
  }); };
}
