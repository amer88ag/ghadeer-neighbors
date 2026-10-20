import { esc, toast, busy, fmtDate, fmtDateTime, todayISO, $ } from '../lib/dom.js';
import { state, requirePin, creds } from '../lib/session.js';
import { call } from '../lib/api.js';
import { AREAS, DEFAULT_AREA, nearestArea } from '../lib/health-areas.js';

/*
 * الدليل الصحي: منشآت حكومية وخاصة، أطباء، أسعار الكشف والخدمات، وعروض صحية — حسب المدينة التي يختارها المستخدم.
 * المصادر: OpenStreetMap (بيانات مفتوحة، تُجلب للمدينة المطلوبة فقط)، ومساهمات الأعضاء والمنشآت بعد مراجعة الإدارة،
 * وروابط الجهات الرسمية. لا تُعرض بيانات تجريبية، ولا يقدم الدليل تشخيصًا أو توصية علاجية.
 */
export const KINDS = [['hospital', '🏥', 'مستشفى'], ['clinic', '🩺', 'مجمع/عيادة'], ['phc', '🏠', 'مركز صحي'], ['pharmacy', '💊', 'صيدلية'],
  ['lab', '🧪', 'مختبر'], ['radiology', '🩻', 'أشعة'], ['dental', '🦷', 'أسنان'], ['physio', '🦵', 'علاج طبيعي'], ['other', '➕', 'أخرى']];
const SECTORS = [['', 'الكل'], ['government', '🏛️ حكومي'], ['private', '🏢 خاص']];
const SECTOR_LABEL = { government: '🏛️ حكومي', private: '🏢 خاص', unknown: 'القطاع غير محدد' };
export const SERVICE_TYPES = [['consult_first', 'كشف أول'], ['consult_follow', 'كشف متابعة'], ['test', 'فحص/تحليل'], ['treatment', 'خدمة علاجية'], ['medicine', 'دواء']];
const OFFICIAL = [
  ['📱', 'صحتي — حجز مواعيد المراكز الحكومية', 'https://www.sehhaty.sa/'],
  ['💊', 'الغذاء والدواء — قائمة الأدوية وأسعارها الرسمية', 'https://www.sfda.gov.sa/ar/drugs-list'],
  ['🪪', 'التخصصات الصحية — التحقق من الممارس الصحي', 'https://www.scfhs.org.sa/'],
  ['🛡️', 'مجلس الضمان الصحي — شبكات التأمين', 'https://www.chi.gov.sa/'],
  ['☎️', 'وزارة الصحة — 937', 'https://www.moh.gov.sa/']
];
const SRC_LABEL = { osm: 'OpenStreetMap — بيانات مفتوحة غير متحقق منها رسميًا', community: 'مساهمة أعضاء بعد مراجعة الإدارة', staff: 'إدارة البرنامج' };
const AREA_KEY = 'ghadeer.health.area';
const getArea = () => { try { const a = localStorage.getItem(AREA_KEY); return AREAS.some(x => x[0] === a) ? a : DEFAULT_AREA; } catch { return DEFAULT_AREA; } };
const setArea = a => { try { localStorage.setItem(AREA_KEY, a); } catch { /* اختياري */ } };
const kindOf = k => KINDS.find(x => x[0] === k) || KINDS[8];
const sar = v => Number(v).toLocaleString('ar-SA', { maximumFractionDigits: 2 }) + ' ر.س';
const mapUrl = f => f.lat != null ? `https://www.google.com/maps/search/?api=1&query=${f.lat},${f.lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(f.name + ' ' + (f.city || ''))}`;
const tel = p => String(p || '').replace(/[^0-9+]/g, '');
const who = () => state.manager ? { p_member_id: 0, p_pin: state.pin } : creds();
const disclaimer = '<p class="muted small center health-note">ℹ️ الدليل للمعلومات فقط ولا يقدم تشخيصًا أو توصية علاجية. الأسعار والعروض كما أعلنتها المنشآت وقد تتغير؛ تأكد منها قبل الزيارة. في الطوارئ اتصل <a href="tel:997">997</a>.</p>';

