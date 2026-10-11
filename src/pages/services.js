import { esc, toast, busy, empty, val, openModal } from '../lib/dom.js';
import { requirePin, creds } from '../lib/session.js';
import { call } from '../lib/api.js';
import { CATALOG } from '../lib/catalog.js';

const KINDS = {
  help: { label: '🤝 خدمات الجيران', key: 'help' },
  market: { label: '🛍️ سوق الحي', key: 'market' },
  initiative: { label: '💡 المبادرات', key: 'initiatives' }
};

function postForm(kind, preset = {}) {
  const fields = kind === 'initiative'
    ? `<label>اسم المبادرة</label><input name="title" value="${esc(preset.title || '')}" required><label>الفكرة والتفاصيل</label><textarea name="desc"></textarea>`
    : `<label>نوع المشاركة</label><select name="mode"><option value="طلب">🔎 أطلب</option><option value="عرض">🤝 أعرض</option></select>
       <label>العنوان</label><input name="title" value="${esc(preset.title || '')}" required placeholder="${kind === 'market' ? 'مثال: مكتب أطفال للبيع' : 'مثال: توصيل دواء لكبير سن'}">
       <label>التفاصيل (اختياري)</label><textarea name="desc" placeholder="المكان والوقت والتفاصيل"></textarea>`;
  return new Promise(resolve => {
    let posted = false;
    openModal({
      title: kind === 'initiative' ? 'إضافة مبادرة' : kind === 'market' ? 'إضافة إلى سوق الحي' : 'طلب أو عرض خدمة',
      body: `<form data-post>${fields}<button class="btn primary block">نشر</button><p class="muted">النشر باسمك كعضو في الحي.</p></form>`,
      onMount(card, close) {
        const f = card.querySelector('[data-post]');
        f.onsubmit = e => { e.preventDefault(); busy(f.querySelector('button'), async () => {
          if (!(await requirePin('النشر يتطلب تسجيل الدخول.'))) return;
          const t = val(f, 'title'), d = val(f, 'desc');
          const r = kind === 'help' ? await call('create_neighbor_help', { ...creds(), p_title: t, p_description: d, p_status: val(f, 'mode') })
            : kind === 'market' ? await call('create_neighbor_market', { ...creds(), p_kind: val(f, 'mode'), p_title: t, p_description: d })
            : await call('create_neighbor_initiative', { ...creds(), p_title: t, p_description: d });
          if (!r.ok) return toast(r.message, false);
          posted = true; close(); toast('تم النشر.');
        }); };
      },
      onClose: () => resolve(posted)
    });
  });
}

export async function render(el, [tab = 'help']) {
  const tabs = `<div class="segmented scroll">${Object.entries(KINDS).map(([k, v]) => `<a href="#/services/${k}" class="${tab === k ? 'active' : ''}">${v.label}</a>`).join('')}<a href="#/services/catalog" class="${tab === 'catalog' ? 'active' : ''}">📚 دليل الخدمات</a></div>`;

  if (tab === 'catalog') {
    el.innerHTML = tabs + `<p class="muted">اختر خدمة لتطلبها أو تعرضها على جيرانك.</p>` + Object.entries(CATALOG).map(([group, items]) => `<details class="card"><summary><b>${esc(group)}</b> <span class="muted">(${items.length})</span></summary>
      <div class="catalog">${items.map(([icon, name, desc]) => `<button class="cat-item" data-svc="${esc(name)}"><span>${icon}</span><b>${esc(name)}</b><small>${esc(desc)}</small></button>`).join('')}</div></details>`).join('');
    el.querySelectorAll('[data-svc]').forEach(b => b.onclick = async () => { if (await postForm('help', { title: b.dataset.svc })) location.hash = '#/services/help'; });
    return;
  }

  const kind = KINDS[tab] ? tab : 'help';
  const r = await call('list_neighbor_services');
  const rows = (r.ok && r.data?.[KINDS[kind].key]) || [];
  el.innerHTML = tabs + `<div class="card"><div class="row-head"><b>${KINDS[kind].label}</b><button class="btn primary" data-add>＋ إضافة</button></div>
    ${!r.ok ? `<p class="status bad">${esc(r.message)}</p>` : rows.length ? `<div class="list">${rows.map(a => `<div class="row-item col"><div class="row-head"><b>${esc(a.title || 'بدون عنوان')}</b><span class="pill">${esc(a.kind || a.status || 'مفتوحة')}</span></div>${a.description ? `<p>${esc(a.description)}</p>` : ''}<small class="muted">👤 ${esc(a.member_name || 'جار')}</small></div>`).join('')}</div>` : empty('لا توجد مشاركات منشورة حاليًا.')}</div>`;
  el.querySelector('[data-add]').onclick = async () => { if (await postForm(kind)) render(el, [kind]); };
}
