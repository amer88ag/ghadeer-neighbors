/* الحالة والجلسة: من المستخدم الحالي، ودخول الأعضاء والمدير، وحفظ الجهاز. */
import { call, publicMembers } from './api.js';
import { openModal, esc, toast, normalizeDigits, options, busy } from './dom.js';
import { DEVICE_TOKEN_KEY, PIN_PATTERN, TERMS_VERSION } from '../config.js';

export const state = {
  members: [],        // {id,name,active}
  user: null,         // {id,name,role}
  pin: null,          // في الذاكرة فقط — لا يُحفظ في المتصفح إطلاقًا
  manager: false,
  supervisor: false
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

export async function loadMembers() {
  state.members = await publicMembers();
  emit();
  return state.members;
}

function setUser(user, pin, { manager = false, supervisor = false } = {}) {
  state.user = user;
  state.pin = pin;
  state.manager = manager;
  state.supervisor = supervisor || manager;
  emit();
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
  const r = await call('issue_member_device_token', { ...creds(), p_device_label: (navigator.userAgent || 'device').slice(0, 110) });
  if (r.ok && r.data?.token) storage.set(DEVICE_TOKEN_KEY, r.data.token);
}

async function memberLogin(id, pin, remember) {
  const r = await call('member_login', { p_member_id: id, p_pin: pin });
  if (!r.ok || r.data?.success !== true) return { ok: false, message: r.message || 'الرقم السري غير صحيح.' };
  const role = r.data.role || 'member';
  setUser({ id, name: r.data.name || memberName(id), role }, pin, { supervisor: ['supervisor', 'super_admin'].includes(role) });
  if (remember) await rememberDevice();
  await ensureTerms();
  return { ok: true };
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
      <div class="actions small"><button type="button" class="link-btn" data-forgot>نسيت الرقم السري؟</button><button type="button" class="link-btn" data-manager>دخول المدير</button></div>
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
  if (state.user && state.pin) return true;
  return showLogin({ reason: state.user ? 'لأمانك، أدخل رقمك السري لتأكيد العملية.' : reason });
}

export function showManagerLogin() {
  return new Promise(resolve => {
    let success = false;
    openModal({
      title: '🛠️ دخول المدير',
      body: `<form data-mgr><label>الرقم السري للمدير</label><input name="pin" type="password" inputmode="numeric" autocomplete="off" maxlength="20" required>
        <div class="status" data-status></div><div class="actions"><button class="btn primary">دخول</button><button type="button" class="btn secondary" data-close>إلغاء</button></div></form>`,
      onMount(card, close) {
        const f = card.querySelector('[data-mgr]'), status = card.querySelector('[data-status]');
        f.onsubmit = async e => {
          e.preventDefault();
          const pin = normalizeDigits(f.pin.value);
          await busy(f.querySelector('.btn.primary'), async () => {
            const r = await call('manager_pin_login', { p_pin: pin });
            if (!r.ok || r.data?.success !== true) { status.textContent = r.message || 'الرقم السري غير صحيح.'; status.className = 'status bad'; return; }
            setUser({ id: 0, name: 'المدير', role: 'manager' }, pin, { manager: true });
            success = true; close(); toast('تم دخول المدير.');
            location.hash = '#/manager';
          });
        };
      },
      onClose: () => resolve(success)
    });
  });
}

export function logout() {
  storage.del(DEVICE_TOKEN_KEY);
  setUser(null, null);
  toast('تم تسجيل الخروج.');
  location.hash = '#/home';
}

/* ---------- الإقرار بالشروط ---------- */
const TERMS = 'أقرّ باستخدام البرنامج ضمن الأنظمة والقوانين والآداب العامة والقيم والأحكام الشرعية، وأتحمل المسؤولية عن أي محتوى أو رسالة أو تصرف يصدر مني. وللمدير والمشرفين المفوضين، في حدود الصلاحيات، اتخاذ الإجراءات التنظيمية المناسبة، بما في ذلك حذف أو إخفاء المحتوى أو إيقاف أو تقييد العضوية أو حذف العضو، مع الاحتفاظ بحق اتخاذ الإجراءات النظامية المناسبة أو إحالة الأمر للجهات المختصة عند الاقتضاء.';

async function ensureTerms() {
  const r = await call('get_program_acceptance', creds());
  if (r.ok && r.data?.exists === true) return;
  await new Promise(resolve => {
    let accepted = false;
    openModal({
      title: 'إقرار استخدام البرنامج',
      body: `<p>${TERMS}</p><label class="check"><input type="checkbox" data-agree> أقر أنني قرأت الشروط وأوافق عليها.</label>
        <div class="actions"><button class="btn primary" data-ok>أوافق</button><button class="btn secondary" data-close>لا أوافق</button></div>`,
      onMount(card, close) {
        card.querySelector('[data-ok]').onclick = async () => {
          if (!card.querySelector('[data-agree]').checked) return toast('يرجى تأكيد قراءة الشروط.', false);
          const res = await call('accept_program_terms', { p_member_id: state.user.id, p_member_name: state.user.name, p_version: TERMS_VERSION, p_user_agent: navigator.userAgent.slice(0, 500), p_pin: state.pin });
          if (!res.ok) return toast(res.message, false);
          accepted = true; close(); toast('تم تسجيل الموافقة.');
        };
      },
      onClose: () => { if (!accepted) { storage.del(DEVICE_TOKEN_KEY); setUser(null, null); toast('لا يمكن استخدام خدمات الأعضاء دون الموافقة على الشروط.', false); } resolve(); }
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
