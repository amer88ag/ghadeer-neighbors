import { esc, toast, busy, fmtDate, todayISO, $ } from '../lib/dom.js';
import { state, requirePin, creds } from '../lib/session.js';
import { call } from '../lib/api.js';

/*
 * عروض اليوم: عروض يضيفها تجار وجيران الحي (تُراجع قبل النشر) أو تنشرها الإدارة مباشرة،
 * مع روابط صفحات العروض الرسمية للمتاجر الكبرى. لا يُجمع أي عرض آليًا من مواقع المتاجر دون إذن رسمي.
 */
export const CATS = [['all', 'الكل', '🏷️'], ['grocery', 'المواد الغذائية', '🛒'], ['electronics', 'الإلكترونيات', '📱'], ['pharmacy', 'الصيدليات', '💊'], ['local', 'محلات الحي', '🏪'], ['other', 'أخرى', '✨']];
const SOURCES = [
  ['🛒', 'بنده', 'https://www.panda.com.sa/'], ['🛒', 'العثيم', 'https://www.othaimmarkets.com/'], ['🛒', 'لولو', 'https://www.luluhypermarket.com/en-sa'],
  ['🛒', 'كارفور', 'https://www.carrefourksa.com/'], ['📱', 'إكسترا', 'https://www.extra.com/'], ['📱', 'جرير', 'https://www.jarir.com/'],
  ['💊', 'النهدي', 'https://www.nahdionline.com/'], ['💊', 'الدواء', 'https://www.al-dawaa.com/']
];
const FAV_KEY = 'ghadeer.offers.fav';
const favs = () => { try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]')); } catch { return new Set(); } };
const saveFavs = s => { try { localStorage.setItem(FAV_KEY, JSON.stringify([...s])); } catch { /* اختياري */ } };
const money = v => v == null || v === '' ? '' : Number(v).toLocaleString('ar-SA', { maximumFractionDigits: 2 }) + ' ر.س';
const daysLeft = d => Math.round((new Date(d + 'T23:59:59') - Date.now()) / 864e5);

