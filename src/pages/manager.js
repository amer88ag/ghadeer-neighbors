/* لوحة الإدارة: المدير بكل الصلاحيات، والمشرف المفوض بما تسمح به دوال المشرف. */
import { esc, toast, busy, empty, val, options, fmtDate, fmtTime, fmtDateTime, confirmBox, promptBox, todayISO, normalizeDigits, $ } from '../lib/dom.js';
import { state, canManage, activeMembers, memberName, loadMembers, logout, showManagerLogin, showLogin } from '../lib/session.js';
import { call, list, table } from '../lib/api.js';
import * as data from '../lib/data.js';
import { PIN_PATTERN } from '../config.js';
import { GROUPS, arrange as arrangeTiles0 } from './home.js';
import { adminView as offersAdmin } from './offers.js';
import { compose, clean as cleanLayout, newId } from '../lib/layout.js';
import { refresh } from '../lib/router.js';

// أقسام لوحة الإدارة مجمّعة حسب الغرض. access: manager = المطور فقط، any = المطور والمشرف المفوض.
const SECTIONS = [
  ['👥 المجتمع والأعضاء', [
    ['members', '👥', 'الأعضاء والأرقام', 'manager'], ['joinRequests', '📨', 'طلبات الانضمام', 'any'], ['permissions', '🛡️', 'المشرفون والصلاحيات', 'manager'],
    ['communities', '🏘️', 'المجتمعات الجديدة', 'any'], ['checks', '❤️', 'التفقد', 'manager']
  ]],
  ['📢 التواصل والنشر', [
    ['ticker', '📢', 'شريط الأخبار', 'any'], ['offers', '🏷️', 'مراجعة العروض', 'any'], ['occasions', '🎉', 'المناسبات والتهاني', 'any'], ['messages', '💬', 'الرسائل والتنبيهات', 'manager']
  ]],
  ['☕ اللقاءات (اختيارية)', [
    ['schedules', '📅', 'جداول القهوة والطلعات', 'any'], ['plans', '🗳️', 'الطلعات المقترحة', 'any'], ['rules', '⚙️', 'قواعد الجداول', 'any']
  ]],
  ['🧩 النظام والتحكم', [
    ['layout', '🗂️', 'تنظيم الواجهة', 'manager'], ['settings', '🧰', 'إعدادات المطور', 'manager'], ['services', '🧩', 'الأيقونات والخدمات', 'manager'], ['content', '🗂️', 'إدارة المحتوى', 'manager'], ['reports', '💾', 'التقارير والنسخ', 'manager']
  ]]
];
const TABS = SECTIONS.flatMap(([, items]) => items.map(([k, i, l, acc]) => [k, i + ' ' + l, acc]));

const M = () => ({ p_manager_pin: state.pin });
// يقبل الأرقام العربية (٠١٢٣) والفارسية ويحوّلها إلى أرقام إنجليزية قبل التحقق والإرسال.
const pinOf = v => normalizeDigits(String(v ?? '')).replace(/\s+/g, '');
const S = () => ({ p_member_id: state.user?.id, p_pin: state.pin });

/** يربط نموذجًا بمعالج: يمنع الإرسال المزدوج ويعرض النتيجة ويعيد الرسم عند النجاح. */
function bind(el, sel, handler, after) {
  el.querySelectorAll(sel).forEach(f => {
    f.onsubmit = e => {
      e.preventDefault();
      busy(f.querySelector('button[type=submit],button:not([type])'), async () => {
        const r = await handler(f, e.submitter);
        if (!r) return;
        if (!r.ok) return toast(r.message, false);
        toast(r.message && r.message.length < 120 ? r.message : 'تم الحفظ.');
        await after?.(r);
      });
    };
  });
}

const memberOpts = sel => options(activeMembers(), m => m.name, sel);

export async function render(el, [tab]) {
  if (!canManage() || !state.pin) {
    el.innerHTML = `<div class="card"><p>لوحة الإدارة للمطور والمشرفين المفوضين.</p><button class="btn primary block" data-mgr>🛠️ دخول المطور</button><button class="btn secondary block" data-sup>🔐 دخول المشرف</button></div>`;
    $('[data-mgr]', el).onclick = async () => { if (await showManagerLogin()) refresh(); };
    $('[data-sup]', el).onclick = async () => { if (await showLogin()) refresh(); };
    return;
  }
  const allowed = TABS.filter(t => state.manager || t[2] === 'any');
  const again = () => { data.invalidate(); render(el, [tab]); };
  if (!tab || tab === 'home' || !allowed.some(t => t[0] === tab)) return dashboard(el);
  const cur = allowed.find(t => t[0] === tab);
  el.innerHTML = `<div class="mgr-bar"><a class="btn secondary" href="#/manager">🏠 اللوحة</a>
      <select data-jump aria-label="الانتقال إلى قسم">${SECTIONS.map(([g, items]) => { const v = items.filter(t => state.manager || t[3] === 'any'); return v.length ? `<optgroup label="${g}">${v.map(([k, i, l]) => `<option value="${k}"${k === tab ? ' selected' : ''}>${i} ${l}</option>`).join('')}</optgroup>` : ''; }).join('')}</select></div>
    <h2 class="mgr-title">${cur[1]}</h2><div data-tab></div>`;
  $('[data-jump]', el).onchange = e => { location.hash = '#/manager/' + e.target.value; };
  const box = $('[data-tab]', el);
  await ({ layout, offers, settings, services, schedules, plans, occasions, messages, members, joinRequests, ticker, permissions, rules, content, communities, checks, reports })[tab](box, again);
}

/* ---------------- لوحة التحكم الرئيسية ---------------- */
async function dashboard(el) {
  const now = Date.now();
  const [st, joins, comms, pins, ann, status] = await Promise.all([
    state.manager ? call('manager_full_stats', M()) : Promise.resolve({ ok: false }),
    state.manager ? call('manager_list_ghadeer_join_requests', M()) : call('supervisor_list_ghadeer_join_requests', S()),
    state.manager ? list('manager_list_communities', M()) : list('supervisor_list_communities', S()),
    state.manager ? list('manager_get_pin_reset_requests', M()) : Promise.resolve({ ok: false, data: [] }),
    data.announcements(true), data.appStatus(true)
  ]);
  const rows = x => Array.isArray(x) ? x : Array.isArray(x?.requests) ? x.requests : [];
  const badge = {
    joinRequests: joins.ok ? rows(joins.data).filter(r => !r.status || r.status === 'pending').length : 0,
    communities: comms.ok ? comms.data.filter(c => c.status === 'pending').length : 0,
    members: pins.ok ? pins.data.filter(r => !r.status || r.status === 'open' || r.status === 'pending').length : 0,
    ticker: ann.filter(a => a.in_ticker && (!a.expires_at || new Date(a.expires_at).getTime() > now)).length
  };
  const d = st.ok ? st.data : null;
  const kpi = (v, l, href) => `<a class="kpi" href="${href}"><b>${v ?? '—'}</b><small>${l}</small></a>`;
  el.innerHTML = `
    ${status.paused ? '<div class="status bad">⏸️ البرنامج في وضع الصيانة الآن — الأعضاء يرون رسالة الإيقاف. <a href="#/manager/settings">إدارة الوضع</a></div>' : ''}
    <section class="mgr-hero"><div><small>${state.manager ? 'المطور' : 'مشرف'}</small><h2>لوحة التحكم</h2></div><span class="pill">${new Intl.DateTimeFormat('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}</span></section>
    <div class="kpi-row">
      ${d ? kpi(d.members?.active, 'عضو نشط', '#/manager/members') + kpi(d.members?.seen_7d, 'دخلوا هذا الأسبوع', '#/stats') : ''}
      ${kpi(badge.joinRequests, 'طلب انضمام', '#/manager/joinRequests')}${kpi(badge.communities, 'طلب مجتمع', '#/manager/communities')}
      ${kpi(badge.ticker, 'رسالة في الشريط', '#/manager/ticker')}${state.manager ? kpi(badge.members, 'طلب رقم سري', '#/manager/members') : ''}
    </div>
    <div class="quick-actions"><a class="btn primary" href="#/manager/ticker">📢 رسالة للشريط</a><a class="btn secondary" href="#/manager/joinRequests">📨 الطلبات</a>${state.manager ? '<a class="btn secondary" href="#/manager/members">➕ عضو جديد</a><a class="btn secondary" href="#/stats">📊 الإحصاءات</a>' : ''}</div>
    ${SECTIONS.map(([g, items]) => { const v = items.filter(t => state.manager || t[3] === 'any'); return v.length ? `<h3 class="tile-group">${g}</h3><nav class="mgr-grid">${v.map(([k, i, l]) => `<a class="mgr-card" href="#/manager/${k}"><span>${i}</span><b>${l}</b>${badge[k] ? `<em class="badge">${badge[k]}</em>` : ''}</a>`).join('')}</nav>` : ''; }).join('')}`;
}

/* ---------------- مراجعة العروض ---------------- */
async function offers(el, again) { return offersAdmin(el, again, state.manager ? { p_member_id: 0, p_pin: state.pin } : S()); }