/** يطلب مزامنة مدينة وينتظر النتيجة (حتى 3 دقائق). */
export async function syncAndWait(area, alive = () => true) {
  const req = await call('health_request_sync', { p_city: area });
  if (!req.ok || req.data?.success === false) return { ok: false, error: req.data?.message || req.message };
  if (req.data.status === 'fresh') return { ok: true, inserted: 0 };
  for (let i = 0; i < 45 && alive(); i++) {
    await new Promise(r => setTimeout(r, window.__healthPoll || 4000));
    const s = await call('health_sync_status', { p_city: area });
    if (s.ok && s.data && s.data.ok != null) return s.data;
  }
  return { ok: false, error: 'لم تكتمل المعالجة بعد، أعد المحاولة بعد قليل' };
}

let geo = null; // { lat, lng } بعد موافقة المستخدم فقط، ولا يُحفظ.

export async function render(el, [tab = 'search', id]) {
  if (tab === 'f' && id) return facility(el, Number(id));
  if (tab === 'add') return addForm(el, id);
  if (tab === 'sources') return sources(el);
  return search(el);
}

async function search(el) {
  const area = getArea();
  const st = search.st || (search.st = { q: '', sector: '', kind: '', insurance: '', max: '' });
  el.innerHTML = `
    <div class="health-top">
      <div class="input-row"><select data-area aria-label="المدينة">${AREAS.map(([a]) => `<option${a === area ? ' selected' : ''}>${esc(a)}</option>`).join('')}</select>
        <button type="button" class="btn secondary" data-near>📍 بالقرب مني</button></div>
      <div class="input-row"><input type="search" data-q value="${esc(st.q)}" placeholder="مستشفى، طبيب، تخصص، خدمة…" aria-label="بحث في الدليل الصحي"><button class="btn primary" data-go>بحث</button></div>
      <div class="segmented">${SECTORS.map(([k, l]) => `<button type="button" data-sector="${k}" class="${st.sector === k ? 'active' : ''}">${l}</button>`).join('')}</div>
      <div class="chips scroll">${[['', '🔎', 'كل الأنواع'], ...KINDS.slice(0, 8)].map(([k, i, l]) => `<button type="button" class="chip${st.kind === k ? ' on' : ''}" data-kind="${k}">${i} ${l}</button>`).join('')}</div>
      <details class="filters"${st.insurance || st.max ? ' open' : ''}><summary>فلاتر إضافية</summary>
        <div class="grid2"><div><label>شركة التأمين</label><input data-ins value="${esc(st.insurance)}" placeholder="مثال: بوبا"></div>
        <div><label>أعلى سعر كشف (ر.س)</label><input data-max type="number" min="0" inputmode="numeric" value="${esc(st.max)}"></div></div>
        <p class="muted small">تُطبَّق هذه الفلاتر على المنشآت التي أُضيفت لها بيانات التأمين أو سعر كشف مؤكد فقط.</p></details>
    </div>
    <div data-status></div><div data-results><p class="muted center">⏳ جارٍ البحث…</p></div>
    <section class="card" data-offers hidden></section>
    <section class="card"><h3>🔗 خدمات رسمية</h3><div class="links">${OFFICIAL.map(([i, n, u]) => `<a class="link-item" href="${u}" target="_blank" rel="noopener noreferrer"><b>${i} ${esc(n)}</b><span>↗</span></a>`).join('')}</div></section>
    <div class="actions center"><a class="btn secondary" href="#/health/add">➕ أضف منشأة أو سعرًا أو عرضًا</a><a class="btn ghost" href="#/health/sources">مصادر البيانات</a></div>
    ${disclaimer}`;

  const run = () => { st.q = $('[data-q]', el).value.trim(); st.insurance = $('[data-ins]', el).value.trim(); st.max = $('[data-max]', el).value; return load(el, getArea(), st); };
  $('[data-area]', el).onchange = e => { setArea(e.target.value); geo = null; run(); };
  $('[data-go]', el).onclick = run;
  $('[data-q]', el).onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); run(); } };
  el.querySelectorAll('[data-sector]').forEach(b => b.onclick = () => { st.sector = b.dataset.sector; el.querySelectorAll('[data-sector]').forEach(x => x.classList.toggle('active', x === b)); run(); });
  el.querySelectorAll('[data-kind]').forEach(b => b.onclick = () => { st.kind = b.dataset.kind; el.querySelectorAll('[data-kind]').forEach(x => x.classList.toggle('on', x === b)); run(); });
  $('[data-near]', el).onclick = e => {
    if (!navigator.geolocation) return toast('جهازك لا يدعم تحديد الموقع.', false);
    const btn = e.currentTarget; btn.disabled = true; btn.textContent = '⏳ تحديد الموقع…';
    navigator.geolocation.getCurrentPosition(p => {
      geo = { lat: p.coords.latitude, lng: p.coords.longitude };
      const [a, d] = nearestArea(geo.lat, geo.lng);
      if (d > 80) toast(`أقرب مدينة متاحة في الدليل: ${a} (${Math.round(d)} كم).`);
      setArea(a); $('[data-area]', el).value = a; btn.disabled = false; btn.textContent = '📍 الأقرب أولًا'; run();
    }, () => { btn.disabled = false; btn.textContent = '📍 بالقرب مني'; toast('لم يُسمح بتحديد الموقع. اختر المدينة يدويًا.', false); }, { timeout: 12000, maximumAge: 300000 });
  };
  await load(el, area, st);
}