export async function render(el, [tab = 'all']) {
  if (tab === 'new') return newForm(el);
  const r = await call('offers_list');
  const all = r.ok && Array.isArray(r.data) ? r.data : [];
  const fav = favs();
  const cat = CATS.some(c => c[0] === tab) || tab === 'fav' ? tab : 'all';
  el.innerHTML = `
    <div class="segmented scroll">${CATS.map(([k, l, i]) => `<a href="#/offers/${k}" class="${cat === k ? 'active' : ''}">${i} ${l}</a>`).join('')}<a href="#/offers/fav" class="${cat === 'fav' ? 'active' : ''}">⭐ المفضلة</a></div>
    <div class="input-row"><input type="search" data-q placeholder="ابحث عن منتج أو متجر…" aria-label="بحث في العروض"><a class="btn primary" href="#/offers/new">➕ أضف عرضًا</a></div>
    <div data-list></div>
    <section class="card"><h3>🔗 صفحات العروض الرسمية للمتاجر</h3><p class="muted">روابط مباشرة لمواقع المتاجر الرسمية. أسعارها ومدة عروضها كما تعلنها المتاجر.</p>
      <div class="links">${SOURCES.map(([i, n, u]) => `<a class="link-item" href="${esc(u)}" target="_blank" rel="noopener noreferrer"><b>${i} ${esc(n)}</b><span>↗</span></a>`).join('')}</div></section>`;
  const box = $('[data-list]', el);
  const draw = () => {
    const q = $('[data-q]', el).value.trim();
    const rows = all.filter(o => (cat === 'all' || (cat === 'fav' ? fav.has(o.id) : o.category === cat)) && (!q || (o.title + ' ' + o.store + ' ' + (o.description || '')).includes(q)));
    box.innerHTML = rows.length ? `<div class="offer-list">${rows.map(o => {
      const off = o.price_before && o.price_after ? Math.round((1 - o.price_after / o.price_before) * 100) : 0;
      const left = daysLeft(o.ends_on);
      const share = `🏷️ ${o.title}\n🏪 ${o.store}${o.branch ? ' — ' + o.branch : ''}${o.price_after ? '\n💰 ' + money(o.price_after) : ''}\n⏳ حتى ${fmtDate(o.ends_on)}\nمن «عروض اليوم» في جيران حي الغدير`;
      return `<article class="card offer" data-id="${o.id}">
        <div class="offer-head"><span class="pill">${(CATS.find(c => c[0] === o.category) || CATS[5])[2]} ${esc(o.store)}${o.branch ? ' · ' + esc(o.branch) : ''}</span>${off > 0 ? `<span class="offer-off">-${off}%</span>` : ''}</div>
        <h3>${esc(o.title)}</h3>${o.description ? `<p>${esc(o.description)}</p>` : ''}
        ${o.price_after ? `<p class="offer-price"><b>${money(o.price_after)}</b>${o.price_before ? ` <s>${money(o.price_before)}</s>` : ''}</p>` : ''}
        <p class="muted small">⏳ ${left <= 0 ? 'ينتهي اليوم' : left === 1 ? 'ينتهي غدًا' : `باقي ${left} أيام`} · حتى ${fmtDate(o.ends_on)}${o.submitter_name ? ' · أضافه ' + esc(o.submitter_name) : ''}</p>
        <div class="actions small">
          <button class="small-btn" data-fav>${fav.has(o.id) ? '⭐ في المفضلة' : '☆ حفظ'}</button>
          <a class="small-btn wa" href="https://wa.me/?text=${encodeURIComponent(share)}" target="_blank" rel="noopener">💬 مشاركة</a>
          ${o.link ? `<a class="small-btn" href="${esc(o.link)}" target="_blank" rel="noopener">المصدر ↗</a>` : ''}
          <button class="small-btn ghost" data-report>⚠️ إبلاغ</button></div></article>`;
    }).join('')}</div>` : `<p class="empty">${cat === 'fav' ? 'لم تحفظ عروضًا بعد.' : 'لا توجد عروض منشورة في هذا القسم حاليًا.'}</p>`;
    box.querySelectorAll('.offer').forEach(card => {
      const id = Number(card.dataset.id);
      $('[data-fav]', card).onclick = () => { fav.has(id) ? fav.delete(id) : fav.add(id); saveFavs(fav); draw(); };
      $('[data-report]', card).onclick = e => busy(e.currentTarget, async () => {
        if (!(await requirePin())) return;
        const res = await call('offer_report', { ...creds(), p_offer_id: id, p_reason: 'منتهي أو غير صحيح' });
        toast(res.ok ? res.data?.message || 'تم الإبلاغ.' : res.message, res.ok);
      });
    });
  };
  $('[data-q]', el).oninput = draw;
  draw();
}

