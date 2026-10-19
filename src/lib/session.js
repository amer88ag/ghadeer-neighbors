/* الحالة والجلسة: من المستخدم الحالي، ودخول الأعضاء والمدير، وحفظ الجهاز. */
import { call, publicMembers } from './api.js';
import { openModal, esc, toast, normalizeDigits, options, busy } from './dom.js';
import { DEVICE_TOKEN_KEY, PIN_PATTERN, TERMS_VERSION } from '../config.js';

export const state = {
  members: [],        // {id,name,active}
  user: null,         // {id,name,role}
  pin: null,          // في الذاكرة فقط — لا يُحفظ في المتصفح إطلاقًا
  manager: false,
  supervisor: false,
  termsOk: false      // وافق على الإصدار الحالي من الشروط في هذه الجلسة
};

const listeners = new Set();
export const onChange = fn => { listeners.add(fn); return () => listeners.delete(fn); };
export const emit = () => listeners.forEach(fn => { try { fn(state); } catch (e) { console.error(e); } });

export const isLogged = () => !!state.user;
export const canManage = () => state.manager || state.supervisor;
export const memberName = id => state.members.find(m => Number(m.id) === Number(id))?.name || '—';
export const activeMembers = () => state.members.filter(m => m.active !== false);

/** بيانات اعتماد العضو لدوال RPC. */
export const creds = () => ({ p_member_id: state.user?.id, p_pin: state.pin });

const storage = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* وضع خاص */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* وضع خاص */ } }
};

const MEMBERS_CACHE = 'ghadeer.members.v1';
/** أسماء الجيران العامة (id, name, active) من الذاكرة المحلية لعرض فوري، ثم تُحدَّث من الخادم. */
export function loadCachedMembers() {
  try { const m = JSON.parse(storage.get(MEMBERS_CACHE) || 'null'); if (Array.isArray(m) && m.length) state.members = m; } catch { /* تجاهل */ }
  return state.members;
}
export async function loadMembers() {
  const fresh = await publicMembers();
  const changed = JSON.stringify(fresh) !== JSON.stringify(state.members);
  if (fresh.length) { state.members = fresh; storage.set(MEMBERS_CACHE, JSON.stringify(fresh)); }
  if (changed) emit();
  return changed;
}

function setUser(user, pin, { manager = false, supervisor = false, silent = false } = {}) {
  state.user = user;
  state.pin = pin;
  state.manager = manager;
  state.supervisor = supervisor || manager;
  state.termsOk = manager;
  if (!silent) emit();
}

/** يستعيد هوية العضو من رمز الجهاز المحفوظ (بدون الرقم السري). */
export async function restoreDevice() {
  const token = storage.get(DEVICE_TOKEN_KEY);
  if (!token) return false;
  const r = await call('member_login_by_device_token', { p_token: token });
  if (!r.ok || !r.data?.success) { storage.del(DEVICE_TOKEN_KEY); return false; }
  setUser({ id: Number(r.data.member_id), name: r.data.name || memberName(r.data.member_id), role: 'member' }, null);
  return true;
}

async function rememberDevice() {
  const who = state.user?.id;
  const r = await call('issue_member_device_token', { ...creds(), p_device_label: (navigator.userAgent || 'device').slice(0, 110) });
  // يُحفظ الرمز فقط إن بقي العضو نفسه داخلًا (لم يرفض الشروط أو يخرج أثناء الطلب).
  if (r.ok && r.data?.token && state.user?.id === who) storage.set(DEVICE_TOKEN_KEY, r.data.token);
  else if (r.ok && r.data?.token) call('member_revoke_device_token', { p_token: r.data.token });
}

async function memberLogin(id, pin, remember) {
  const r = await call('member_login', { p_member_id: id, p_pin: pin });
  if (!r.ok || r.data?.success !== true) return { ok: false, message: r.message || 'الرقم السري غير صحيح.' };
  const role = r.data.role || 'member';
  // تحديث الواجهة مرة واحدة بعد اكتمال الدخول، وحفظ الجهاز في الخلفية بالتوازي مع فحص الشروط.
  setUser({ id, name: r.data.name || memberName(id), role }, pin, { supervisor: ['supervisor', 'super_admin'].includes(role), silent: true });
  if (remember && !storage.get(DEVICE_TOKEN_KEY)) rememberDevice().catch(() => {});
  await ensureTerms();
  // إذا رفض العضو الشروط تُلغى الجلسة داخل ensureTerms.
  return state.user ? { ok: true } : { ok: false, message: 'لم يكتمل الدخول دون الموافقة على الشروط.' };
}

/**
 * نافذة دخول العضو. إذا كانت الهوية معروفة (من الجهاز) يُطلب الرقم السري فقط.
 * تعيد Promise<boolean>.
 */