async function load(el, area, st, synced = false) {
  const box = $('[data-results]', el), status = $('[data-status]', el);
  if (!box) return;
  box.innerHTML = '<p class="muted center">⏳ جارٍ البحث…</p>';
  const r = await call('health_search', { p_city: area, p_q: st.q || null, p_sector: st.sector || null, p_kind: st.kind || null, p_lat: geo?.lat ?? null, p_lng: geo?.lng ?? null,
    p_insurance: st.insurance || null, p_max_price: st.max === '' ? null : Number(st.max), p_limit: 80 });
  if (!box.isConnected) return;
  if (!r.ok || r.data?.success === false) { box.innerHTML = `<p class="status bad">تعذر البحث الآن: ${esc(r.message || r.data?.message || '')}</p>`; return; }
  const d = r.data;
  // أول زيارة لمدينة لم تُجلب بياناتها: نطلب جلبها من المصدر المفتوح عند الحاجة فقط ثم ننتظر انتهاء المعالجة.
  if (!synced && !d.total_in_city && !d.last_ok) {
    status.innerHTML = `<p class="status">⏳ جارٍ جلب منشآت ${esc(area)} من OpenStreetMap لأول مرة… قد يستغرق دقيقة أو دقيقتين.</p>`;
    const res = await syncAndWait(area, () => status.isConnected);
    if (!status.isConnected) return;
    status.innerHTML = res.ok ? `<p class="status ok">✅ تم جلب ${res.inserted} منشأة في ${esc(area)}.</p>`
      : `<p class="status bad">⚠️ تعذر جلب البيانات المفتوحة الآن (${esc(res.error || 'خطأ')}). تظهر المساهمات المعتمدة فقط، ويمكن المحاولة لاحقًا.</p>`;
    return load(el, area, st, true);
  }
  if (!synced) status.innerHTML = d.last_ok ? `<p class="muted small">آخر تحديث للبيانات المفتوحة في ${esc(area)}: ${fmtDateTime(d.last_ok)} · ${d.total_in_city} منشأة</p>` : '';
  box.innerHTML = d.items.length ? `<p class="muted small">${d.items.length} نتيجة${d.items.length >= 80 ? ' (أول 80 — ضيّق البحث)' : ''}</p><div class="health-list">${d.items.map(card).join('')}</div>`
    : `<p class="empty">لا توجد نتائج مطابقة في ${esc(area)}${st.q || st.kind || st.sector || st.insurance || st.max ? '. جرّب تخفيف الفلاتر أو تغيير المدينة.' : '.'}</p>`;
  const offersBox = $('[data-offers]', el);
  offersBox.hidden = !d.offers?.length;
  offersBox.innerHTML = d.offers?.length ? `<h3>🏷️ عروض صحية سارية في ${esc(area)}</h3><div class="offer-list">${d.offers.map(offerHtml).join('')}</div>` : '';
}