/* ---------------- تنظيم الواجهة (للجميع) ---------------- */
const ROUTE_CHOICES = () => GROUPS.flatMap(([, items]) => items).filter(t => !['admin', 'dev'].includes(t[4])).map(t => [t[0], t[1] + ' ' + t[2]]);
async function layout(el, again) {
  const [svc, st] = await Promise.all([data.serviceSettings(true), data.appStatus(true)]);
  const L = cleanLayout(st.home_layout);
  const meta = new Map(); GROUPS.forEach(([, items]) => arrangeTiles0(items, svc).filter(t => !['admin', 'dev'].includes(t[4])).forEach(t => meta.set(t[0], t)));
  const { top, byId } = compose(meta, L);
  const save = async (next, msg) => { const r = await call('manager_set_home_layout', { ...M(), p_layout: next }); toast(r.ok ? msg || 'تم الحفظ لكل الأعضاء.' : r.message, r.ok); if (r.ok) { data.invalidate('appStatus'); again(); } };
  const ids = top.map(t => t.id);
  const folderOf = id => L.folders.find(f => f.items.includes(id))?.id || '';
  const movable = [...byId.values()].filter(t => t.kind !== 'folder');
  el.innerHTML = `
    <p class="muted">التغييرات هنا تظهر في رئيسية كل الأعضاء. يستطيع كل عضو بعدها تخصيص شاشته من «إعداد الشاشة».</p>
    <section class="card"><h3>↕️ ترتيب الرئيسية</h3><div class="list" data-order>${top.map((t, i) => `<div class="row-item tile-row" data-id="${t.id}"><div class="row-main"><b>${esc(t.icon)} ${esc(t.title)}</b>${t.kind === 'folder' ? `<small>مجلد · ${t.items.length} أيقونة</small>` : t.kind !== 'builtin' ? '<small>أيقونة مخصصة</small>' : ''}</div>
      <div class="row-side"><button class="icon-btn" data-mv="-1" ${i ? '' : 'disabled'} aria-label="أعلى">▲</button><button class="icon-btn" data-mv="1" ${i < top.length - 1 ? '' : 'disabled'} aria-label="أسفل">▼</button></div></div>`).join('')}</div>
      <button class="btn secondary block" data-reset-order>↺ الترتيب الافتراضي</button></section>
    <section class="card"><h3>📁 المجلدات (أيقونات داخل أيقونة)</h3>
      ${L.folders.length ? `<div class="list">${L.folders.map(f => `<div class="row-item"><div class="row-main"><b>${esc(f.icon || '📁')} ${esc(f.title)}</b><small>${f.items.map(i => esc(byId.get(i)?.title || i)).join('، ') || 'فارغ'}</small></div><button class="small-btn danger" data-del-folder="${f.id}">حذف المجلد</button></div>`).join('')}</div>` : '<p class="muted">لا توجد مجلدات.</p>'}
      <form data-f="folder" class="input-row"><input name="icon" maxlength="4" value="📁" style="max-width:4em" aria-label="رمز"><input name="title" maxlength="30" placeholder="اسم المجلد" required><button class="btn primary">➕ مجلد</button></form>
      ${L.folders.length ? `<h4>نقل أيقونة إلى مجلد أو إخراجها للرئيسية</h4><div class="list">${movable.map(t => `<div class="row-item"><div class="row-main"><b>${esc(t.icon)} ${esc(t.title)}</b></div>
        <select data-move="${t.id}" aria-label="المكان"><option value="">🏠 الرئيسية</option>${L.folders.map(f => `<option value="${f.id}"${folderOf(t.id) === f.id ? ' selected' : ''}>${esc(f.icon || '📁')} ${esc(f.title)}</option>`).join('')}</select></div>`).join('')}</div>` : ''}</section>
    <section class="card"><h3>✨ استحداث أيقونة جديدة</h3>
      <form data-f="custom"><div class="input-row"><input name="icon" maxlength="4" value="⭐" style="max-width:4em" aria-label="رمز"><input name="title" maxlength="30" placeholder="اسم الأيقونة" required></div>
        <input name="desc" maxlength="60" placeholder="وصف قصير (اختياري)">
        <label>نوعها</label><select name="kind"><option value="link">🔗 رابط موقع خارجي</option><option value="page">📄 صفحة نصية (إعلان، تعليمات، معلومات)</option><option value="route">↪️ اختصار لقسم في البرنامج</option></select>
        <div data-k="link"><input name="url" dir="ltr" placeholder="https://"></div>
        <div data-k="page" hidden><textarea name="content" rows="5" maxlength="3000" placeholder="نص الصفحة"></textarea><input name="purl" dir="ltr" placeholder="رابط إضافي (اختياري) https://"></div>
        <div data-k="route" hidden><select name="route">${ROUTE_CHOICES().map(([v, l]) => `<option value="${v}">${esc(l)}</option>`).join('')}</select></div>
        <button class="btn primary block">✨ إضافة الأيقونة للرئيسية</button></form>
      ${L.custom.length ? `<h4>الأيقونات المخصصة</h4><div class="list">${L.custom.map(c => `<div class="row-item"><div class="row-main"><b>${esc(c.icon)} ${esc(c.title)}</b><small>${c.kind === 'link' ? esc(c.url) : c.kind === 'route' ? 'اختصار: ' + esc(c.route) : 'صفحة نصية'}</small></div><button class="small-btn danger" data-del-custom="${c.id}">حذف</button></div>`).join('')}</div>` : ''}</section>`;
  el.querySelectorAll('[data-order] [data-mv]').forEach(b => b.onclick = () => { const id = b.closest('[data-id]').dataset.id, i = ids.indexOf(id), j = i + Number(b.dataset.mv); const o = [...ids]; [o[i], o[j]] = [o[j], o[i]]; save({ ...L, order: o }); });
  $('[data-reset-order]', el).onclick = () => save({ ...L, order: [] }, 'عاد الترتيب الافتراضي.');
  bind(el, '[data-f=folder]', f => { save({ ...L, folders: [...L.folders, { id: newId('f'), icon: val(f, 'icon') || '📁', title: val(f, 'title'), items: [] }] }, 'تم إنشاء المجلد. انقل إليه الأيقونات من القائمة.'); return null; });
  el.querySelectorAll('[data-del-folder]').forEach(b => b.onclick = async () => { if (!await confirmBox('حذف المجلد؟ تعود أيقوناته إلى الرئيسية.', { okText: 'حذف' })) return; save({ ...L, folders: L.folders.filter(f => f.id !== b.dataset.delFolder) }); });
  el.querySelectorAll('[data-move]').forEach(sel => sel.onchange = () => { const id = sel.dataset.move; save({ ...L, folders: L.folders.map(f => ({ ...f, items: f.id === sel.value ? [...f.items.filter(x => x !== id), id] : f.items.filter(x => x !== id) })) }); });
  const cf = $('[data-f=custom]', el);
  cf.kind.onchange = () => cf.querySelectorAll('[data-k]').forEach(d => { d.hidden = d.dataset.k !== cf.kind.value; });
  bind(el, '[data-f=custom]', f => {
    const kind = f.kind.value, url = (kind === 'page' ? f.purl.value : f.url.value).trim();
    if (kind === 'link' && !/^https:\/\//.test(url)) return { ok: false, message: 'الرابط يجب أن يبدأ بـ https://' };
    if (kind === 'page' && url && !/^https:\/\//.test(url)) return { ok: false, message: 'الرابط الإضافي يجب أن يبدأ بـ https://' };
    if (kind === 'page' && !f.content.value.trim()) return { ok: false, message: 'اكتب نص الصفحة' };
    const c = { id: newId('c'), icon: val(f, 'icon') || '⭐', title: val(f, 'title'), desc: val(f, 'desc'), kind, url: url || undefined, content: kind === 'page' ? f.content.value.trim() : undefined, route: kind === 'route' ? f.route.value : undefined };
    save({ ...L, custom: [...L.custom, c] }, 'تمت إضافة الأيقونة للرئيسية.'); return null;
  });
  el.querySelectorAll('[data-del-custom]').forEach(b => b.onclick = async () => { if (!await confirmBox('حذف هذه الأيقونة من الرئيسية؟', { okText: 'حذف' })) return; const id = b.dataset.delCustom; save({ ...L, custom: L.custom.filter(c => c.id !== id), order: L.order.filter(x => x !== id), folders: L.folders.map(f => ({ ...f, items: f.items.filter(x => x !== id) })) }); });
}

/* ---------------- إعدادات المطور ---------------- */
async function settings(el, again) {
  const st = await data.appStatus(true);
  el.innerHTML = `
    <form class="card" data-f="pause"><h3>⏸️ وضع الصيانة</h3><p class="muted">عند التفعيل يرى الأعضاء والزوار رسالة الإيقاف بدل الخدمات، وتبقى لوحة الإدارة متاحة لك.</p>
      <label class="switch"><input type="checkbox" name="on" ${st.paused ? 'checked' : ''}> إيقاف البرنامج مؤقتًا</label>
      <label>رسالة الإيقاف</label><input name="msg" value="${esc(st.pause_message || 'البرنامج متوقف مؤقتًا للصيانة، وسيعود قريبًا بإذن الله.')}">
      <button class="btn primary block">💾 حفظ</button></form>
    <form class="card" data-f="welcome"><h3>🏠 عبارة الترحيب في الرئيسية</h3><input name="v" maxlength="200" value="${esc(st.home_welcome || '')}" placeholder="مجتمع يجمع جيران الحي على التواصل والتعاون والتكاتف."><button class="btn primary block">💾 حفظ</button></form>
    <form class="card" data-f="invite"><h3>💌 مقدمة رسالة الدعوة</h3><p class="muted">تظهر في أول رسالة «ادعُ جارك». اتركها فارغة لاستخدام النص الافتراضي.</p><textarea name="v" rows="4" maxlength="800">${esc(st.invite_intro || '')}</textarea><button class="btn primary block">💾 حفظ</button></form>
    <form class="card" data-f="wa"><h3>👥 رابط قروب الواتساب</h3><input name="v" dir="ltr" placeholder="https://chat.whatsapp.com/..."><button class="btn primary block">💾 حفظ الرابط</button></form>
    <div class="card"><h3>🔐 الأمان</h3><p class="muted">إلغاء «تذكّر هذا الجهاز» لكل الأعضاء، فيُطلب من الجميع الدخول برقمهم السري من جديد.</p><button class="btn danger block" data-revoke-all>🔐 تسجيل خروج كل الأجهزة</button></div>
    <div data-diag></div>`;
  bind(el, '[data-f=pause]', f => call('manager_set_program_pause', { p_pin: state.pin, p_paused: f.on.checked, p_message: val(f, 'msg') }), () => { data.invalidate('appStatus'); again(); });
  bind(el, '[data-f=welcome]', f => call('manager_set_app_text', { ...M(), p_key: 'home_welcome', p_value: val(f, 'v') }), () => data.invalidate('appStatus'));
  bind(el, '[data-f=invite]', f => call('manager_set_app_text', { ...M(), p_key: 'invite_intro', p_value: val(f, 'v') }), () => data.invalidate('appStatus'));
  bind(el, '[data-f=wa]', f => call('manager_set_whatsapp_group', { ...M(), p_link: val(f, 'v') }));
  $('[data-revoke-all]', el).onclick = e => busy(e.currentTarget, async () => {
    if (!await confirmBox('سيُطلب من كل الأعضاء الدخول من جديد برقمهم السري. متابعة؟', { okText: 'تسجيل الخروج' })) return;
    const r = await call('manager_revoke_all_devices', M());
    toast(r.ok ? r.data?.message || 'تم.' : r.message, r.ok);
  });
  await developer($('[data-diag]', el), again);
}

/* ---------------- مركز المطور ---------------- */
async function developer(el, again) {
  const [stats, servicesResult, communitiesResult] = await Promise.all([
    call('manager_activity_stats', { ...M(), p_limit: 100 }),
    list('get_service_settings'),
    list('manager_list_communities', M())
  ]);
  const status = r => r.ok ? '<span class="pill">✅ متاح</span>' : '<span class="pill danger">⚠️ يحتاج فحص</span>';
  const communityPending = communitiesResult.ok ? communitiesResult.data.filter(x => x.status === 'pending').length : null;
  const serviceCount = servicesResult.ok ? servicesResult.data.length : null;
  el.innerHTML = `
    <section class="card"><h3>🩺 فحص النظام</h3>
      <p class="muted">لوحة تشخيص وروابط إدارة. لا تُجري هذه الصفحة أي نشر أو تغييرات تلقائية في قاعدة البيانات.</p>
      <div class="list">
        <div class="row-item"><div class="row-main"><b>اتصال الإحصاءات</b><small>فحص صلاحية لوحة التقارير</small></div>${status(stats)}</div>
        <div class="row-item"><div class="row-main"><b>إعدادات الخدمات</b><small>${serviceCount === null ? 'تعذر قراءة الخدمات' : serviceCount + ' إعداد خدمة'}</small></div>${status(servicesResult)}</div>
        <div class="row-item"><div class="row-main"><b>طلبات المجتمعات</b><small>${communityPending === null ? 'تعذر قراءة الطلبات أو لم تُفعّل قاعدة البيانات' : communityPending + ' طلب قيد المراجعة'}</small></div>${status(communitiesResult)}</div>
      </div>
      ${[stats, servicesResult, communitiesResult].some(x => !x.ok) ? '<p class="status bad">بعض وظائف الإدارة غير متاحة. راجع رسالة الخطأ قبل اعتماد أي تغيير.</p>' : ''}
      <button class="btn secondary block" data-dev-refresh>🔄 إعادة الفحص</button>
    </section>
    ${!stats.ok ? '<section class="card"><h3>تفاصيل فحص الإحصاءات</h3><p class="status bad">' + esc(stats.message) + '</p></section>' : ''}
    ${!servicesResult.ok ? '<section class="card"><h3>تفاصيل فحص الخدمات</h3><p class="status bad">' + esc(servicesResult.message) + '</p></section>' : ''}
    ${!communitiesResult.ok ? '<section class="card"><h3>تفاصيل فحص المجتمعات</h3><p class="status bad">' + esc(communitiesResult.message) + '</p></section>' : ''}`;
  $('[data-dev-refresh]', el).onclick = () => { data.invalidate(); developer(el, again); };
}

/* ---------------- شريط الأخبار ---------------- */
const TICKER_COLORS = [['', 'عادي'], ['#c62828', 'أحمر'], ['#1b7a46', 'أخضر'], ['#b98b35', 'ذهبي'], ['#1565c0', 'أزرق'], ['#6a1b9a', 'بنفسجي'], ['#e65100', 'برتقالي'], ['#ad1457', 'وردي']];
async function ticker(el, again) {
  const now = Date.now();
  const rows = (await data.announcements(true)).filter(a => a.in_ticker && (!a.expires_at || new Date(a.expires_at).getTime() > now))
    .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
  const local = d => { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 16); };
  const who = () => state.manager ? { p_member_id: 0, p_pin: state.pin } : S();
  el.innerHTML = `<form class="card" data-f="ticker-new"><h3>📢 إعلان جديد في شريط أخبار الحي</h3>
      <p class="muted">يظهر في الشريط المتحرك أعلى الرئيسية طوال الفترة التي تحددها، ثم يختفي تلقائيًا. رسائل الشكر بعد القهوة والطلعة وتهاني المناسبات والدعاء والأخبار المحلية تُضاف للشريط تلقائيًا.</p>
      <label>نص الإعلان</label><input name="ttl" maxlength="200" required placeholder="مثال: صيانة شبكة المياه يوم الخميس">
      <label>تفاصيل (اختياري)</label><input name="msg" maxlength="300">
      <label>يبدأ</label><input name="from" type="datetime-local" value="${local(now)}" required>
      <label>المدة</label><select name="dur"><option value="1">ساعة</option><option value="3">3 ساعات</option><option value="6">6 ساعات</option><option value="12">12 ساعة</option><option value="24">يوم واحد</option><option value="48">يومان</option><option value="72" selected>3 أيام</option><option value="168">أسبوع</option><option value="336">أسبوعان</option><option value="720">شهر</option><option value="custom">تحديد وقت النهاية</option></select>
      <div data-end hidden><label>ينتهي</label><input name="to" type="datetime-local"></div>
      <label>لون الرسالة في الشريط</label><div class="color-pick">${TICKER_COLORS.map(([c, n], i) => `<label title="${n}"><input type="radio" name="color" value="${c}"${i ? '' : ' checked'}><span style="--sw:${c || 'var(--txt)'}"></span><small>${n}</small></label>`).join('')}</div>
      <div class="ticker-preview"><span class="tk-label">معاينة</span><b data-preview>نص الرسالة يظهر هنا</b></div>
      <button class="btn primary block">📢 نشر في الشريط</button></form>
    <div class="card"><h3>🗓️ الإعلانات الحالية والمجدولة</h3>${rows.length ? `<div class="list">${rows.map(a => `<div class="row-item"><div class="row-main"><b${/^#[0-9a-f]{6}$/i.test(a.ticker_color || '') ? ` style="color:${a.ticker_color}"` : ''}>${esc(a.title)}</b>
      <small>${new Date(a.scheduled_at).getTime() > now ? '⏳ مجدول' : '🟢 ظاهر الآن'} · من ${esc(fmtDateTime(a.scheduled_at))} إلى ${esc(fmtDateTime(a.expires_at))} · ${esc(a.sender_name || '')}</small></div>
      <button class="small-btn danger" data-del="${a.id}">⏹️ إيقاف</button></div>`).join('')}</div>` : empty('لا توجد إعلانات حالية في الشريط.')}</div>`;
  const f = $('[data-f=ticker-new]', el);
  f.elements.dur.onchange = () => { $('[data-end]', f).hidden = f.elements.dur.value !== 'custom'; };
  const prev = $('[data-preview]', f);
  const paint = () => { prev.textContent = val(f, 'ttl') || 'نص الرسالة يظهر هنا'; prev.style.color = f.querySelector('[name=color]:checked')?.value || ''; };
  f.addEventListener('input', paint); f.addEventListener('change', paint);
  f.onsubmit = e => {
    e.preventDefault();
    busy(f.querySelector('button.primary'), async () => {
      const start = new Date(f.elements.from.value || Date.now());
      const end = f.elements.dur.value === 'custom' ? new Date(f.elements.to.value) : new Date(start.getTime() + Number(f.elements.dur.value) * 36e5);
      if (Number.isNaN(end.getTime())) return toast('حدد تاريخ نهاية الإعلان.', false);
      const r = await call('staff_post_ticker_message', { ...who(), p_title: val(f, 'ttl'), p_message: val(f, 'msg'), p_starts_at: start.toISOString(), p_ends_at: end.toISOString(), p_color: f.querySelector('[name=color]:checked')?.value || null });
      if (!r.ok) return toast(r.message, false);
      toast(r.data?.message || 'تم النشر.'); data.invalidate('announcements'); again();
    });
  };
  el.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
    if (!await confirmBox('إيقاف هذا الإعلان وإخفاؤه من الشريط الآن؟', { okText: 'إيقاف' })) return;
    const r = await call('staff_delete_ticker_news', { ...who(), p_id: Number(b.dataset.del) });
    if (!r.ok) return toast(r.message, false);
    toast('تم إيقاف الإعلان.'); data.invalidate('announcements'); again();
  });
}