export function showLogin({ reason = '' } = {}) {
  return new Promise(resolve => {
    let success = false;
    const known = state.user && !state.manager ? state.user : null;
    const body = `<form data-login>
      ${reason ? `<p class="muted">${esc(reason)}</p>` : ''}
      ${known ? `<p>الدخول باسم <b>${esc(known.name)}</b></p><input type="hidden" name="member" value="${esc(known.id)}">`
              : `<label>اسمك</label><select name="member" required><option value="">اختر اسمك</option>${options(state.members.filter(m => m.active !== false), m => m.name)}</select>`}
      <label>الرقم السري</label><input name="pin" type="password" inputmode="numeric" autocomplete="current-password" maxlength="12" required>
      <label class="check"><input type="checkbox" name="remember" ${known ? 'checked' : ''}> تذكّر هذا الجهاز (لا يُحفظ الرقم السري)</label>
      <div class="status" data-status></div>
      <div class="actions"><button class="btn primary">دخول</button><button type="button" class="btn secondary" data-close>إلغاء</button></div>
      <div class="actions small"><button type="button" class="link-btn" data-forgot>نسيت الرقم السري؟</button><button type="button" class="link-btn" data-manager>دخول المطور</button></div>
    </form>`;
    openModal({
      title: '🔐 تسجيل الدخول',
      body,
      onMount(card, close) {
        const f = card.querySelector('[data-login]');
        const status = card.querySelector('[data-status]');
        f.onsubmit = async e => {
          e.preventDefault();
          const id = Number(f.member.value), pin = normalizeDigits(f.pin.value);
          if (!id || !pin) { status.textContent = 'اختر اسمك وأدخل الرقم السري.'; status.className = 'status bad'; return; }
          await busy(f.querySelector('.btn.primary'), async () => {
            status.textContent = 'جارٍ التحقق…'; status.className = 'status';
            const r = await memberLogin(id, pin, f.remember.checked);
            if (!r.ok) { status.textContent = r.message; status.className = 'status bad'; return; }
            success = true; close(); toast('أهلًا ' + (state.user?.name || ''));
          });
        };
        card.querySelector('[data-forgot]').onclick = () => { close(); showPinRecovery(); };
        card.querySelector('[data-manager]').onclick = () => { close(); showManagerLogin().then(ok => { success = ok; }); };
      },
      onClose: () => setTimeout(() => resolve(success), 0)
    });
  });
}

/** يضمن وجود الرقم السري في الذاكرة قبل أي عملية تتطلب التحقق. */
export async function requirePin(reason = 'سجّل الدخول للمتابعة.') {
  if (state.manager && state.pin) return true;
  if (state.user && state.pin && state.termsOk) return true;
  return showLogin({ reason: state.user ? 'لأمانك، أدخل رقمك السري لتأكيد العملية.' : reason });
}

export function showManagerLogin() {
  return new Promise(resolve => {
    let success = false;
    openModal({
      title: '🛠️ دخول المطور',
      body: `<form data-mgr><label>الرقم السري للمطور</label><input name="pin" type="password" inputmode="numeric" autocomplete="off" maxlength="20" required>
        <div class="status" data-status></div><div class="actions"><button class="btn primary">دخول</button><button type="button" class="btn secondary" data-close>إلغاء</button></div></form>`,
      onMount(card, close) {
        const f = card.querySelector('[data-mgr]'), status = card.querySelector('[data-status]');
        f.onsubmit = async e => {
          e.preventDefault();
          const pin = normalizeDigits(f.pin.value);
          await busy(f.querySelector('.btn.primary'), async () => {
            const r = await call('manager_pin_login', { p_pin: pin });
            if (!r.ok || r.data?.success !== true) { status.textContent = r.message || 'الرقم السري غير صحيح.'; status.className = 'status bad'; return; }
            setUser({ id: 0, name: 'المطور', role: 'manager' }, pin, { manager: true });
            success = true; close(); toast('تم دخول المطور.');
            location.hash = '#/manager';
          });
        };
      },
      onClose: () => resolve(success)
    });
  });
}

export function logout() {
  const token = storage.get(DEVICE_TOKEN_KEY);
  if (token) call('member_revoke_device_token', { p_token: token }); // إلغاء الرمز من الخادم أيضًا
  storage.del(DEVICE_TOKEN_KEY);
  setUser(null, null);
  toast('تم تسجيل الخروج.');
  location.hash = '#/home';
}

/* ---------- الإقرار بالأنظمة والشروط ---------- */
async function termsAccepted() {
  const r = await call('member_terms_status', { ...creds(), p_version: TERMS_VERSION });
  return r.ok && r.data?.accepted === true;
}