function card(f) {
  const [, icon, kl] = kindOf(f.kind);
  return `<article class="card health-card" data-fac="${f.id}">
    <a class="hc-main" href="#/health/f/${f.id}"><span class="hc-icon">${icon}</span><span><b>${esc(f.name)}</b>
      <small class="muted">${kl}${f.district ? ' · ' + esc(f.district) : ''}${f.km != null ? ` · ${f.km} كم` : ''}</small></span></a>
    <div class="hc-tags"><span class="pill ${f.sector}">${SECTOR_LABEL[f.sector]}</span>
      ${f.consult_price != null ? `<span class="pill price">كشف ${sar(f.consult_price)} ✓</span>` : '<span class="pill muted">سعر الكشف غير متوفر</span>'}
      ${f.doctors ? `<span class="pill">👨‍⚕️ ${f.doctors}</span>` : ''}${f.offers ? `<span class="pill offer-pill">🏷️ ${f.offers} عرض</span>` : ''}</div>
    ${f.doctor_hits?.length ? `<p class="small">👨‍⚕️ ${f.doctor_hits.map(x => `${esc(x.name)} (${esc(x.specialty)})`).join('، ')}</p>` : ''}
    <div class="actions small">${f.phone ? `<a class="small-btn" href="tel:${esc(tel(f.phone))}">📞 اتصال</a>` : ''}<a class="small-btn" href="${esc(mapUrl(f))}" target="_blank" rel="noopener">🗺️ الموقع</a>
      ${f.booking_url ? `<a class="small-btn primary" href="${esc(f.booking_url)}" target="_blank" rel="noopener">📅 حجز</a>` : ''}<a class="small-btn ghost" href="#/health/f/${f.id}">التفاصيل ←</a></div>
    <p class="muted tiny">المصدر: ${esc(SRC_LABEL[f.source_id] || f.source_id)}${f.verified_at ? ' · تحقق ' + fmtDate(f.verified_at) : f.last_synced_at ? ' · تحديث ' + fmtDate(f.last_synced_at) : ''}</p></article>`;
}

const offerHtml = o => `<div class="card offer"><div class="offer-head"><span class="pill">🏥 ${esc(o.store || '')}</span>${o.price_before && o.price_after ? `<span class="offer-off">-${Math.round((1 - o.price_after / o.price_before) * 100)}%</span>` : ''}</div>
  <h3>${esc(o.title)}</h3>${o.description ? `<p>${esc(o.description)}</p>` : ''}${o.price_after ? `<p class="offer-price"><b>${sar(o.price_after)}</b>${o.price_before ? ` <s>${sar(o.price_before)}</s>` : ''}</p>` : ''}
  ${o.terms ? `<p class="small">📋 الشروط: ${esc(o.terms)}</p>` : ''}<p class="muted small">⏳ ساري حتى ${fmtDate(o.ends_on)}${o.link ? ` · <a href="${esc(o.link)}" target="_blank" rel="noopener">المصدر ↗</a>` : ''}${o.facility_id ? ` · <a href="#/health/f/${o.facility_id}">المنشأة</a>` : ''}</p></div>`;