/* ---------------- الجداول ---------------- */
async function schedules(el, again) {
  const [coffee, outings, ruleSettings] = await Promise.all([data.coffee(true), data.outings(true), data.settings(true)]);
  const cLabel = x => `${fmtDate(x.coffee_date)} — ${memberName(x.member_id)}`;
  const oLabel = x => `${fmtDate(x.outing_date)} — ${x.outing_type || memberName(x.member1_id) + ' + ' + memberName(x.member2_id)}`;
  el.innerHTML = `
  <details class="card" open><summary><b>☕ موعد قهوة جديد</b></summary><form data-f="coffee-new"><label>الجار</label><select name="member">${memberOpts()}</select>
    <div class="grid2"><div><label>التاريخ</label><input name="date" type="date" required></div><div><label>الوقت</label><input name="time" type="time"></div></div>
    <label>التاريخ الهجري (اختياري)</label><input name="hijri"><label>ملاحظات</label><input name="notes"><button class="btn primary block">➕ إنشاء</button></form></details>
  <details class="card"><summary><b>☕ تعديل / حذف موعد قهوة</b></summary><form data-f="coffee-edit"><select name="rid" data-pick="coffee">${options(coffee, cLabel)}</select>
    <label>الجار</label><select name="member">${memberOpts()}</select>
    <div class="grid2"><div><label>التاريخ</label><input name="date" type="date"></div><div><label>الوقت</label><input name="time" type="time"></div></div>
    <label>ملاحظات</label><input name="notes"><div class="actions"><button class="btn primary" value="save">حفظ</button>${state.manager ? '<button class="btn danger" value="delete">🗑️ حذف</button>' : ''}</div></form></details>
  ${state.manager ? `<details class="card"><summary><b>🔁 تبديل موعدي قهوة</b></summary><form data-f="coffee-swap"><select name="a">${options(coffee, cLabel)}</select><select name="b">${options(coffee, cLabel)}</select><button class="btn secondary block">تبديل</button></form></details>` : ''}
  <details class="card"><summary><b>🚐 موعد طلعة يدوي</b></summary><form data-f="outing-new"><div class="grid2"><div><label>المنظم الأول</label><select name="m1">${memberOpts()}</select></div><div><label>المنظم الثاني</label><select name="m2">${memberOpts()}</select></div></div>
    <div class="grid2"><div><label>التاريخ</label><input name="date" type="date" required></div><div><label>الوقت</label><input name="time" type="time"></div></div>
    <label>التاريخ الهجري (اختياري)</label><input name="hijri"><label>ملاحظات</label><input name="notes"><button class="btn primary block">➕ إنشاء</button></form></details>
  <details class="card"><summary><b>🚐 تعديل / حذف طلعة</b></summary><form data-f="outing-edit"><select name="rid" data-pick="outing">${options(outings, oLabel)}</select>
    <div class="grid2"><div><label>المنظم الأول</label><select name="m1">${memberOpts()}</select></div><div><label>المنظم الثاني</label><select name="m2">${memberOpts()}</select></div></div>
    <div class="grid2"><div><label>التاريخ</label><input name="date" type="date" data-outing-date></div><div><label>الوقت</label><input name="time" type="time"></div></div><p class="status bad" data-outing-warning hidden role="status" aria-live="polite"></p>
    <label>ملاحظات</label><input name="notes">
    <div class="actions"><button class="btn primary" value="save">حفظ التعديل</button><button class="btn secondary" value="time">🕐 تعديل الوقت فقط</button><button class="btn secondary" value="cost">💰 التكاليف</button>${state.manager ? '<button class="btn danger" value="delete">🗑️ حذف</button>' : ''}</div></form></details>
  ${state.manager ? `<details class="card"><summary><b>🔁 تبديل موعدي طلعتين</b></summary><form data-f="outing-swap"><select name="a">${options(outings, oLabel)}</select><select name="b">${options(outings, oLabel)}</select><button class="btn secondary block">تبديل</button></form></details>` : ''}
  <details class="card"><summary><b>🎲 جدول طلعات عشوائي جديد</b></summary><form data-f="outing-random"><p class="muted">يُنشئ جدولًا جديدًا من اليوم وفق القواعد (يتطلب عددًا زوجيًا من الجيران النشطين).</p><button class="btn secondary block">🎲 إنشاء الجدول</button></form></details>`;

  const fillCoffee = f => { const x = coffee.find(c => String(c.id) === f.rid.value); if (!x) return; f.member.value = x.member_id; f.date.value = x.coffee_date || ''; f.time.value = String(x.coffee_time || '').slice(0, 5); f.notes.value = x.notes || ''; };
  const fillOuting = f => { const x = outings.find(c => String(c.id) === f.rid.value); if (!x) return; f.m1.value = x.member1_id ?? ''; f.m2.value = x.member2_id ?? ''; f.date.value = x.outing_date || ''; f.time.value = String(x.outing_time || '').slice(0, 5); f.notes.value = x.notes || ''; updateOutingWarning(); };
  const ce = $('[data-f=coffee-edit]', el), oe = $('[data-f=outing-edit]', el);
  const warning = $('[data-outing-warning]', el);
  const isExpectedOutingDate = value => {
    if (!value) return true;
    const d = new Date(value + 'T12:00:00');
    if (Number.isNaN(d.getTime())) return true;
    const rule = ruleSettings.outing_day_rule || 'first_monday_after_27';
    const monday = x => x.getDay() === 1;
    const firstMondayAfter27 = (year, month) => {
      const x = new Date(year, month, 28, 12);
      while (!monday(x)) x.setDate(x.getDate() + 1);
      return x.toISOString().slice(0, 10);
    };
    if (rule === 'first_monday_of_month') {
      const x = new Date(d.getFullYear(), d.getMonth(), 1, 12);
      while (!monday(x)) x.setDate(x.getDate() + 1);
      return value === x.toISOString().slice(0, 10);
    }
    return value === firstMondayAfter27(d.getFullYear(), d.getMonth()) ||
      value === firstMondayAfter27(d.getFullYear(), d.getMonth() - 1);
  };
  function updateOutingWarning() {
    if (!warning || !oe) return;
    const date = oe.date.value;
    const notes = [];
    if (date && !isExpectedOutingDate(date)) {
      notes.push(ruleSettings.outing_day_rule === 'first_monday_of_month'
        ? 'التاريخ يخالف قاعدة «أول اثنين من الشهر».'
        : 'التاريخ يخالف قاعدة «أول اثنين بعد 27».');
    }
    if (date && ruleSettings.avoid_coffee_conflicts !== false && coffee.some(x => x.coffee_date === date)) {
      notes.push('يوجد موعد قهوة في التاريخ نفسه، وقد يكون هناك تعارض.');
    }
    if (notes.length) {
      warning.textContent = 'تنبيه: ' + notes.join(' ') + ' يمكنك متابعة الحفظ؛ التنبيه لا يمنع التعديل.';
      warning.hidden = false;
    } else {
      warning.textContent = '';
      warning.hidden = true;
    }
  }
  ce.rid.onchange = () => fillCoffee(ce); fillCoffee(ce);
  oe.rid.onchange = () => fillOuting(oe); fillOuting(oe);
  oe.date.addEventListener('input', updateOutingWarning);
  oe.date.addEventListener('change', updateOutingWarning);

  bind(el, '[data-f=coffee-new]', f => state.manager
    ? call('manager_create_coffee', { ...M(), p_member_id: Number(f.member.value), p_date: f.date.value, p_time: f.time.value || null, p_hijri: val(f, 'hijri'), p_notes: val(f, 'notes') })
    : call('supervisor_insert_coffee', { ...S(), p_target_member_id: Number(f.member.value), p_date: f.date.value, p_hijri: val(f, 'hijri'), p_notes: val(f, 'notes') }), again);
  bind(el, '[data-f=coffee-edit]', async (f, btn) => {
    if (btn?.value === 'delete') { if (!(await confirmBox('حذف موعد القهوة نهائيًا؟'))) return null; return call('manager_delete_coffee', { ...M(), p_id: Number(f.rid.value) }); }
    if (!state.manager) return call('supervisor_update_coffee_assignment', { ...S(), p_id: Number(f.rid.value), p_target_member_id: Number(f.member.value), p_date: f.date.value, p_time: f.time.value || null, p_notes: val(f, 'notes') });
    return call('manager_update_coffee_assignment', { ...M(), p_id: Number(f.rid.value), p_member_id: Number(f.member.value), p_date: f.date.value, p_time: f.time.value || null, p_notes: val(f, 'notes') });
  }, again);
  bind(el, '[data-f=coffee-swap]', f => f.a.value === f.b.value ? { ok: false, message: 'اختر موعدين مختلفين.' } : call('manager_swap_coffee_dates', { ...M(), p_id1: Number(f.a.value), p_id2: Number(f.b.value) }), again);
  bind(el, '[data-f=outing-new]', f => state.manager
    ? call('manager_create_outing', { ...M(), p_member1_id: Number(f.m1.value), p_member2_id: Number(f.m2.value), p_date: f.date.value, p_time: f.time.value || null, p_hijri: val(f, 'hijri'), p_notes: val(f, 'notes') })
    : call('supervisor_insert_outing', { ...S(), p_member1_id: Number(f.m1.value), p_member2_id: Number(f.m2.value), p_date: f.date.value, p_hijri: val(f, 'hijri'), p_notes: val(f, 'notes') }), again);
  bind(el, '[data-f=outing-edit]', async (f, btn) => {
    const id = Number(f.rid.value);
    if (btn?.value === 'delete') { if (!(await confirmBox('حذف موعد الطلعة نهائيًا؟'))) return null; return call('manager_delete_outing', { ...M(), p_id: id }); }
    if (btn?.value === 'time') { if (!f.time.value) return { ok: false, message: 'حدد الوقت الجديد.' }; return state.manager ? call('manager_update_outing_time', { ...M(), p_id: id, p_new_time: f.time.value }) : call('supervisor_update_outing_time', { ...S(), p_id: id, p_new_time: f.time.value }); }
    if (btn?.value === 'cost') return outingCost(id);
    if (!state.manager) return call('supervisor_update_outing_assignment', { ...S(), p_id: id, p_member1_id: Number(f.m1.value), p_member2_id: Number(f.m2.value), p_date: f.date.value, p_time: f.time.value || null, p_notes: val(f, 'notes') });
    return call('manager_update_outing_assignment', { ...M(), p_id: id, p_member1_id: Number(f.m1.value), p_member2_id: Number(f.m2.value), p_date: f.date.value, p_time: f.time.value || null, p_notes: val(f, 'notes') });
  }, again);
  bind(el, '[data-f=outing-swap]', f => f.a.value === f.b.value ? { ok: false, message: 'اختر موعدين مختلفين.' } : call('manager_swap_outing_dates', { ...M(), p_id1: Number(f.a.value), p_id2: Number(f.b.value) }), again);
  bind(el, '[data-f=outing-random]', async () => { if (!(await confirmBox('إنشاء جدول طلعات جديد ونشره؟', { danger: false }))) return null; return state.manager ? call('manager_randomize_outings', { ...M(), p_start_date: todayISO() }) : call('supervisor_randomize_outings', { ...S(), p_start_date: todayISO() }); }, again);
}

