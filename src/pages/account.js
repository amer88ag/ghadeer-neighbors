import { esc, $ } from '../lib/dom.js';
import { state, showLogin, showManagerLogin, showPinRecovery, showChangeOwnPin, logout } from '../lib/session.js';
import { refresh } from '../lib/router.js';

export async function render(el) {
  if (!state.user) {
    el.innerHTML = `<div class="card"><h3>مرحبًا بك</h3><p class="muted">الدخول بالاسم والرقم السري الذي يصلك من إدارة الحي.</p>
      <button class="btn primary block" data-login>🔐 دخول الأعضاء والمشرفين</button>
      <button class="btn secondary block" data-recover>🔑 نسيت الرقم السري</button>
      <button class="btn secondary block" data-manager>🛠️ دخول المطور</button><a class="btn secondary block" href="#/display">🎨 إعداد الشاشة</a></div>`;
    $('[data-login]', el).onclick = async () => { if (await showLogin()) refresh(); };
    $('[data-recover]', el).onclick = showPinRecovery;
    $('[data-manager]', el).onclick = showManagerLogin;
    return;
  }
  const role = state.manager ? 'المطور' : state.supervisor ? 'مشرف' : 'عضو';
  el.innerHTML = `<div class="card"><h3>👤 ${esc(state.user.name)}</h3><p><span class="pill">${role}</span> ${state.pin ? '' : '<span class="muted">— سيُطلب رقمك السري عند أول عملية.</span>'}</p>
    ${state.manager ? '' : `<a class="btn secondary block" href="#/neighbors/me">🪪 بطاقتي التعريفية</a><button class="btn secondary block" data-pin>🔑 تغيير رقمي السري</button>`}
    ${state.manager || state.supervisor ? '<a class="btn secondary block" href="#/manager">🛠️ لوحة الإدارة</a>' : ''}
    <a class="btn secondary block" href="#/display">🎨 إعداد الشاشة</a>
    <button class="btn danger block" data-logout>🚪 تسجيل الخروج</button></div>
    <p class="muted center">لا يُحفظ رقمك السري على الجهاز. «تذكّر هذا الجهاز» يحفظ رمزًا آمنًا يمكن إلغاؤه بتسجيل الخروج.</p>`;
  $('[data-pin]', el)?.addEventListener('click', showChangeOwnPin);
  $('[data-logout]', el).onclick = logout;
}