async function facility(el, id) {
  el.innerHTML = '<p class="muted center">⏳ جارٍ التحميل…</p>';
  const r = await call('health_facility', { p_id: id });
  if (!r.ok || !r.data?.success) { el.innerHTML = `<a class="btn secondary" href="#/health">→ الدليل الصحي</a><p class="empty">${esc(r.data?.message || r.message || 'المنشأة غير موجودة')}</p>`; return; }
  const { facility: f, doctors, prices, offers } = r.data;
  const [, icon, kl] = kindOf(f.kind);
  const byType = SERVICE_TYPES.map(([k, l]) => [l, prices.filter(p => p.service_type === k)]).filter(([, a]) => a.length);
  el.innerHTML = `<a class="btn secondary" href="#/health">→ الدليل الصحي</a>
    <section class="card"><h2>${icon} ${esc(f.name)}</h2>${f.name_en ? `<p class="muted" dir="ltr">${esc(f.name_en)}</p>` : ''}
      <div class="hc-tags"><span class="pill ${f.sector}">${SECTOR_LABEL[f.sector]}</span><span class="pill">${kl}</span><span class="pill">📍 ${esc(f.city)}${f.district ? ' · ' + esc(f.district) : ''}</span></div>
      ${f.opening_hours ? `<p class="small">🕘 ساعات العمل: <span dir="ltr">${esc(f.opening_hours)}</span></p>` : ''}${f.insurance ? `<p class="small">🛡️ التأمين: ${esc(f.insurance)}</p>` : ''}
      <div class="actions">${f.phone ? `<a class="btn primary" href="tel:${esc(tel(f.phone))}">📞 ${esc(f.phone)}</a>` : ''}<a class="btn secondary" href="${esc(mapUrl(f))}" target="_blank" rel="noopener">🗺️ الموقع</a>
        ${f.website ? `<a class="btn secondary" href="${esc(f.website)}" target="_blank" rel="noopener">🌐 الموقع الرسمي</a>` : ''}${f.booking_url ? `<a class="btn primary" href="${esc(f.booking_url)}" target="_blank" rel="noopener">📅 الحجز الرسمي</a>` : ''}
        ${f.sector === 'government' ? '<a class="btn ghost" href="https://www.sehhaty.sa/" target="_blank" rel="noopener">📱 الحجز عبر صحتي</a>' : ''}</div>
      <p class="muted tiny">المصدر: ${esc(SRC_LABEL[f.source_id] || f.source_name)}${f.source_id === 'osm' ? ' (© مساهمو OpenStreetMap، رخصة ODbL)' : ''} · ${f.verified_at ? 'تاريخ التحقق ' + fmtDate(f.verified_at) : 'آخر تحديث ' + fmtDate(f.last_synced_at || f.updated_at)}</p></section>
    <section class="card"><h3>💰 الأسعار</h3>${byType.length ? byType.map(([l, a]) => `<h4>${l}</h4><div class="list">${a.map(p => `<div class="row-item"><div class="row-main"><b>${esc(p.service_name)}</b>
        <small class="muted">${p.doctor ? 'د. ' + esc(p.doctor) + ' · ' : ''}${esc(p.source || '')}${p.verified_at ? ' · تحقق ' + fmtDate(p.verified_at) : ''}${p.source_url ? ` · <a href="${esc(p.source_url)}" target="_blank" rel="noopener">المصدر ↗</a>` : ''}</small></div>
        <span class="${p.price_status === 'confirmed' ? 'price-ok' : 'muted'}">${p.price_status === 'confirmed' ? sar(p.price) : 'غير متوفر'}</span></div>`).join('')}</div>`).join('')
      : '<p class="muted">لم تُضف أسعار لهذه المنشأة بعد. يمكنك إضافة سعر معلن مع رابط مصدره.</p>'}</section>
    <section class="card"><h3>👨‍⚕️ الأطباء والطاقم الطبي</h3>${doctors.length ? `<div class="list">${doctors.map(d => `<div class="row-item col"><div class="row-head"><b>${esc(d.title ? d.title + ' ' : '')}${esc(d.name)}</b><span class="pill">${esc(d.specialty)}</span></div>
        <small class="muted">${d.qualifications ? 'المؤهلات المعلنة: ' + esc(d.qualifications) + ' · ' : ''}${d.languages ? 'اللغات: ' + esc(d.languages) + ' · ' : ''}${d.availability ? 'المواعيد: ' + esc(d.availability) + ' · ' : ''}${d.verification === 'verified' ? '✓ متحقق من المصدر' : 'غير متحقق رسميًا'}${d.source_url ? ` · <a href="${esc(d.source_url)}" target="_blank" rel="noopener">المصدر ↗</a>` : ''}</small></div>`).join('')}</div>
        <p class="muted tiny">للتحقق من تصنيف الممارس الصحي استخدم خدمات <a href="https://www.scfhs.org.sa/" target="_blank" rel="noopener">الهيئة السعودية للتخصصات الصحية</a>.</p>`
      : '<p class="muted">لم يُضف أطباء لهذه المنشأة بعد.</p>'}</section>
    ${offers.length ? `<section class="card"><h3>🏷️ عروض سارية</h3><div class="offer-list">${offers.map(o => offerHtml({ ...o, store: f.name })).join('')}</div></section>` : ''}
    <div class="actions center"><a class="btn secondary" href="#/health/add/price-${f.id}">💰 أضف سعرًا</a><a class="btn secondary" href="#/health/add/doctor-${f.id}">👨‍⚕️ أضف طبيبًا</a><a class="btn secondary" href="#/health/add/offer-${f.id}">🏷️ أضف عرضًا</a></div>
    ${disclaimer}`;
}

