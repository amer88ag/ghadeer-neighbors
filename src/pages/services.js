import { esc, toast, busy, empty, val, openModal, fmtDateTime } from '../lib/dom.js';
import { requirePin, creds } from '../lib/session.js';
import { call } from '../lib/api.js';
import { CATALOG } from '../lib/catalog.js';

/*
 * أقسام خدمات الحي. كل قسم يحدد: مصدر البيانات، الأنواع المسموحة (مطابقة لقيود قاعدة البيانات)، ودالة النشر.
 * help: neighbor_help.kind ∈ request|offer
 * market/lost: neighbor_market.kind ∈ للبيع|للإهداء|مطلوب|مفقود|معثور عليه
 * initiative: neighbor_initiatives (الوصف إلزامي)
 */
const SECTIONS = {
  help: {
    label: '🤝 خدمات الجيران', title: 'طلب أو عرض خدمة', source: 'help',
    kinds: [['request', '🔎 أطلب خدمة'], ['offer', '🤝 أعرض خدمة']],
    names: { request: '🔎 طلب', offer: '🤝 عرض' }, placeholder: 'مثال: توصيل دواء لكبير سن',
    post: (f, t, d) => call('create_neighbor_help', { ...creds(), p_title: t, p_description: d, p_status: val(f, 'mode') })
  },
  market: {
    label: '🛍️ سوق الحي', title: 'إضافة إلى سوق الحي', source: 'market',
    kinds: [['للبيع', '🏷️ للبيع'], ['للإهداء', '🎁 للإهداء'], ['مطلوب', '🔎 مطلوب']],
    filter: x => ['للبيع', 'للإهداء', 'مطلوب'].includes(x.kind), placeholder: 'مثال: مكتب أطفال',
    post: (f, t, d) => call('create_neighbor_market', { ...creds(), p_kind: val(f, 'mode'), p_title: t, p_description: d })
  },
  lost: {
    label: '🔎 المفقودات', title: 'إبلاغ عن مفقود أو معثور عليه', source: 'market',
    kinds: [['مفقود', '❓ فقدت شيئًا'], ['معثور عليه', '✅ وجدت شيئًا']],
    filter: x => ['مفقود', 'معثور عليه'].includes(x.kind), placeholder: 'مثال: مفاتيح سيارة قرب المسجد',
    post: (f, t, d) => call('create_neighbor_market', { ...creds(), p_kind: val(f, 'mode'), p_title: t, p_description: d })
  },
  initiative: {
    label: '💡 المبادرات', title: 'إضافة مبادرة', source: 'initiatives', descRequired: true, placeholder: 'مثال: تشجير مدخل الحي',
    post: (f, t, d) => call('create_neighbor_initiative', { ...creds(), p_title: t, p_description: d })
  }
};

function postForm(key, preset = {}) {
  const s = SECTIONS[key];
  return new Promise(resolve => {
    let posted = false;
    openModal({
      title: s.title,
      body: `<form data-post>
        ${s.kinds ? `<label>نوع المشاركة</label><select name="mode">${s.kinds.map(([v, l]) => `<option value="${esc(v)}">${l}</option>`).join('')}</select>` : ''}
        <label>العنوان</label><input name="title" value="${esc(preset.title || '')}" maxlength="200" required placeholder="${esc(s.placeholder)}">
        <label>التفاصيل ${s.descRequired ? '' : '<span class="muted">(اختياري)</span>'}</label><textarea name="desc" maxlength="2000" ${s.descRequired ? 'required' : ''} placeholder="المكان والوقت والتفاصيل"></textarea>
        <button class="btn primary block">نشر</button><p class="muted">النشر باسمك كعضو في الحي.</p></form>`,
      onMount(card, close) {
        const f = card.querySelector('[data-post]');
        f.onsubmit = e => { e.preventDefault(); busy(f.querySelector('button'), async () => {
          if (!(await requirePin('النشر يتطلب تسجيل الدخول.'))) return;
          const r = await s.post(f, val(f, 'title'), val(f, 'desc'));
          if (!r.ok) return toast(r.message, false);
          posted = true; close(); toast('تم النشر.');
        }); };
      },
      onClose: () => resolve(posted)
    });
  });
}

export async function render(el, [tab = 'help']) {
  const tabs = `<div class="segmented scroll">${Object.entries(SECTIONS).map(([k, v]) => `<a href="#/services/${k}" class="${tab === k ? 'active' : ''}">${v.label}</a>`).join('')}<a href="#/services/catalog" class="${tab === 'catalog' ? 'active' : ''}">📚 دليل الخدمات</a></div>`;

  if (tab === 'catalog') {
    el.innerHTML = tabs + `<p class="muted">اختر خدمة لتطلبها أو تعرضها على جيرانك.</p>` + Object.entries(CATALOG).map(([group, items]) => `<details class="card"><summary><b>${esc(group)}</b> <span class="muted">(${items.length})</span></summary>
      <div class="catalog">${items.map(([icon, name, desc]) => `<button class="cat-item" data-svc="${esc(name)}"><span>${icon}</span><b>${esc(name)}</b><small>${esc(desc)}</small></button>`).join('')}</div></details>`).join('');
    el.querySelectorAll('[data-svc]').forEach(b => b.onclick = async () => { if (await postForm('help', { title: b.dataset.svc })) location.hash = '#/services/help'; });
    return;
  }

  const key = SECTIONS[tab] ? tab : 'help';
  const s = SECTIONS[key];
  const r = await call('list_neighbor_services');
  const rows = ((r.ok && r.data?.[s.source]) || []).filter(x => !s.filter || s.filter(x));
  el.innerHTML = tabs + `<div class="card"><div class="row-head"><b>${s.label}</b><button class="btn primary" data-add>＋ إضافة</button></div>
    ${!r.ok ? `<p class="status bad">${esc(r.message)}</p>` : rows.length ? `<div class="list">${rows.map(a => `<div class="row-item col">
      <div class="row-head"><b>${esc(a.title || 'بدون عنوان')}</b>${a.kind ? `<span class="pill">${esc(s.names?.[a.kind] || a.kind)}</span>` : ''}</div>
      ${a.description ? `<p>${esc(a.description)}</p>` : ''}<small class="muted">👤 ${esc(a.member_name || 'جار')} · ${fmtDateTime(a.created_at)}</small></div>`).join('')}</div>` : empty('لا توجد مشاركات منشورة حاليًا.')}</div>`;
  el.querySelector('[data-add]').onclick = async () => { if (await postForm(key)) render(el, [key]); };
}