/** شاشة الموافقة المعتمدة: لا يستخدم العضو الخدمات قبل الموافقة على الإصدار الحالي. */
async function ensureTerms() {
  if (await termsAccepted()) { state.termsOk = true; emit(); return; }
  const { termsHtml } = await import('../pages/terms.js');
  const { CONSENT_TEXT } = await import('./terms.js');
  await new Promise(resolve => {
    let accepted = false;
    openModal({
      title: 'مرحبًا بك في جيران حي الغدير',
      body: `<p>للتسجيل والاستفادة من الخدمات التي تتطلب حسابًا، يرجى الموافقة على الأنظمة والشروط.</p>
        <label class="check"><input type="checkbox" data-agree> ${esc(CONSENT_TEXT)}</label>
        <div class="actions"><button class="btn primary" data-ok>موافق</button><button class="btn secondary" data-close>لا أوافق</button></div>
        <p><button type="button" class="link-btn" data-read>للاطلاع على الإقرارات والشروط كاملة، اضغط هنا</button></p>`,
      onMount(card, close) {
        card.querySelector('[data-read]').onclick = () => openModal({ title: 'الأنظمة والشروط', body: termsHtml(), wide: true });
        card.querySelector('[data-ok]').onclick = async () => {
          if (!card.querySelector('[data-agree]').checked) return toast('يرجى تحديد مربع الموافقة.', false);
          const res = await call('accept_program_terms', { p_member_id: state.user.id, p_member_name: state.user.name, p_version: TERMS_VERSION, p_user_agent: navigator.userAgent.slice(0, 500), p_pin: state.pin });
          if (!res.ok) return toast(res.message, false);
          accepted = true; state.termsOk = true; emit(); close(); toast('تم تسجيل موافقتك.');
        };
      },
      onClose: () => { if (!accepted) { storage.del(DEVICE_TOKEN_KEY); setUser(null, null); toast('يمكنك التصفح، أما استخدام الخدمات فيتطلب الموافقة على الأنظمة والشروط.', false); } resolve(); }
    });
  });
}

/* ---------- استعادة الرقم السري ---------- */
export function showPinRecovery() {
  openModal({
    title: '🔑 استعادة الرقم السري',
    body: `<form data-rec><p class="muted">لا يتغير الرقم تلقائيًا. يصل الطلب للمدير، وبعد التحقق يحدد لك رقمًا جديدًا.</p>
      <label>اسم العضو</label><select name="member" required><option value="">اختر اسمك</option>${options(activeMembers(), m => m.name)}</select>
      <label>اكتب اسمك كما هو مسجل</label><input name="name" autocomplete="name" required>
      <label>رقم الجوال (إن كان مسجلًا)</label><input name="phone" inputmode="tel" autocomplete="tel">
      <div class="status" data-status></div>
      <div class="actions"><button class="btn primary">إرسال الطلب</button><button type="button" class="btn secondary" data-close>إغلاق</button></div></form>`,
    onMount(card) {
      const f = card.querySelector('[data-rec]'), st = card.querySelector('[data-status]');
      f.onsubmit = async e => {
        e.preventDefault();
        await busy(f.querySelector('.btn.primary'), async () => {
          const r = await call('request_member_pin_reset', { p_member_id: Number(f.member.value), p_name: f.elements.namedItem('name').value.trim(), p_phone: normalizeDigits(f.phone.value) || null });
          st.textContent = r.ok ? (r.message || 'تم إرسال الطلب للمراجعة.') : r.message;
          st.className = 'status ' + (r.ok ? 'ok' : 'bad');
        });
      };
    }
  });
}

/** تغيير العضو لرقمه السري. */
export function showChangeOwnPin() {
  openModal({
    title: '🔑 تغيير رقمي السري',
    body: `<form data-chg><label>الرقم الحالي</label><input name="cur" type="password" inputmode="numeric" maxlength="12" required>
      <label>الرقم الجديد (4 إلى 12 رقمًا)</label><input name="next" type="password" inputmode="numeric" maxlength="12" required>
      <label>تأكيد الرقم الجديد</label><input name="again" type="password" inputmode="numeric" maxlength="12" required>
      <div class="status" data-status></div><div class="actions"><button class="btn primary">تغيير</button><button type="button" class="btn secondary" data-close>إلغاء</button></div></form>`,
    onMount(card, close) {
      const f = card.querySelector('[data-chg]'), st = card.querySelector('[data-status]');
      f.onsubmit = async e => {
        e.preventDefault();
        const cur = normalizeDigits(f.cur.value), next = normalizeDigits(f.next.value);
        if (!PIN_PATTERN.test(next)) { st.textContent = 'الرقم الجديد يجب أن يكون من 4 إلى 12 رقمًا.'; st.className = 'status bad'; return; }
        if (next !== normalizeDigits(f.again.value)) { st.textContent = 'التأكيد لا يطابق الرقم الجديد.'; st.className = 'status bad'; return; }
        await busy(f.querySelector('.btn.primary'), async () => {
          const r = await call('member_change_own_pin', { p_member_id: state.user.id, p_current_pin: cur, p_new_pin: next });
          if (!r.ok) { st.textContent = r.message; st.className = 'status bad'; return; }
          close(); toast('تم تغيير رقمك السري. سجّل الدخول من جديد.'); logout();
        });
      };
    }
  });
}