async function addForm(el, spec = '') {
  const [t0, fid] = String(spec || '').split('-');
  const type = ['facility', 'price', 'doctor', 'offer'].includes(t0) ? t0 : 'facility';
  const staff = state.manager || state.supervisor;
  const area = getArea();
  let fac = null;
  if (fid) { const r = await call('health_facility', { p_id: Number(fid) }); fac = r.ok && r.data?.success ? r.data.facility : null; }
  const tabs = [['facility', '🏥 منشأة'], ['price', '💰 سعر'], ['doctor', '👨‍⚕️ طبيب'], ['offer', '🏷️ عرض']];
  const pick = type !== 'facility' && !fac;
  const end = new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10);
  el.innerHTML = `<a class="btn secondary" href="${fac ? '#/health/f/' + fac.id : '#/health'}">→ رجوع</a>
    <div class="segmented">${tabs.map(([k, l]) => `<a href="#/health/add/${k}${fac ? '-' + fac.id : ''}" class="${type === k ? 'active' : ''}">${l}</a>`).join('')}</div>
    <form class="card" data-hform><p class="muted">${staff ? 'ما تضيفه الإدارة يُنشر مباشرة بعد تحققك من مصدره.' : 'يُراجع ما ترسله من الإدارة قبل نشره. أضف بيانات حقيقية معلنة فقط، ويفضّل رابط المصدر الرسمي.'}</p>
      ${type === 'facility' ? `
        <label>اسم المنشأة</label><input name="name" required maxlength="150">
        <div class="grid2"><div><label>القطاع</label><select name="sector" required><option value="">اختر</option><option value="government">حكومي</option><option value="private">خاص</option></select></div>
          <div><label>النوع</label><select name="kind">${KINDS.map(([k, i, l]) => `<option value="${k}">${i} ${l}</option>`).join('')}</select></div></div>
        <div class="grid2"><div><label>المدينة</label><select name="city">${AREAS.map(([a]) => `<option${a === area ? ' selected' : ''}>${esc(a)}</option>`).join('')}</select></div><div><label>الحي (اختياري)</label><input name="district" maxlength="80"></div></div>
        <div class="grid2"><div><label>الهاتف (اختياري)</label><input name="phone" inputmode="tel" dir="ltr"></div><div><label>ساعات العمل (اختياري)</label><input name="opening_hours" maxlength="120"></div></div>
        <label>الموقع الرسمي (اختياري)</label><input name="link" dir="ltr" placeholder="https://">
        <label>رابط الحجز الرسمي (اختياري)</label><input name="booking_url" dir="ltr" placeholder="https://">
        <label>شركات التأمين المقبولة (اختياري)</label><input name="insurance" maxlength="300" placeholder="مثال: بوبا، التعاونية">`
      : pick ? `<label>المنشأة</label><div class="input-row"><input data-fsearch placeholder="ابحث باسم المنشأة في ${esc(area)}…"><button type="button" class="btn secondary" data-fgo>بحث</button></div><div data-fpick></div><input type="hidden" name="facility_id">`
      : `<p><b>${kindOf(fac.kind)[1]} ${esc(fac.name)}</b> <small class="muted">${esc(fac.city)}</small></p><input type="hidden" name="facility_id" value="${fac.id}">`}
      ${type === 'price' ? `
        <div class="grid2"><div><label>نوع الخدمة</label><select name="service_type">${SERVICE_TYPES.map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></div><div><label>اسم الخدمة</label><input name="service_name" required maxlength="100" placeholder="مثال: كشف باطنية"></div></div>
        <label>السعر (ر.س) — اتركه فارغًا إن لم يكن معلنًا</label><input name="price" type="number" min="0" step="0.01" inputmode="decimal">
        <label>رابط مصدر السعر ${staff ? '(اختياري)' : '(مطلوب عند كتابة سعر)'}</label><input name="link" dir="ltr" placeholder="https://">` : ''}
      ${type === 'doctor' ? `
        <div class="grid2"><div><label>اسم الطبيب</label><input name="name" required maxlength="120"></div><div><label>التخصص</label><input name="specialty" required maxlength="80"></div></div>
        <div class="grid2"><div><label>اللقب (اختياري)</label><input name="title" maxlength="60" placeholder="استشاري، أخصائي…"></div><div><label>المواعيد (اختياري)</label><input name="availability" maxlength="120"></div></div>
        <label>المؤهلات المعلنة (اختياري)</label><input name="qualifications" maxlength="300"><label>اللغات (اختياري)</label><input name="languages" maxlength="80">
        <label>رابط صفحة الطبيب في موقع المنشأة (اختياري)</label><input name="link" dir="ltr" placeholder="https://">` : ''}
      ${type === 'offer' ? `
        <label>عنوان العرض</label><input name="title" required maxlength="150" placeholder="مثال: خصم 30% على تنظيف الأسنان">
        <div class="grid2"><div><label>السعر قبل (اختياري)</label><input name="price_before" type="number" min="0" step="0.01"></div><div><label>السعر بعد (اختياري)</label><input name="price_after" type="number" min="0" step="0.01"></div></div>
        <div class="grid2"><div><label>يبدأ</label><input name="starts_on" type="date" value="${todayISO()}"></div><div><label>ينتهي</label><input name="ends_on" type="date" value="${end}" required></div></div>
        <label>تفاصيل (اختياري)</label><textarea name="description" rows="2" maxlength="600"></textarea>
        <label>الشروط (اختياري)</label><textarea name="terms" rows="2" maxlength="400"></textarea>
        <label>رابط العرض الرسمي (اختياري)</label><input name="link" dir="ltr" placeholder="https://">` : ''}
      <button class="btn primary block">📤 ${staff ? 'نشر' : 'إرسال للمراجعة'}</button></form>${disclaimer}`;
  const f = $('[data-hform]', el);
  if (pick) {
    const go = async () => {
      const q = $('[data-fsearch]', el).value.trim(); const box = $('[data-fpick]', el);
      const r = await call('health_search', { p_city: area, p_q: q || null, p_limit: 20 });
      const items = r.ok ? r.data?.items || [] : [];
      box.innerHTML = items.length ? `<div class="chips">${items.map(x => `<button type="button" class="chip" data-fid="${x.id}">${kindOf(x.kind)[1]} ${esc(x.name)}</button>`).join('')}</div>` : '<p class="muted small">لا نتائج. أضف المنشأة أولًا من تبويب «منشأة».</p>';
      box.querySelectorAll('[data-fid]').forEach(b => b.onclick = () => { f.facility_id.value = b.dataset.fid; box.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === b)); });
    };
    $('[data-fgo]', el).onclick = go;
  }
  f.onsubmit = e => { e.preventDefault(); busy(f.querySelector('button.primary'), async () => {
    if (!(await requirePin())) return;
    const data = Object.fromEntries([...new FormData(f)].map(([k, v]) => [k, String(v).trim()]));
    if (type !== 'facility' && !data.facility_id) return toast('اختر المنشأة.', false);
    const r = await call('health_submit', { ...who(), p_type: type, p_data: data });
    if (!r.ok || r.data?.success === false) return toast(r.data?.message || r.message, false);
    toast(r.data.message);
    location.hash = type === 'facility' ? (r.data.status === 'published' ? '#/health/f/' + r.data.id : '#/health') : '#/health/f/' + data.facility_id;
  }); };
}