async function outingCost(id) {
  const ask = async (label, def = '0') => promptBox({ title: '💰 تكاليف الطلعة', label, type: 'number', value: def, inputmode: 'decimal', okText: 'التالي' });
  const food = await ask('تكلفة الأكل (ريال)'); if (food === null) return null;
  const place = await ask('تكلفة المكان (ريال)'); if (place === null) return null;
  const other = await ask('تكاليف أخرى (ريال)'); if (other === null) return null;
  const notes = await promptBox({ title: '💰 تكاليف الطلعة', label: 'ملاحظات (اختياري)', required: false, okText: 'حفظ' });
  if (notes === null) return null;
  return call(state.manager ? 'manager_set_outing_cost_breakdown' : 'supervisor_set_outing_cost_breakdown', { ...(state.manager ? M() : S()), p_outing_id: id, p_food: Number(food) || 0, p_place: Number(place) || 0, p_other: Number(other) || 0, p_notes: notes.trim() });
}

/* ---------------- الطلعات المقترحة ---------------- */
async function plans(el, again) {
  const rows = (await data.outingPlans(true)).filter(p => p.status !== 'rejected');
  const label = p => `${p.outing_type} — ${fmtDate(p.outing_date)} — ${p.attending_count || 0} مشارك`;
  el.innerHTML = `<div class="card"><h3>📊 طلبات الطلعات</h3>${rows.length ? `<div class="list">${rows.map(p => `<div class="row-item col"><b>🚐 ${esc(p.outing_type)} — ${esc(p.outing_place)}</b>
      <small class="muted">${fmtDate(p.outing_date)} · ${p.attending_count || 0} مشارك · المدير ${p.manager_approved ? '✅' : '⏳'} · المشرف ${p.supervisor_approved ? '✅' : '⏳'} · المنظمون: ${esc((p.organizers || []).map(o => o.member_name).join('، ') || 'لم يوزعوا')}</small></div>`).join('')}</div>` : empty('لا توجد طلبات.')}</div>
    ${rows.length ? `${state.manager ? `<form class="card" data-f="random"><h3>🎲 توزيع المنظمين والمشاركين عشوائيًا</h3><select name="plan">${options(rows, label)}</select><label>عدد المنظمين</label><input name="count" type="number" min="1" max="20" value="2"><button class="btn secondary block">🎲 توزيع</button></form>` : ''}
    <form class="card" data-f="approve"><h3>✅ اعتماد الطلعة</h3><p class="muted">تُدرج الطلعة في الجدول بعد موافقة المدير والمشرف.</p><select name="plan">${options(rows, label)}</select><button class="btn primary block">${state.manager ? '✅ موافقة المدير' : '🤝 موافقة المشرف'}</button></form>` : ''}`;
  bind(el, '[data-f=random]', async f => { const r = await call('manager_randomize_outing_plan', { ...M(), p_plan_id: Number(f.plan.value), p_organizer_count: Number(f.count.value) || 1 }); if (r.ok) r.message = `تم اختيار ${r.data?.organizers ?? f.count.value} منظمين وتوزيع ${r.data?.participants ?? 0} مشاركًا.`; return r; }, again);
  bind(el, '[data-f=approve]', async f => { const r = await call('approve_outing_plan', { p_member_id: state.manager ? 0 : state.user.id, p_pin: state.pin, p_plan_id: Number(f.plan.value) }); if (r.ok) r.message = r.data?.scheduled ? 'اكتمل الاعتماد وأُدرجت الطلعة في الجدول.' : 'تم تسجيل موافقتك.'; return r; }, again);
}