function newForm(el) {
  const staff = state.manager || state.supervisor;
  const end = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  el.innerHTML = `<a class="btn secondary" href="#/offers">→ العروض</a>
    <form class="card" data-offer><h3>➕ إضافة عرض</h3>
      <p class="muted">${staff ? 'العروض التي تضيفها الإدارة تُنشر مباشرة.' : 'يُراجع العرض من الإدارة قبل نشره.'} أضف عروضًا حقيقية بسعرها ومدتها كما أعلنها المتجر.</p>
      <label>عنوان العرض</label><input name="ttl" maxlength="150" required placeholder="مثال: خصم 20% على الخبز">
      <label>التصنيف</label><select name="cat">${CATS.slice(1).map(([k, l, i]) => `<option value="${k}"${k === 'local' ? ' selected' : ''}>${i} ${l}</option>`).join('')}</select>
      <div class="grid2"><div><label>المتجر</label><input name="store" maxlength="80" required></div><div><label>الفرع (اختياري)</label><input name="branch" maxlength="80"></div></div>
      <div class="grid2"><div><label>السعر قبل (اختياري)</label><input name="pb" type="number" min="0" step="0.01" inputmode="decimal"></div><div><label>السعر بعد (اختياري)</label><input name="pa" type="number" min="0" step="0.01" inputmode="decimal"></div></div>
      <div class="grid2"><div><label>يبدأ</label><input name="from" type="date" value="${todayISO()}" required></div><div><label>ينتهي</label><input name="to" type="date" value="${end}" required></div></div>
      <label>تفاصيل (اختياري)</label><textarea name="desc" rows="3" maxlength="600"></textarea>
      <label>رابط العرض الرسمي (اختياري)</label><input name="link" dir="ltr" placeholder="https://">
      <button class="btn primary block">📤 ${staff ? 'نشر العرض' : 'إرسال للمراجعة'}</button></form>`;
  const f = $('[data-offer]', el);
  f.onsubmit = e => { e.preventDefault(); busy(f.querySelector('button'), async () => {
    if (!(await requirePin())) return;
    const who = state.manager ? { p_member_id: 0, p_pin: state.pin } : creds();
    const num = v => v === '' ? null : Number(v);
    const r = await call('offer_submit', { ...who, p_title: f.ttl.value, p_description: f.desc.value, p_category: f.cat.value, p_store: f.store.value, p_branch: f.branch.value,
      p_price_before: num(f.pb.value), p_price_after: num(f.pa.value), p_link: f.link.value, p_starts_on: f.from.value || null, p_ends_on: f.to.value || null });
    if (!r.ok) return toast(r.message, false);
    toast(r.data?.message || 'تم.'); location.hash = '#/offers';
  }); };
}

/** مراجعة العروض في لوحة الإدارة. */
export async function adminView(el, again, who) {
  const r = await call('staff_list_offers', who);
  const rows = r.ok && Array.isArray(r.data?.items) ? r.data.items : [];
  const label = { pending: '⏳ بانتظار المراجعة', published: '🟢 منشور', hidden: '🙈 مخفي' };
  el.innerHTML = `<p class="muted">العروض التي يرسلها الأعضاء تنتظر موافقتك هنا. العروض المبلَّغ عنها تظهر أولًا. <a href="#/offers/new">➕ أضف عرضًا</a></p>
    ${!r.ok ? `<p class="status bad">${esc(r.message)}</p>` : rows.length ? `<div class="list">${rows.map(o => `<div class="row-item col"><div class="row-head"><b>${esc(o.title)}</b><span class="pill">${label[o.status] || esc(o.status)}</span></div>
      <small class="muted">${esc(o.store)}${o.branch ? ' · ' + esc(o.branch) : ''} · ${o.price_after ? money(o.price_after) + ' · ' : ''}حتى ${fmtDate(o.ends_on)} · ${esc(o.submitter_name || '')}${o.reports ? ` · ⚠️ ${o.reports} بلاغ` : ''}</small>
      ${o.link ? `<a href="${esc(o.link)}" target="_blank" rel="noopener" class="small">المصدر ↗</a>` : ''}
      <div class="actions small">${o.status !== 'published' ? `<button class="small-btn" data-st="published" data-id="${o.id}">✅ نشر</button>` : ''}${o.status !== 'hidden' ? `<button class="small-btn ghost" data-st="hidden" data-id="${o.id}">🙈 إخفاء</button>` : ''}<button class="small-btn danger" data-st="rejected" data-id="${o.id}">⛔ رفض</button></div></div>`).join('')}</div>` : '<p class="empty">لا توجد عروض للمراجعة.</p>'}`;
  el.querySelectorAll('[data-st]').forEach(b => b.onclick = () => busy(b, async () => {
    const res = await call('staff_review_offer', { ...who, p_offer_id: Number(b.dataset.id), p_status: b.dataset.st, p_note: null });
    toast(res.ok ? res.data?.message || 'تم.' : res.message, res.ok); if (res.ok) again();
  }));
}
