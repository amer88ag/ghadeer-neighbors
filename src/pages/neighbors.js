import { esc, toast, busy, empty, val, $ } from '../lib/dom.js';
import { state, activeMembers, requirePin, creds, showLogin } from '../lib/session.js';
import { call } from '../lib/api.js';
import * as data from '../lib/data.js';

const RESIDENCY = { owner: '🏠 مالك', tenant: '🔑 مستأجر', both: '🏠🔑 مالك ومستأجر', unspecified: 'غير محدد' };

export async function render(el, [tab = 'list']) {
  const tabs = `<div class="segmented"><a href="#/neighbors" class="${tab === 'list' ? 'active' : ''}">👥 دليل الجيران</a><a href="#/neighbors/me" class="${tab === 'me' ? 'active' : ''}">🪪 بطاقتي</a></div>`;
  const profiles = await data.profiles();
  const byId = new Map(profiles.map(p => [Number(p.member_id), p]));

  if (tab === 'me') {
    if (!state.user || state.manager) {
      el.innerHTML = tabs + `<div class="card"><p>سجّل الدخول كعضو لتعديل بطاقتك.</p><button class="btn primary" data-login>🔐 دخول</button></div>`;
      $('[data-login]', el).onclick = async () => { if (await showLogin()) render(el, ['me']); };
      return;
    }
    const me = byId.get(Number(state.user.id)) || {};
    el.innerHTML = tabs + `
      <form class="card" data-profile><h3>🪪 بطاقتي التعريفية</h3><p class="muted">كل الحقول اختيارية ما عدا الاسم. تظهر للجيران في الدليل.</p>
        <label>الاسم الرباعي</label><input name="full" value="${esc(me.full_name || state.user.name)}" required>
        <label>المهنة</label><input name="occupation" value="${esc(me.occupation || '')}">
        <label>جوال للتواصل (يظهر للجيران)</label><input name="phone" inputmode="tel" value="${esc(me.phone_public || '')}">
        <label>نبذة</label><textarea name="bio">${esc(me.bio || '')}</textarea>
        <button class="btn primary block">💾 حفظ بطاقتي</button></form>
      <form class="card" data-residency><h3>🏘️ صفة السكن</h3><select name="type">${Object.entries(RESIDENCY).map(([k, v]) => `<option value="${k}"${me.residency_type === k ? ' selected' : ''}>${v}</option>`).join('')}</select><button class="btn secondary block">حفظ</button></form>
      <form class="card" data-contact><h3>📞 طرق التواصل المسموحة</h3>
        <label class="check"><input type="checkbox" name="inapp" ${me.contact_in_app === false ? '' : 'checked'}> 💬 رسائل داخل البرنامج</label>
        <label class="check"><input type="checkbox" name="whats" ${me.contact_whatsapp ? 'checked' : ''}> 📱 واتساب</label>
        <label class="check"><input type="checkbox" name="phone" ${me.contact_phone ? 'checked' : ''}> ☎️ اتصال</label>
        <button class="btn secondary block">حفظ</button></form>`;
    const submit = (sel, fn) => { const f = $(sel, el); f.onsubmit = e => { e.preventDefault(); busy(f.querySelector('button'), async () => { if (!(await requirePin())) return; const r = await fn(f); if (!r.ok) return toast(r.message, false); toast('تم الحفظ.'); data.invalidate('profiles'); }); }; };
    submit('[data-profile]', f => call('save_member_profile', { ...creds(), p_full_name: val(f, 'full'), p_bio: val(f, 'bio'), p_phone_public: val(f, 'phone'), p_occupation: val(f, 'occupation') }));
    submit('[data-residency]', f => call('set_neighbor_residency_type', { ...creds(), p_residency_type: val(f, 'type') }));
    submit('[data-contact]', f => call('neighbor_set_message_settings', { ...creds(), p_in_app: f.inapp.checked, p_whatsapp: f.whats.checked, p_phone: f.phone.checked }));
    return;
  }

  el.innerHTML = tabs + `<input class="search" type="search" placeholder="🔎 ابحث باسم الجار أو مهنته" data-q><div class="members" data-grid></div>`;
  const grid = $('[data-grid]', el);
  const draw = q => {
    const rows = activeMembers().filter(m => { const p = byId.get(Number(m.id)); return !q || m.name.includes(q) || (p?.full_name || '').includes(q) || (p?.occupation || '').includes(q); });
    grid.innerHTML = rows.length ? rows.map(m => {
      const p = byId.get(Number(m.id)) || {};
      const self = state.user && Number(state.user.id) === Number(m.id);
      return `<article class="member"><div class="avatar">${esc((p.full_name || m.name).trim().charAt(0))}</div><div class="member-info"><b>${esc(p.full_name || m.name)}</b>
        ${p.occupation ? `<small>💼 ${esc(p.occupation)}</small>` : ''}${p.residency_type && p.residency_type !== 'unspecified' ? `<small>${RESIDENCY[p.residency_type] || ''}</small>` : ''}
        ${p.bio ? `<p>${esc(p.bio)}</p>` : ''}
        <div class="actions small">${!self && state.user && !state.manager ? `<a class="small-btn" href="#/messages/chat/${m.id}">💬 مراسلة</a>` : ''}${p.phone_public ? `<a class="small-btn ghost" href="tel:${esc(p.phone_public)}">☎️ اتصال</a>` : ''}</div></div></article>`;
    }).join('') : empty('لا توجد نتائج.');
  };
  $('[data-q]', el).oninput = e => draw(e.target.value.trim());
  draw('');
}