/* ---------------- المناسبات ---------------- */
async function occasions(el, again) {
  const rows = (await data.announcements(true)).filter(a => a.is_occasion === true);
  const rules = await list('get_occasion_automation_rules');
  const lbl = x => `${x.occasion_type === 'وطنية' ? '🇸🇦' : '🕌'} ${x.title} — ${fmtDateTime(x.scheduled_at || x.created_at)}`;
  const typeSel = v => `<select name="type"><option value="دينية"${v === 'دينية' ? ' selected' : ''}>🕌 دينية</option><option value="وطنية"${v === 'وطنية' ? ' selected' : ''}>🇸🇦 وطنية</option></select>`;
  el.innerHTML = `<form class="card" data-f="new"><h3>🎉 رسالة مناسبة جديدة</h3>${typeSel('دينية')}<label>العنوان</label><input name="ttl" required><label>الرسالة</label><textarea name="msg" required></textarea>
      <label>وقت الظهور (فارغ = الآن)</label><input name="at" type="datetime-local"><button class="btn primary block">➕ نشر / جدولة</button></form>
    ${rows.length ? `<form class="card" data-f="edit"><h3>📝 تعديل أو حذف</h3><select name="rid">${options(rows, lbl)}</select>${typeSel('')}<label>العنوان</label><input name="ttl"><label>الرسالة</label><textarea name="msg"></textarea><label>وقت الظهور</label><input name="at" type="datetime-local">
      <div class="actions"><button class="btn primary" value="save">حفظ</button><button class="btn danger" value="delete">🗑️ حذف</button></div></form>` : ''}
    <div class="card"><h3>⚙️ المناسبات التلقائية</h3>${!rules.ok ? `<p class="status bad">${esc(rules.message)}</p>` : rules.data.length ? `<div class="list">${rules.data.map(x => `<div class="row-item"><div class="row-main"><b>${x.occasion_type === 'وطنية' ? '🇸🇦' : '🕌'} ${esc(x.title)}</b><small>${x.calendar_type === 'hijri' ? 'هجري' : 'ميلادي'} — ${x.enabled ? 'مفعّل' : 'متوقف'}</small></div><button class="small-btn" data-rule="${esc(x.rule_key)}" data-on="${x.enabled ? 1 : 0}">${x.enabled ? '⏸️ إيقاف' : '▶️ تشغيل'}</button></div>`).join('')}</div>` : empty('لا توجد قواعد تلقائية.')}</div>`;
  const toIso = v => v ? new Date(v).toISOString() : null;
  const local = d => { if (!d) return ''; const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 16); };
  const ef = $('[data-f=edit]', el);
  if (ef) { const fill = () => { const x = rows.find(r => String(r.id) === ef.rid.value); if (!x) return; ef.type.value = x.occasion_type || 'دينية'; ef.ttl.value = x.title || ''; ef.msg.value = x.message || ''; ef.at.value = local(x.scheduled_at); }; ef.rid.onchange = fill; fill(); }
  const auth = state.manager ? M() : S();
  const fn = op => (state.manager ? 'manager_' : 'supervisor_') + op + '_occasion_message';
  bind(el, '[data-f=new]', f => call(fn('create'), { ...auth, p_type: f.type.value, p_title: val(f, 'ttl'), p_message: val(f, 'msg'), p_scheduled_at: toIso(f.at.value) || new Date().toISOString() }), again);
  bind(el, '[data-f=edit]', async (f, btn) => {
    if (btn?.value === 'delete') { if (!(await confirmBox('حذف رسالة المناسبة نهائيًا؟'))) return null; return call(fn('delete'), { ...auth, p_id: Number(f.rid.value) }); }
    return call(fn('update'), { ...auth, p_id: Number(f.rid.value), p_type: f.type.value, p_title: val(f, 'ttl'), p_message: val(f, 'msg'), p_scheduled_at: toIso(f.at.value) });
  }, again);
  el.querySelectorAll('[data-rule]').forEach(b => b.onclick = () => busy(b, async () => {
    const enabled = b.dataset.on !== '1';
    const r = state.manager ? await call('manager_set_occasion_automation', { ...M(), p_rule_key: b.dataset.rule, p_enabled: enabled }) : await call('supervisor_set_occasion_automation', { ...S(), p_rule_key: b.dataset.rule, p_enabled: enabled });
    if (!r.ok) return toast(r.message, false);
    toast('تم التحديث.'); again();
  }));
}

/* ---------------- الرسائل والتنبيهات ---------------- */
async function messages(el, again) {
  const msgs = (await data.groupMessages(true)).slice().reverse();
  const lbl = m => `${fmtDateTime(m.created_at)} — ${String(m.message).slice(0, 60)}`;
  el.innerHTML = `<form class="card" data-f="new"><h3>💬 رسالة للمجموعة</h3><textarea name="msg" required></textarea><button class="btn primary block">➕ إرسال</button></form>
    ${msgs.length ? `<form class="card" data-f="edit"><h3>📝 تعديل / حذف رسالة</h3><select name="rid">${options(msgs, lbl)}</select><textarea name="msg"></textarea><div class="actions"><button class="btn primary" value="save">حفظ</button><button class="btn danger" value="delete">🗑️ حذف</button></div></form>` : ''}
    <form class="card" data-f="notify"><h3>🔔 جدولة إعلان</h3><label>العنوان</label><input name="title" required><label>النص</label><textarea name="msg" required></textarea><label>وقت النشر</label><input name="at" type="datetime-local" required><button class="btn secondary block">جدولة</button></form>`;
  const ef = $('[data-f=edit]', el);
  if (ef) { const fill = () => { ef.msg.value = msgs.find(m => String(m.id) === ef.rid.value)?.message || ''; }; ef.rid.onchange = fill; fill(); }
  bind(el, '[data-f=new]', f => call('manager_create_group_message', { ...M(), p_message: val(f, 'msg') }), again);
  bind(el, '[data-f=edit]', async (f, btn) => {
    if (btn?.value === 'delete') { if (!(await confirmBox('حذف الرسالة نهائيًا؟'))) return null; return call('manager_delete_group_message', { ...M(), p_id: Number(f.rid.value) }); }
    return call('manager_update_group_message', { ...M(), p_id: Number(f.rid.value), p_message: val(f, 'msg') });
  }, again);
  bind(el, '[data-f=notify]', f => call('manager_schedule_notification', { ...M(), p_title: val(f, 'title'), p_message: val(f, 'msg'), p_scheduled_at: new Date(f.at.value).toISOString() }), again);
}