async function sources(el) {
  const r = await call('health_areas');
  const d = r.ok ? r.data : { sources: [], areas: [] };
  const lbl = { connected: '🟢 مربوط فعليًا', manual: '🟡 إدخال يدوي بعد المراجعة', link_only: '🔗 رابط رسمي فقط', needs_permission: '⚪ يحتاج تصريحًا أو واجهة API' };
  el.innerHTML = `<a class="btn secondary" href="#/health">→ الدليل الصحي</a>
    <section class="card"><h3>📚 مصادر بيانات الدليل الصحي</h3><div class="list">${(d.sources || []).map(s => `<div class="row-item col"><div class="row-head"><b>${esc(s.name)}</b><span class="pill">${lbl[s.status] || esc(s.status)}</span></div>
      <small class="muted">${esc(s.notes || '')}${s.license ? ' · الرخصة: ' + esc(s.license) : ''}${s.last_success_at ? ' · آخر تحديث ناجح: ' + fmtDateTime(s.last_success_at) : ''}${s.url ? ` · <a href="${esc(s.url)}" target="_blank" rel="noopener">الموقع ↗</a>` : ''}</small></div>`).join('')}</div></section>
    <section class="card"><h3>🗺️ المدن التي جُلبت بياناتها</h3>${(d.areas || []).length ? `<div class="list">${d.areas.map(a => `<div class="row-item"><div class="row-main"><b>${esc(a.area)}</b><small class="muted">${a.last_ok ? 'آخر تحديث ناجح ' + fmtDateTime(a.last_ok) : 'لم ينجح التحديث بعد'}</small></div></div>`).join('')}</div>` : '<p class="muted">تُجلب بيانات كل مدينة عند أول بحث فيها.</p>'}</section>
    ${disclaimer}`;
}

