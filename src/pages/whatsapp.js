import { esc, toast, busy, fmtDate, fmtTime, todayISO, $ } from '../lib/dom.js';
import { state, memberName, requirePin, creds } from '../lib/session.js';
import { call } from '../lib/api.js';
import * as data from '../lib/data.js';

/*
 * واتساب: يفتح تطبيق واتساب في جوال العضو مباشرة.
 * - مراسلة شخص: برقم يكتبه، أو من جهات اتصال الجوال (حيث يدعم المتصفح ذلك)، أو من الجيران الذين سمحوا.
 * - رسالة لمجموعة: يكتب الرسالة ثم يختار القروب أو الأشخاص داخل واتساب، أو يفتح قروب الحي.
 * - رقمي: رقم واتساب العضو وإذنه للجيران بمراسلته.
 * الرسائل تُرسل من واتساب العضو نفسه؛ البرنامج لا يرسل نيابة عن أحد.
 */
const TABS = [['person', '👤 مراسلة شخص'], ['group', '👥 رسالة لمجموعة'], ['mine', '📱 رقمي']];
const toIntl = v => {
  let d = String(v || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('05') && d.length === 10) d = '966' + d.slice(1);
  else if (d.startsWith('5') && d.length === 9) d = '966' + d;
  return d.length >= 10 && d.length <= 15 ? d : '';
};
const waTo = (num, text) => `https://wa.me/${num}${text ? '?text=' + encodeURIComponent(text) : ''}`;
const waShare = text => 'https://wa.me/?text=' + encodeURIComponent(text);
// يفتح واتساب في نفس النافذة (على الجوال يفتح التطبيق مباشرة). window.__waOpen خطّاف للاختبارات فقط.
const open = url => (window.__waOpen || (u => { location.href = u; }))(url);