/* ---------------- الأعضاء والأرقام ---------------- */
async function members(el, again) {
  const [reqs, all] = await Promise.all([list('manager_get_pin_reset_requests', M()), list('manager_list_members', M())]);
  const rows = all.data;
  const active = rows.filter(m => m.active), inactive = rows.filter(m => !m.active);
  const row = m => `<div class="row-item${m.active ? '' : ' inactive'}"><div class="row-main"><b>${esc(m.name)}</b><small>${m.role === 'supervisor' ? '🛡️ مشرف · ' : ''}${m.phone ? esc(m.phone) : 'بدون جوال'}${m.last_seen_at ? ' · آخر دخول ' + fmtDateTime(m.last_seen_at) : ''}</small></div><div class="row-side">
      ${m.active ? `<button class="small-btn" data-act="rename" data-id="${m.id}">✏️ الاسم</button><button class="small-btn" data-act="pin" data-id="${m.id}">🔑 الرقم</button><button class="small-btn ghost" data-act="suspend" data-id="${m.id}">⏸️ إيقاف</button>`
                 : `<button class="small-btn" data-act="restore" data-id="${m.id}">↩️ إعادة العضو</button>`}</div></div>`;
  el.innerHTML = `<div class="card"><h3>🔑 طلبات استعادة الرقم السري</h3>${!reqs.ok ? `<p class="status bad">${esc(reqs.message)}</p>` : reqs.data.length ? reqs.data.map(r => `
      <form class="row-item col" data-f="reset" data-id="${r.id}"><b>${esc(r.full_name)}</b><small class="muted">${r.phone ? esc(r.phone) : 'لا يوجد جوال'} — ${fmtDateTime(r.created_at)}</small>
      <div class="inline-form"><input name="pin" type="password" inputmode="numeric" maxlength="12" placeholder="الرقم الجديد" required><button class="small-btn">تعيين وإغلاق الطلب</button></div></form>`).join('') : empty('لا توجد طلبات مفتوحة.')}</div>
    <details class="card"><summary><b>➕ إضافة جار</b></summary><form data-f="add"><label>الاسم</label><input name="name" required><label>الجوال (للتحقق عند الاستعادة)</label><input name="phone" inputmode="tel" placeholder="05xxxxxxxx"><label>ملاحظات</label><input name="notes"><label>الرقم السري الأولي (4–12 رقمًا)</label><input name="pin" inputmode="numeric" maxlength="12"><button class="btn primary block">إضافة</button></form></details>
    <div class="card"><h3>👥 الأعضاء النشطون (${active.length})</h3>${!all.ok ? `<p class="status bad">${esc(all.message)}</p>` : `<input class="search" type="search" placeholder="🔎 بحث" data-q><div class="list" data-list>${active.map(row).join('')}</div>`}</div>
    <div class="card"><h3>⏸️ الأعضاء الموقوفون (${inactive.length})</h3>${inactive.length ? `<div class="list">${inactive.map(row).join('')}</div>` : empty('لا يوجد أعضاء موقوفون.')}</div>
    <details class="card"><summary><b>🛠️ تغيير رقم المطور</b></summary><form data-f="mgrpin"><input name="old" type="password" inputmode="numeric" placeholder="الرقم الحالي" required><input name="next" type="password" inputmode="numeric" placeholder="الرقم الجديد" required><button class="btn secondary block">تغيير</button></form></details>`;
  const reload = async () => { await loadMembers(); again(); };
  $('[data-q]', el)?.addEventListener('input', e => { const q = e.target.value.trim(); el.querySelectorAll('[data-list] .row-item').forEach(r => { r.hidden = q && !r.textContent.includes(q); }); });
  bind(el, '[data-f=reset]', f => { const pin = pinOf(f.pin.value); return PIN_PATTERN.test(pin) ? call('manager_reset_member_pin_from_request', { ...M(), p_request_id: Number(f.dataset.id), p_new_pin: pin }) : { ok: false, message: 'الرقم السري من 4 إلى 12 رقمًا (أرقام فقط).' }; }, again);
  bind(el, '[data-f=add]', f => { const pin = pinOf(val(f, 'pin')); if (pin && !PIN_PATTERN.test(pin)) return { ok: false, message: 'الرقم السري من 4 إلى 12 رقمًا.' }; return call('manager_add_member', { ...M(), p_name: val(f, 'name'), p_phone: val(f, 'phone'), p_notes: val(f, 'notes'), p_member_pin: pin || null }); }, reload);
  bind(el, '[data-f=mgrpin]', async f => { const r = await call('manager_set_manager_pin', { p_current_pin: pinOf(f.old.value), p_new_pin: pinOf(f.next.value) }); if (r.ok) setTimeout(logout, 600); return r; });
  el.querySelectorAll('[data-act]').forEach(b => b.onclick = () => busy(b, async () => {
    const id = Number(b.dataset.id), name = rows.find(m => Number(m.id) === id)?.name || memberName(id);
    let r;
    if (b.dataset.act === 'rename') { const v = await promptBox({ title: 'تعديل الاسم', label: 'الاسم الجديد', value: name }); if (!v || v.trim() === name) return; r = await call('manager_update_member_name', { ...M(), p_member_id: id, p_name: v.trim() }); }
    else if (b.dataset.act === 'pin') { const v = await promptBox({ title: 'رقم سري جديد لـ ' + name, label: '4 إلى 12 رقمًا', type: 'password', inputmode: 'numeric' }); if (v === null) return; const np = pinOf(v); if (!PIN_PATTERN.test(np)) return toast('الرقم السري من 4 إلى 12 رقمًا (أرقام فقط).', false); r = await call('manager_set_member_pin', { ...M(), p_member_id: id, p_new_pin: np }); }
    else if (b.dataset.act === 'suspend') { if (!(await confirmBox(`إيقاف العضو «${name}»؟ لن يستطيع الدخول، وتُلغى صلاحياته وأجهزته المحفوظة. يمكنك إعادته لاحقًا.`, { okText: 'إيقاف' }))) return; r = await call('manager_set_member_active', { ...M(), p_member_id: id, p_active: false }); }
    else { r = await call('manager_set_member_active', { ...M(), p_member_id: id, p_active: true }); }
    if (!r.ok) return toast(r.message, false);
    toast(r.message || 'تم.'); if (b.dataset.act !== 'pin') reload();
  }));
}

/* ---------------- المشرفون ---------------- */
const PERMS = [['coffee', 'إدارة القهوة'], ['outings', 'إدارة الطلعات'], ['dates', 'تقديم وتأخير المواعيد'], ['members', 'إدارة الأعضاء والأرقام'], ['rules', 'إدارة القواعد'], ['messages', 'إرسال رسائل المجموعة'], ['lottery', 'القرعة والجدول العشوائي'], ['apologies', 'إدارة الاعتذارات']];
const PERM_COL = { coffee: 'can_manage_coffee', outings: 'can_manage_outings', dates: 'can_manage_dates', members: 'can_manage_members', rules: 'can_manage_rules', messages: 'can_send_group_messages', lottery: 'can_manage_lottery', apologies: 'can_manage_apologies' };

async function permissions(el, again) {
  const p = await table('member_permissions', { order: 'member_id' });
  const map = new Map(p.data.map(x => [Number(x.member_id), x]));
  const sups = activeMembers().filter(m => map.get(Number(m.id))?.role === 'supervisor');
  const chips = x => PERMS.filter(([k]) => x[PERM_COL[k]]).map(([, l]) => `<span class="pill">${l}</span>`).join('') || '<span class="muted">بدون صلاحيات</span>';
  el.innerHTML = `<div class="card"><h3>🛡️ المشرفون الحاليون (${sups.length})</h3>${!p.ok ? `<p class="status bad">${esc(p.message)}</p>` : sups.length ? `<div class="list">${sups.map(m => `<div class="row-item col"><div class="row-head"><b>${esc(m.name)}</b><span><button class="small-btn" data-edit="${m.id}">✏️ تعديل الصلاحيات</button> <button class="small-btn ghost" data-revoke="${m.id}">إلغاء الإشراف</button></span></div><div class="chips">${chips(map.get(Number(m.id)))}</div></div>`).join('')}</div>` : empty('لا يوجد مشرفون بعد.')}</div>
    <form class="card" data-f="perm"><h3>➕ تعيين مشرف أو تعديل صلاحياته</h3><p class="muted">اختر العضو وحدد ما يُوكل إليه فقط. يمكنك تعيين أكثر من مشرف.</p><select name="member">${memberOpts()}</select>
      ${PERMS.map(([k, l]) => `<label class="check"><input type="checkbox" name="${k}"> ${l}</label>`).join('')}<button class="btn primary block">حفظ الصلاحيات</button></form>`;
  const f = $('[data-f=perm]', el);
  const fill = () => { const x = map.get(Number(f.member.value)) || {}; PERMS.forEach(([k]) => { f[k].checked = !!x[PERM_COL[k]]; }); };
  f.member.onchange = fill; fill();
  el.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => { f.member.value = b.dataset.edit; fill(); f.scrollIntoView({ behavior: 'smooth' }); });
  bind(el, '[data-f=perm]', ff => PERMS.some(([k]) => ff[k].checked) ? call('manager_set_member_permissions', { ...M(), p_member_id: Number(ff.member.value), ...Object.fromEntries(PERMS.map(([k]) => ['p_' + (PERM_COL[k]), ff[k].checked])) }) : { ok: false, message: 'حدد صلاحية واحدة على الأقل، أو استخدم «إلغاء الإشراف».' }, again);
  el.querySelectorAll('[data-revoke]').forEach(b => b.onclick = () => busy(b, async () => {
    if (!(await confirmBox('إلغاء صلاحيات المشرف؟'))) return;
    const r = await call('manager_remove_supervisor', { ...M(), p_member_id: Number(b.dataset.revoke) });
    if (!r.ok) return toast(r.message, false);
    toast('تم إلغاء الإشراف.'); again();
  }));
}