/** مراجعة الدليل الصحي في لوحة الإدارة. */
export async function adminView(el, again, whoArgs) {
  const r = await call('staff_health_pending', whoArgs);
  const items = r.ok ? r.data?.items || [] : [], runs = r.ok ? r.data?.runs || [] : [];
  const tl = { facility: '🏥 منشأة', doctor: '👨‍⚕️ طبيب', price: '💰 سعر' };
  el.innerHTML = `<p class="muted">مساهمات الأعضاء في الدليل الصحي تنتظر موافقتك. تحقّق من المصدر قبل النشر. العروض الصحية تُراجع من «مراجعة العروض».</p>
    ${!r.ok || r.data?.success === false ? `<p class="status bad">${esc(r.data?.message || r.message)}</p>` : items.length ? `<div class="list">${items.map(x => `<div class="row-item col"><div class="row-head"><b>${esc(x.title)}</b><span class="pill">${tl[x.type]}</span></div>
      <small class="muted">${esc(x.detail || '')}${x.by ? ' · ' + esc(x.by) : ''}${x.link ? ` · <a href="${esc(x.link)}" target="_blank" rel="noopener">المصدر ↗</a>` : ' · بدون رابط مصدر'}</small>
      <div class="actions small"><button class="small-btn" data-hs="published" data-t="${x.type}" data-id="${x.id}">✅ نشر</button><button class="small-btn danger" data-hs="rejected" data-t="${x.type}" data-id="${x.id}">⛔ رفض</button></div></div>`).join('')}</div>` : '<p class="empty">لا توجد مساهمات بانتظار المراجعة.</p>'}
    <form class="card" data-hsync><h3>🔄 تحديث بيانات مدينة</h3><div class="input-row"><select name="area">${AREAS.map(([a]) => `<option>${esc(a)}</option>`).join('')}</select><button class="btn secondary">تحديث الآن</button></div>
      <p class="muted small">تُجلب بيانات المدينة من OpenStreetMap عند أول بحث فيها، وتُحدَّث تلقائيًا أسبوعيًا. التحديث اليدوي متاح كل 10 دقائق كحد أدنى.</p></form>
    <section class="card"><h3>📜 سجل المزامنة</h3>${runs.length ? `<div class="list">${runs.map(x => `<div class="row-item col"><div class="row-head"><b>${esc(x.area)}</b><span class="pill">${x.ok ? '✅ نجح' : x.ok === false ? '⚠️ فشل' : '⏳ جارٍ'}</span></div>
      <small class="muted">${fmtDateTime(x.at)} · جُلب ${x.fetched} · جديد ${x.inserted} · محدَّث ${x.updated}${x.error ? ' · ' + esc(x.error) : ''}</small></div>`).join('')}</div>` : '<p class="muted">لا توجد عمليات بعد.</p>'}</section>`;
  el.querySelectorAll('[data-hs]').forEach(b => b.onclick = () => busy(b, async () => {
    const res = await call('staff_health_review', { ...whoArgs, p_type: b.dataset.t, p_id: Number(b.dataset.id), p_status: b.dataset.hs });
    toast(res.ok && res.data?.success !== false ? res.data?.message || 'تم.' : res.data?.message || res.message, res.ok && res.data?.success !== false); if (res.ok) again();
  }));
  const sf = $('[data-hsync]', el);
  sf.onsubmit = e => { e.preventDefault(); busy(sf.querySelector('button'), async () => {
    const s = await call('staff_health_sync', { ...whoArgs, p_city: sf.area.value });
    if (!s.ok || s.data?.success === false) return toast(s.data?.message || s.message, false);
    toast('أُرسل طلب التحديث. تُعالج النتيجة خلال دقيقة أو دقيقتين وتظهر في السجل.');
    again();
  }); };
}