export async function render(el, [tab = 'person']) {
  if (state.manager) return managerView(el);
  if (!(await requirePin())) { el.innerHTML = '<div class="card"><p>أدخل رقمك السري لاستخدام واتساب من البرنامج.</p></div>'; return; }
  const [mine, list] = await Promise.all([call('member_get_whatsapp', creds()), call('neighbors_whatsapp_list', creds())]);
  const me = mine.ok ? mine.data : {};
  const people = list.ok ? (list.data.items || []).filter(p => Number(p.id) !== Number(state.user.id)) : [];
  const group = me.group_link || list.data?.group_link || '';
  const tabs = `<div class="segmented">${TABS.map(([k, l]) => `<a href="#/whatsapp/${k}" class="${tab === k ? 'active' : ''}">${l}</a>`).join('')}</div>`;
  const first = state.user.name.split(' ')[0];

  if (tab === 'group') {
    const [coffee, outings] = await Promise.all([data.coffee(), data.outings()]);
    const today = todayISO(), c = coffee.find(x => x.coffee_date >= today), o = outings.find(x => x.outing_date >= today);
    const tpl = {
      general: `السلام عليكم يا جيران 🌿\n\n`,
      coffee: c ? `☕ تذكير بقهوة الجيران\nالمضيف: ${memberName(c.member_id)}\nالموعد: ${fmtDate(c.coffee_date)}${c.coffee_time ? ' — ' + fmtTime(c.coffee_time) : ''}\nحيّاكم الله 🌿` : '',
      outing: o ? `🚐 تذكير بطلعة الجيران\nالمنظمان: ${memberName(o.member1_id)} و${memberName(o.member2_id)}\nالموعد: ${fmtDate(o.outing_date)}${o.outing_time ? ' — ' + fmtTime(o.outing_time) : ''}\nحيّاكم الله 🌿` : '',
      app: `برنامج جيران حي الغدير: ${location.origin}${location.pathname}`
    };
    el.innerHTML = tabs + `
      <form class="card" data-group><h3>👥 رسالة لمجموعة</h3>
        <div class="chips">${[['general', 'رسالة عامة'], ['coffee', '☕ موعد القهوة'], ['outing', '🚐 الطلعة'], ['app', '🔗 رابط البرنامج']].filter(([k]) => tpl[k]).map(([k, l]) => `<button type="button" class="chip" data-tpl="${k}">${l}</button>`).join('')}</div>
        <label>نص الرسالة</label><textarea name="msg" rows="6" required>${esc(tpl.general)}</textarea>
        <button class="btn wa block">💬 اختيار المجموعة في واتساب وإرسال</button>
        <p class="muted small">يفتح واتساب في جوالك برسالتك جاهزة، ثم تختار القروب أو الأشخاص.</p></form>
      ${group ? `<a class="btn secondary block" href="${esc(group)}" target="_blank" rel="noopener">🏘️ فتح قروب جيران الغدير</a>` : '<p class="muted center">لم يُضف رابط قروب الحي بعد.</p>'}`;
    const f = $('[data-group]', el);
    el.querySelectorAll('[data-tpl]').forEach(b => b.onclick = () => { f.msg.value = tpl[b.dataset.tpl]; f.msg.focus(); });
    f.onsubmit = e => { e.preventDefault(); if (!f.msg.value.trim()) return toast('اكتب الرسالة.', false); open(waShare(f.msg.value.trim())); };
    return;
  }

  if (tab === 'mine') {
    el.innerHTML = tabs + `<form class="card" data-mine><h3>📱 رقم واتسابي</h3><p class="muted">اختياري. يظهر رقمك للجيران الأعضاء فقط إذا سمحت بذلك، ولا يظهر للزوار.</p>
      <label>رقم الجوال</label><input name="phone" inputmode="tel" dir="ltr" placeholder="05xxxxxxxx" value="${esc(me.phone || '')}">
      <label class="check"><input type="checkbox" name="allow" ${me.allow ? 'checked' : ''}> أسمح للجيران بمراسلتي عبر الواتساب</label>
      <button class="btn primary block">💾 حفظ</button></form>`;
    const f = $('[data-mine]', el);
    f.onsubmit = e => { e.preventDefault(); busy(f.querySelector('button'), async () => {
      const r = await call('member_set_whatsapp', { ...creds(), p_phone: f.phone.value, p_allow: f.allow.checked });
      if (!r.ok) return toast(r.message, false);
      toast(r.data?.message || 'تم الحفظ.'); render(el, ['mine']);
    }); };
    return;
  }

  const canPick = 'contacts' in navigator && 'select' in (navigator.contacts || {});
  el.innerHTML = tabs + `
    <form class="card" data-person><h3>👤 مراسلة شخص</h3>
      <label>رقم الجوال</label><div class="input-row"><input name="phone" inputmode="tel" dir="ltr" placeholder="05xxxxxxxx" autocomplete="tel">${canPick ? '<button type="button" class="btn secondary" data-pick>📇 جهات الاتصال</button>' : ''}</div>
      <label>الرسالة (اختياري)</label><textarea name="msg" rows="4">السلام عليكم، معك ${esc(first)} من جيران حي الغدير 🌿</textarea>
      <button class="btn wa block">💬 فتح المحادثة في واتساب</button></form>
    <section class="card"><h3>👥 جيران سمحوا بالمراسلة</h3>${people.length ? `<div class="list">${people.map(p => `<div class="row-item"><div class="row-main"><b>${esc(p.name)}</b></div>
      <a class="small-btn wa" href="${esc(waTo(p.wa, `السلام عليكم ${p.name.split(' ')[0]}، معك جارك ${first} من جيران حي الغدير 🌿`))}">💬 مراسلة</a></div>`).join('')}</div>`
      : '<p class="muted">لم يسمح أحد من الجيران بالمراسلة بعد. يستطيع كل عضو السماح من تبويب «رقمي».</p>'}</section>`;
  const f = $('[data-person]', el);
  $('[data-pick]', el)?.addEventListener('click', async () => {
    try { const [c] = await navigator.contacts.select(['tel', 'name'], { multiple: false }); if (c?.tel?.[0]) f.phone.value = c.tel[0]; }
    catch { /* أُلغي الاختيار */ }
  });
  f.onsubmit = e => {
    e.preventDefault();
    const num = toIntl(f.phone.value);
    if (!num) return toast('اكتب رقم جوال صحيحًا، مثل 05xxxxxxxx.', false);
    open(waTo(num, f.msg.value.trim()));
  };
}

async function managerView(el) {
  el.innerHTML = `<form class="card" data-group-link><h3>👥 رابط قروب الواتساب</h3><p class="muted">يظهر للأعضاء في أيقونة «واتساب». انسخه من الواتساب: معلومات القروب ← دعوة عبر رابط.</p>
    <input name="link" dir="ltr" placeholder="https://chat.whatsapp.com/..."><button class="btn primary block">💾 حفظ الرابط</button></form>
    <p class="muted center">مراسلة الأشخاص والمجموعات تظهر للأعضاء بعد دخولهم.</p>`;
  const f = $('[data-group-link]', el);
  f.onsubmit = e => { e.preventDefault(); busy(f.querySelector('button'), async () => {
    const r = await call('manager_set_whatsapp_group', { p_manager_pin: state.pin, p_link: f.link.value });
    toast(r.ok ? (r.data?.message || 'تم الحفظ.') : r.message, r.ok);
  }); };
}