/* ---------------- القواعد ---------------- */
async function rules(el, again) {
  const s = await data.settings(true);
  const sel = (name, opts, cur) => `<select name="${name}">${opts.map(([v, l]) => `<option value="${v}"${v === cur ? ' selected' : ''}>${l}</option>`).join('')}</select>`;
  el.innerHTML = `<form class="card" data-f="rules"><h3>⚙️ قواعد الجدولة</h3>
    <label>فاصل القهوة بالأيام</label><input name="interval" type="number" min="1" value="${esc(s.coffee_interval_days ?? 14)}">
    <label>ترتيب القهوة</label>${sel('order', [['current', 'الترتيب الحالي'], ['alphabetical', 'أبجدي'], ['random_no_repeat', 'عشوائي بدون تكرار']], s.coffee_order_mode)}
    <label class="check"><input type="checkbox" name="avoid" ${s.coffee_avoid_repeat === false ? '' : 'checked'}> عدم تكرار القهوة</label>
    <label>تكرار الطلعات</label>${sel('freq', [['monthly', 'شهري']], s.outing_frequency)}
    <label>قاعدة يوم الطلعة</label>${sel('rule', [['first_monday_after_27', 'أول اثنين بعد 27'], ['first_monday_of_month', 'أول اثنين من الشهر']], s.outing_day_rule)}
    <label>نمط الأزواج</label>${sel('pair', [['random_no_repeat', 'عشوائي بدون تكرار'], ['current', 'الحالي']], s.outing_pair_mode)}
    <label class="check"><input type="checkbox" name="conflict" ${s.avoid_coffee_conflicts === false ? '' : 'checked'}> منع تعارض القهوة والطلعات</label>
    <button class="btn primary block">حفظ القواعد</button></form>`;
  bind(el, '[data-f=rules]', f => call(state.manager ? 'manager_set_schedule_rules' : 'supervisor_set_schedule_rules', { ...(state.manager ? M() : S()), p_coffee_interval_days: Number(f.interval.value) || 14, p_coffee_order_mode: f.order.value, p_coffee_avoid_repeat: f.avoid.checked, p_outing_frequency: f.freq.value, p_outing_day_rule: f.rule.value, p_outing_pair_mode: f.pair.value, p_avoid_coffee_conflicts: f.conflict.checked }), again);
}

/* ---------------- التفقد ---------------- */
async function checks(el, again) {
  const r = await list('manager_get_neighbor_checks', M());
  el.innerHTML = `<div class="card"><h3>❤️ حالات تفقد الجيران</h3>${!r.ok ? `<p class="status bad">${esc(r.message)}</p>` : r.data.length ? `<div class="list">${r.data.map(x => `<div class="row-item col">
    <div class="row-head"><b>${esc(x.category)}${x.target_member_id ? ' — ' + esc(memberName(x.target_member_id)) : ''}</b><span class="pill">${esc(x.status)}</span></div>
    <p>${esc(x.details || 'بدون تفاصيل')}</p><small class="muted">المبلّغ: ${esc(memberName(x.reporter_member_id))} — ${esc(x.visibility || '')} — ${fmtDateTime(x.created_at)}</small>
    <div class="actions small">${['تم التواصل', 'تمت المساعدة', 'مغلقة'].map(s => `<button class="small-btn" data-id="${x.id}" data-status="${s}">${s}</button>`).join('')}<button class="small-btn ghost" data-del="${x.id}">حذف</button></div></div>`).join('')}</div>` : empty('لا توجد حالات.')}</div>`;
  el.querySelectorAll('[data-status]').forEach(b => b.onclick = () => busy(b, async () => { const res = await call('manager_update_neighbor_check', { ...M(), p_id: Number(b.dataset.id), p_status: b.dataset.status }); toast(res.ok ? 'تم التحديث.' : res.message, res.ok); if (res.ok) again(); }));
  el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => busy(b, async () => { if (!(await confirmBox('حذف الحالة؟'))) return; const res = await call('manager_delete_neighbor_check', { ...M(), p_id: Number(b.dataset.del) }); toast(res.ok ? 'تم الحذف.' : res.message, res.ok); if (res.ok) again(); }));
}

/* ---------------- الخدمات (تفعيل/إيقاف/ترتيب) ---------------- */
// أقسام داخلية يمكن إيقافها منفردة (داخل «خدمات الحي» و«روابط مفيدة» و«الرسائل»).
const SUB_SERVICES = ['🔧 أقسام داخلية', [
  ['links/jobs', '💼', 'الوظائف', '', 'all'],
  ['links/gov', '🏛️', 'خدمات عامة', '', 'all'], ['prayer', '🕌', 'مواقيت الصلاة', '', 'all'], ['weather', '🌤️', 'الطقس', '', 'all']
]];
async function services(el, again) {
  const svc = await data.serviceSettings(true);
  el.innerHTML = `<p class="muted">أوقف أي خدمة أو أعد ترتيبها داخل مجموعتها (الرقم الأصغر يظهر أولًا). الخدمة الموقوفة تختفي من الرئيسية وتظهر رسالتك لمن يفتح رابطها. المطور يرى كل الخدمات دائمًا.</p>` +
    [...GROUPS, SUB_SERVICES].map(([g, items]) => `<div class="card"><h3>${g}</h3><div class="list">${items.filter(t => !['admin', 'dev'].includes(t[4])).map(([id, i, t], idx) => { const s = svc[id] || {}; return `
      <form class="row-item col svc-row" data-svc="${id}"><div><b>${i} ${t}</b>${s.enabled === false ? ' <span class="pill">⏸️ موقوفة</span>' : ''}</div>
        <div class="ctl"><label class="switch"><input type="checkbox" name="on" ${s.enabled === false ? '' : 'checked'}> مفعّلة</label>
        <input type="number" name="order" min="0" max="999" value="${esc(s.sort_order ?? idx + 1)}" aria-label="الترتيب">
        <input name="note" placeholder="رسالة عند الإيقاف (اختياري)" value="${esc(s.note || '')}"><button class="small-btn">حفظ</button></div></form>`; }).join('')}</div></div>`).join('');
  bind(el, '[data-svc]', f => call('manager_set_service_setting', { ...M(), p_key: f.dataset.svc, p_enabled: f.on.checked, p_sort_order: Number(f.order.value) || 0, p_note: val(f, 'note') }), () => { data.invalidate('svc'); again(); });
}

/* ---------------- المحتوى (إغلاق/إعادة/إلغاء) ---------------- */
const CONTENT = [['help', '🤝 خدمات الجيران', s => s === 'open'], ['market', '🛍️ السوق والمفقودات', s => s === 'open'], ['initiative', '💡 المبادرات', s => s !== 'محذوفة'], ['rental', '🏠 سكن الحي', s => s === 'open'], ['event', '🎉 مناسبات الحي', s => s !== 'ملغاة']];
async function content(el, again) {
  const r = await call('manager_list_content', M());
  if (!r.ok) { el.innerHTML = `<div class="card"><p class="status bad">${esc(r.message)}</p></div>`; return; }
  el.innerHTML = `<p class="muted">إغلاق المنشور يخفيه عن الأعضاء دون حذفه، ويمكن إعادته. المناسبة الملغاة تبقى في السجل.</p>` + CONTENT.map(([k, label, isOpen]) => { const rows = r.data?.[k] || []; return `<details class="card"${rows.length ? ' open' : ''}><summary><b>${label}</b> <span class="muted">(${rows.length})</span></summary>
    ${rows.length ? `<div class="list">${rows.map(x => { const open = isOpen(x.status); return `<div class="row-item${open ? '' : ' inactive'}"><div class="row-main"><b>${esc(x.title)}</b><small>${esc(x.member_name || '')} ${x.kind ? '· ' + esc(x.kind) : ''} · ${esc(x.status || '')} · ${fmtDateTime(x.event_date || x.created_at)}</small></div>
      <div class="row-side"><button class="small-btn${open ? ' ghost' : ''}" data-kind="${k}" data-id="${x.id}" data-open="${open ? 0 : 1}">${open ? (k === 'event' ? '⛔ إلغاء' : '⛔ إغلاق') : '↩️ إعادة'}</button></div></div>`; }).join('')}</div>` : empty('لا يوجد محتوى.')}</details>`; }).join('');
  el.querySelectorAll('[data-kind]').forEach(b => b.onclick = () => busy(b, async () => {
    const opening = b.dataset.open === '1';
    if (!opening && !(await confirmBox('إخفاء هذا العنصر عن الأعضاء؟', { okText: 'تأكيد' }))) return;
    const res = await call('manager_set_content_open', { ...M(), p_kind: b.dataset.kind, p_id: Number(b.dataset.id), p_open: opening });
    if (!res.ok) return toast(res.message, false);
    toast('تم.'); again();
  }));
}

