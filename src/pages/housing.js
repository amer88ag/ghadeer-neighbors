import { esc, toast, busy, empty, val, money } from '../lib/dom.js';
import { requirePin, creds } from '../lib/session.js';
import { call, list } from '../lib/api.js';
import { REAL_ESTATE, linkList } from '../lib/links.js';

const TYPES = { apartment: 'شقة', villa: 'فيلا', studio: 'استديو', floor: 'دور' };
const num = (f, k) => { const v = val(f, k); return v === '' ? null : Number(v); };

export async function render(el, [tab = 'all']) {
  const tabs = `<div class="segmented scroll"><a href="#/housing" class="${tab === 'all' ? 'active' : ''}">الكل</a><a href="#/housing/offer" class="${tab === 'offer' ? 'active' : ''}">🏠 عروض</a><a href="#/housing/request" class="${tab === 'request' ? 'active' : ''}">🔎 طلبات</a><a href="#/housing/new" class="${tab === 'new' ? 'active' : ''}">➕ إضافة</a><a href="#/housing/links" class="${tab === 'links' ? 'active' : ''}">🔗 منصات</a></div>`;

  if (tab === 'links') { el.innerHTML = tabs + `<div class="card"><p class="muted">تحقق دائمًا من ترخيص الإعلان والوسيط قبل التعامل.</p>${linkList(REAL_ESTATE)}</div>`; return; }

  if (tab === 'new') {
    el.innerHTML = tabs + `<form class="card" data-new>
      <label>النوع</label><select name="kind"><option value="offer">🏠 أعرض للإيجار</option><option value="request">🔎 أطلب سكنًا</option></select>
      <label>العنوان</label><input name="title" required placeholder="مثال: شقة 3 غرف للإيجار">
      <label>التفاصيل</label><textarea name="desc" placeholder="المواصفات والموقع"></textarea>
      <div class="grid2"><div><label>الحي</label><input name="district" value="الغدير"></div><div><label>نوع العقار</label><select name="ptype">${Object.entries(TYPES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></div></div>
      <div class="grid3"><div><label>الغرف</label><input name="beds" type="number" min="0"></div><div><label>دورات المياه</label><input name="baths" type="number" min="0"></div><div><label>المساحة م²</label><input name="area" type="number" min="0"></div></div>
      <div class="grid3"><div><label>شهري</label><input name="month" type="number" min="0"></div><div><label>سنوي</label><input name="year" type="number" min="0"></div><div><label>التأمين</label><input name="deposit" type="number" min="0"></div></div>
      <label class="check"><input type="checkbox" name="furnished"> مفروشة</label><label class="check"><input type="checkbox" name="parking"> موقف سيارة</label>
      <label>ملاحظة تواصل (اختياري)</label><input name="contact">
      <button class="btn primary block">نشر الإعلان</button></form>`;
    const f = el.querySelector('[data-new]');
    f.onsubmit = e => { e.preventDefault(); busy(f.querySelector('button'), async () => {
      if (!(await requirePin('نشر الإعلانات للأعضاء.'))) return;
      const r = await call('create_neighbor_rental', { ...creds(), p_kind: val(f, 'kind'), p_title: val(f, 'title'), p_description: val(f, 'desc'), p_city: 'أبها', p_district: val(f, 'district'), p_property_type: val(f, 'ptype'), p_bedrooms: num(f, 'beds'), p_bathrooms: num(f, 'baths'), p_area_m2: num(f, 'area'), p_furnished: f.furnished.checked, p_floor: null, p_parking: f.parking.checked, p_monthly_price: num(f, 'month'), p_yearly_price: num(f, 'year'), p_deposit: num(f, 'deposit'), p_contact_note: val(f, 'contact') });
      if (!r.ok) return toast(r.message, false);
      toast('تم نشر الإعلان.'); location.hash = '#/housing';
    }); };
    return;
  }

  const r = await list('list_neighbor_rentals', { p_kind: tab === 'all' ? null : tab });
  el.innerHTML = tabs + (!r.ok ? `<div class="card"><p class="status bad">${esc(r.message)}</p></div>` : r.data.length ? r.data.map(x => `<article class="card">
    <div class="row-head"><b>${x.kind === 'offer' ? '🏠 عرض إيجار' : '🔎 طلب سكن'}</b><span class="pill">${esc(TYPES[x.property_type] || x.property_type || 'شقة')}</span></div>
    <h3>${esc(x.title)}</h3>${x.description ? `<p>${esc(x.description)}</p>` : ''}
    <div class="facts"><span>📐 ${x.area_m2 ? esc(x.area_m2) + ' م²' : '—'}</span><span>🛏️ ${x.bedrooms ?? '-'} غرف</span><span>🚿 ${x.bathrooms ?? '-'}</span><span>${x.furnished ? '🛋️ مفروشة' : 'غير مفروشة'}</span><span>${x.parking ? '🚗 موقف' : 'بدون موقف'}</span></div>
    <div class="price">${x.monthly_price != null ? money(x.monthly_price) + ' / شهر' : ''}${x.yearly_price != null ? ' · ' + money(x.yearly_price) + ' / سنة' : ''}${x.deposit != null ? ' · تأمين ' + money(x.deposit) : ''}</div>
    <small class="muted">${esc(x.district || x.city || '')}${x.member_name ? ' · ' + esc(x.member_name) : ''}</small></article>`).join('') : `<div class="card">${empty('لا توجد إعلانات سكنية حاليًا.')}</div>`);
}
