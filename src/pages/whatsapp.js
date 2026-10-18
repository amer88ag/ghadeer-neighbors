import { esc, toast, busy, empty, fmtDate, fmtTime, todayISO, $ } from '../lib/dom.js';
import { state, memberName, requirePin, creds } from '../lib/session.js';
import { call } from '../lib/api.js';
import * as data from '../lib/data.js';

/*
 * ربط البرنامج بالواتساب العادي: رقم العضو بإذنه، مراسلة الجيران الذين سمحوا بذلك،
 * رابط قروب الحي، ومشاركة مواعيد القهوة والطلعة في القروب بضغطة.
 * (الإرسال يتم من واتساب العضو نفسه عبر روابط wa.me؛ لا يرسل البرنامج رسائل نيابة عن أحد.)
 */
const wa = text => 'https://wa.me/?text=' + encodeURIComponent(text);

export async function render(el) {
  if (state.manager) return managerView(el);
  if (!(await requirePin())) { el.innerHTML = '<div class="card"><p>أدخل رقمك السري لعرض إعدادات الواتساب.</p></div>'; return; }
  const [mine, list, coffee, outings] = await Promise.all([call('member_get_whatsapp', creds()), call('neighbors_whatsapp_list', creds()), data.coffee(), data.outings()]);
  const me = mine.ok ? mine.data : {}, people = list.ok ? (list.data.items || []).filter(p => Number(p.id) !== Number(state.user.id)) : [];
  const group = me.group_link || list.data?.group_link || '';
  const today = todayISO(), c = coffee.find(x => x.coffee_date >= today), o = outings.find(x => x.outing_date >= today);
  const coffeeMsg = c && `☕ تذكير بقهوة الجيران\nالمضيف: ${memberName(c.member_id)}\nالموعد: ${fmtDate(c.coffee_date)}${c.coffee_time ? ' — ' + fmtTime(c.coffee_time) : ''}${c.hijri_date ? '\n' + c.hijri_date : ''}\nحيّاكم الله 🌿`;
  const outingMsg = o && `🚐 تذكير بطلعة الجيران\nالمنظمان: ${memberName(o.member1_id)} و${memberName(o.member2_id)}\nالموعد: ${fmtDate(o.outing_date)}${o.outing_time ? ' — ' + fmtTime(o.outing_time) : ''}${o.hijri_date ? '\n' + o.hijri_date : ''}\nحيّاكم الله 🌿`;
  el.innerHTML = `
    ${group ? `<a class="btn wa block" href="${esc(group)}" target="_blank" rel="noopener">👥 قروب جيران الغدير على الواتساب</a>` : '<p class="muted center">لم يُضف رابط قروب الحي بعد.</p>'}
    <section class="card"><h3>📤 مشاركة في القروب</h3><div class="actions">
      ${coffeeMsg ? `<a class="btn secondary" href="${esc(wa(coffeeMsg))}" target="_blank" rel="noopener">☕ موعد القهوة القادم</a>` : ''}
      ${outingMsg ? `<a class="btn secondary" href="${esc(wa(outingMsg))}" target="_blank" rel="noopener">🚐 الطلعة القادمة</a>` : ''}
      <a class="btn secondary" href="#/invite">💌 دعوة جار جديد</a></div></section>
    <form class="card" data-mine><h3>📱 رقم واتسابي</h3><p class="muted">اختياري. يظهر رقمك للجيران الأعضاء فقط إذا سمحت بذلك، ولا يظهر للزوار.</p>
      <label>رقم الجوال</label><input name="phone" inputmode="tel" dir="ltr" placeholder="05xxxxxxxx" value="${esc(me.phone || '')}">
      <label class="check"><input type="checkbox" name="allow" ${me.allow ? 'checked' : ''}> أسمح للجيران بمراسلتي عبر الواتساب</label>
      <button class="btn primary block">💾 حفظ</button></form>
    <section class="card"><h3>💬 مراسلة الجيران عبر الواتساب</h3>${people.length ? `<div class="list">${people.map(p => `<div class="row-item"><div class="row-main"><b>${esc(p.name)}</b></div>
      <a class="small-btn wa" href="https://wa.me/${esc(p.wa)}?text=${encodeURIComponent('السلام عليكم ' + p.name.split(' ')[0] + '، معك جارك ' + state.user.name.split(' ')[0] + ' من جيران حي الغدير 🌿')}" target="_blank" rel="noopener">💬 مراسلة</a></div>`).join('')}</div>` : empty('لم يسمح أحد من الجيران بالمراسلة عبر الواتساب بعد.')}</section>`;
  const f = $('[data-mine]', el);
  f.onsubmit = e => { e.preventDefault(); busy(f.querySelector('button'), async () => {
    const r = await call('member_set_whatsapp', { ...creds(), p_phone: f.phone.value, p_allow: f.allow.checked });
    if (!r.ok) return toast(r.message, false);
    toast(r.data?.message || 'تم الحفظ.'); render(el);
  }); };
}

async function managerView(el) {
  el.innerHTML = `<form class="card" data-group><h3>👥 رابط قروب الواتساب</h3><p class="muted">يظهر للأعضاء فقط في صفحة «واتساب الجيران». انسخه من الواتساب: معلومات القروب ← دعوة عبر رابط.</p>
    <input name="link" dir="ltr" placeholder="https://chat.whatsapp.com/..."><button class="btn primary block">💾 حفظ الرابط</button></form>
    <p class="muted center">مراسلة الجيران ومشاركة المواعيد تظهر للأعضاء بعد دخولهم.</p>`;
  const f = $('[data-group]', el);
  f.onsubmit = e => { e.preventDefault(); busy(f.querySelector('button'), async () => {
    const r = await call('manager_set_whatsapp_group', { p_manager_pin: state.pin, p_link: f.link.value });
    toast(r.ok ? (r.data?.message || 'تم الحفظ.') : r.message, r.ok);
  }); };
}