/* ---------------- المجتمعات الجديدة ---------------- */
const C_STATUS = { pending: '⏳ قيد المراجعة', active: '✅ نشط', rejected: '⛔ مرفوض', suspended: '⏸️ موقوف' };
async function communities(el, again) {
  const r = state.manager ? await list('manager_list_communities', M()) : await list('supervisor_list_communities', S());
  if (!r.ok) { el.innerHTML = `<div class="card"><p class="status bad">${esc(r.message)}</p><p class="muted">مراجعة المجتمعات للمطور وللمشرف المخوّل بإدارة الأعضاء.</p></div>`; return; }
  const btn = (c, a, l, cls = '') => `<button class="small-btn ${cls}" data-c="${c.id}" data-a="${a}">${l}</button>`;
  el.innerHTML = `<p class="muted">اعتماد طلب المجتمع يُنشئ رمز انضمام لصاحبه. الإيقاف يجمّد المجتمع ويمنع قبول الأعضاء حتى إعادته.</p>` +
    (r.data.length ? `<div class="list">${r.data.map(c => `<div class="row-item col${c.status === 'active' || c.status === 'pending' ? '' : ' inactive'}">
      <div class="row-head"><b>🏘️ ${esc(c.name)}</b><span class="pill">${C_STATUS[c.status] || esc(c.status)}</span></div>
      <small class="muted">صاحبه: ${esc(c.owner_name)} · ${c.members_count} عضو · ${fmtDateTime(c.created_at)}${c.join_code ? ' · الرمز ' + esc(c.join_code) : ''}</small>
      ${c.description ? `<p>${esc(c.description)}</p>` : ''}${c.review_note ? `<p class="muted">ملاحظة: ${esc(c.review_note)}</p>` : ''}
      <div class="actions small">${c.status === 'pending' ? btn(c, 'approve', '✅ اعتماد') + btn(c, 'reject', '⛔ رفض', 'ghost') : c.status === 'active' ? btn(c, 'suspend', '⏸️ إيقاف', 'ghost') : c.status === 'suspended' ? btn(c, 'activate', '↩️ إعادة تفعيل') : ''}</div></div>`).join('')}</div>` : `<div class="card">${empty('لا توجد مجتمعات أو طلبات بعد.')}</div>`);
  el.querySelectorAll('[data-c]').forEach(b => b.onclick = () => busy(b, async () => {
    const a = b.dataset.a;
    const note = ['reject', 'suspend', 'approve'].includes(a) ? await promptBox({ title: a === 'approve' ? 'اعتماد المجتمع' : a === 'reject' ? 'رفض الطلب' : 'إيقاف المجتمع', label: 'ملاحظة لصاحب المجتمع (اختياري)', required: false, okText: 'تأكيد' }) : '';
    if (note === null) return;
    const args = { p_id: Number(b.dataset.c), p_action: a, p_note: note || '' };
    const res = state.manager ? await call('manager_review_community', { ...M(), ...args }) : await call('supervisor_review_community', { ...S(), ...args });
    if (!res.ok) return toast(res.message, false);
    toast('تم.'); again();
  }));
}

/* ---------------- التقارير والنسخ ---------------- */
function statsHtml(obj, depth = 0) {
  if (obj == null || typeof obj !== 'object') return esc(obj);
  if (Array.isArray(obj)) return obj.length ? `<ul>${obj.slice(0, 30).map(x => `<li>${statsHtml(x, depth + 1)}</li>`).join('')}</ul>` : '—';
  return `<dl class="kv">${Object.entries(obj).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${statsHtml(v, depth + 1)}</dd>`).join('')}</dl>`;
}

async function reports(el) {
  el.innerHTML = `<div class="card"><h3>📊 إحصاءات البرنامج</h3><button class="btn secondary block" data-stats>تحديث الإحصاءات</button><div data-out></div></div>
    <div class="card"><h3>💾 النسخ الاحتياطي</h3><p class="muted">تُنزّل نسخة JSON بدون الأرقام السرية.</p><button class="btn secondary block" data-backup>⬇️ تنزيل نسخة احتياطية</button>
      <label class="btn secondary block file-btn">⬆️ استعادة نسخة<input type="file" accept="application/json,.json" data-restore hidden></label></div>`;
  $('[data-stats]', el).onclick = e => busy(e.currentTarget, async () => {
    const r = await call('manager_activity_stats', { ...M(), p_limit: 500 });
    $('[data-out]', el).innerHTML = r.ok || r.data?.totals ? statsHtml(r.data) : `<p class="status bad">${esc(r.message)}</p>`;
  });
  $('[data-backup]', el).onclick = e => busy(e.currentTarget, async () => {
    const r = await call('manager_export_backup', M());
    if (!r.ok) return toast(r.missing ? 'النسخ الاحتياطي يحتاج تطبيق ترحيل قاعدة البيانات الجديد (manager_export_backup).' : r.message, false);
    const blob = new Blob([JSON.stringify({ app: 'جيران حي الغدير', created_at: new Date().toISOString(), ...r.data }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'ghadeer-backup-' + todayISO() + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    toast('تم تنزيل النسخة.');
  });
  $('[data-restore]', el).onchange = async e => {
    const file = e.target.files[0]; e.target.value = '';
    if (!file || !(await confirmBox('الاستعادة قد تعدّل بيانات البرنامج. متابعة؟'))) return;
    try {
      const json = JSON.parse(await file.text());
      if (!json?.tables) throw new Error('ملف النسخة غير صالح');
      const r = await call('manager_restore_backup', { ...M(), p_data: json });
      toast(r.ok ? 'تمت الاستعادة.' : r.message, r.ok);
      if (r.ok) { data.invalidate(); await loadMembers(); }
    } catch (err) { toast('تعذر قراءة الملف: ' + err.message, false); }
  };
}


/* ---------------- طلبات الانضمام ---------------- */
async function joinRequests(el, again) {
  const r = state.manager
    ? await call('manager_list_ghadeer_join_requests', M())
    : await call('supervisor_list_ghadeer_join_requests', { p_member_id: state.user?.id, p_pin: state.pin });
  if (!r.ok) {
    el.innerHTML = `<div class="card"><h3>📨 طلبات الانضمام الجديدة</h3><p class="muted">تعذر تحميل الطلبات. إذا لم تُطبّق ترحيلات قاعدة البيانات بعد، فستحتاج إلى تطبيق ترحيل طلبات الانضمام أولًا.</p><p class="status bad">${esc(r.message || 'تعذر الاتصال')}</p><button class="btn secondary" data-reload>إعادة المحاولة</button></div>`;
    el.querySelector('[data-reload]').onclick = again;
    return;
  }
  const rows = Array.isArray(r.data) ? r.data : Array.isArray(r.data?.requests) ? r.data.requests : [];
  el.innerHTML = `<div class="card"><h3>📨 طلبات الانضمام</h3><p class="muted">راجع البيانات، وأضف العضو من قسم «الأعضاء والأرقام» بعد التحقق منه، ثم أغلق الطلب باعتباره تمت معالجته. لا تُضاف العضوية تلقائيًا.</p></div>
    ${rows.length ? rows.map(x => `<article class="card join-request-card">
      <div class="row-between"><h3>${esc(x.full_name)}</h3><span class="pill">${esc(fmtDateTime(x.created_at))}</span></div>
      <p><b>الجوال:</b> <a href="tel:${esc(x.phone)}" dir="ltr">${esc(x.phone)}</a></p>
      <p><b>العنوان:</b> ${esc(x.address)}</p>
      ${x.occupation ? `<p><b>العمل:</b> ${esc(x.occupation)}</p>` : ''}
      ${x.note ? `<p><b>رسالة للمدير:</b> ${esc(x.note)}</p>` : ''}
      <p class="muted small">وافق على إصدار الشروط ${esc(x.terms_version)} بتاريخ ${esc(fmtDateTime(x.terms_accepted_at))}</p>
      <div class="actions"><button class="btn primary" data-process="${esc(x.id)}">تمت الإضافة للعضوية</button><button class="btn danger" data-decline="${esc(x.id)}">رفض الطلب</button></div>
    </article>`).join('') : '<div class="card center"><p class="tile-icon">🌿</p><h3>لا توجد طلبات معلّقة</h3><p class="muted">ستظهر هنا طلبات الانضمام الجديدة.</p></div>'}`;
  el.querySelectorAll('[data-process]').forEach(btn => btn.onclick = async () => {
    if (!await confirmBox('تأكد أنك أضفت هذا الشخص إلى قائمة الأعضاء قبل إغلاق الطلب باعتباره تمت معالجته.', { okText: 'نعم، تمت الإضافة', danger: false })) return;
    await busy(btn, async () => {
      const out = state.manager
        ? await call('manager_close_ghadeer_join_request', { ...M(), p_request_id: Number(btn.dataset.process), p_status: 'processed' })
        : await call('supervisor_close_ghadeer_join_request', { p_member_id: state.user?.id, p_pin: state.pin, p_request_id: Number(btn.dataset.process), p_status: 'processed' });
      if (!out.ok || out.data?.success !== true) return toast(out.message || out.data?.message || 'تعذر تحديث الطلب.', false);
      toast(out.data?.message || 'تم إغلاق الطلب.');
      await again();
    });
  });
  el.querySelectorAll('[data-decline]').forEach(btn => btn.onclick = async () => {
    if (!await confirmBox('هل تريد رفض طلب الانضمام وإغلاقه؟', { okText: 'رفض الطلب' })) return;
    await busy(btn, async () => {
      const out = state.manager
        ? await call('manager_close_ghadeer_join_request', { ...M(), p_request_id: Number(btn.dataset.decline), p_status: 'declined' })
        : await call('supervisor_close_ghadeer_join_request', { p_member_id: state.user?.id, p_pin: state.pin, p_request_id: Number(btn.dataset.decline), p_status: 'declined' });
      if (!out.ok || out.data?.success !== true) return toast(out.message || out.data?.message || 'تعذر تحديث الطلب.', false);
      toast(out.data?.message || 'تم رفض الطلب.');
      await again();
    });
  });
}
