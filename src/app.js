/* نقطة الدخول الوحيدة للتطبيق. */
import { register, start, refresh, currentPage, setGuard } from './lib/router.js';
import { state, onChange, loadMembers, restoreDevice, showLogin, canManage, requirePin } from './lib/session.js';
import { toast, esc } from './lib/dom.js';
import { invalidate, serviceSettings, appStatus } from './lib/data.js';
import * as home from './pages/home.js';
import { showJoinRequest, showGuestWelcome } from './lib/join.js';
import * as coffee from './pages/coffee.js';
import * as outings from './pages/outings.js';
import * as events from './pages/events.js';
import * as neighbors from './pages/neighbors.js';
import * as messages from './pages/messages.js';
import * as check from './pages/check.js';
import * as services from './pages/services.js';
import * as housing from './pages/housing.js';
import * as links from './pages/links.js';
import * as account from './pages/account.js';
import * as manager from './pages/manager.js';
import * as news from './pages/news.js';
import * as prayer from './pages/prayer.js';
import * as weather from './pages/weather.js';
import * as azkar from './pages/azkar.js';
import * as about from './pages/about.js';
import * as terms from './pages/terms.js';
import * as install from './pages/install.js';
import * as community from './pages/community.js';
import * as stats from './pages/stats.js';
import * as invite from './pages/invite.js';
import * as whatsapp from './pages/whatsapp.js';
import * as display from './pages/display.js';
import * as P from './lib/prefs.js';

const PAGES = [
  ['home', 'الرئيسية', '🏠', home], ['coffee', 'جدول القهوة', '☕', coffee], ['outings', 'الطلعات', '🚐', outings],
  ['events', 'مناسبات الحي', '🎉', events], ['neighbors', 'الجيران', '👥', neighbors], ['messages', 'الرسائل', '💬', messages],
  ['check', 'تفقد جارك', '❤️', check], ['services', 'خدمات الحي', '🤝', services], ['housing', 'سكن الحي', '🏠', housing],
  ['links', 'روابط مفيدة', '🔗', links], ['account', 'حسابي', '👤', account], ['manager', 'لوحة الإدارة', '🛠️', manager],
  ['news', 'أخبار الحي', '📢', news], ['prayer', 'مواقيت الصلاة', '🕌', prayer], ['weather', 'الطقس', '🌤️', weather],
  ['azkar', 'الذكر', '📿', azkar], ['about', 'عن البرنامج', '©️', about], ['terms', 'الشروط والأحكام', '📜', terms], ['install', 'النشر والتثبيت', '📲', install],
  ['community', 'مجتمع جديد', '🏘️', community], ['stats', 'الإحصاءات', '📊', stats], ['invite', 'دعوة الجيران', '💌', invite], ['whatsapp', 'واتساب الجيران', '📱', whatsapp], ['display', 'إعداد الشاشة', '🎨', display]
];
PAGES.forEach(([id, title, icon, mod]) => register({ id, title, icon, render: mod.render }));

// صفحات متاحة للزائر: الواجهة فقط والتعريف والشروط والدخول. كل ما عداها يتطلب دخول عضو وموافقته على الشروط.
const PUBLIC = new Set(['home', 'account', 'terms', 'about', 'install', 'manager', 'invite', 'display']);
// صفحات لا يمكن إيقافها حتى لا يُحجب الدخول أو الإدارة أو الشروط.
const ALWAYS_ON = new Set(['home', 'account', 'manager', 'terms', 'about', 'install', 'stats', 'invite', 'display']);
export const isPublicRoute = id => PUBLIC.has(String(id).split('/')[0]);

setGuard(async (id, params) => {
  if (!state.manager && !['account', 'manager', 'about', 'terms', 'display'].includes(id)) {
    const st = await appStatus().catch(() => ({}));
    if (st.paused) return `<div class="card center"><p class="tile-icon">⏸️</p><h3>البرنامج في صيانة مؤقتة</h3><p>${esc(st.pause_message || 'سيعود البرنامج للعمل قريبًا بإذن الله.')}</p></div>`;
  }
  if (!PUBLIC.has(id) && !state.manager && !(state.user && state.termsOk)) {
    const restored = state.user && !state.pin;
    setTimeout(() => {
      document.querySelector('[data-gate]')?.addEventListener('click', async () => {
        const ok = restored ? await requirePin() : await showLogin({ reason: 'أهلًا بك في جيران حي الغدير. سجّل دخولك للاستفادة من خدمات الأعضاء.' });
        if (ok) refresh();
      });
      document.querySelector('[data-gate-join]')?.addEventListener('click', () => showJoinRequest());
      document.querySelector('[data-gate-browse]')?.addEventListener('click', () => { location.hash = '#/home'; });
    });
    return `<div class="card center gate guest-gate"><p class="tile-icon">🏡</p><h3>${restored ? 'مرحبًا بعودتك إلى جيرانك' : 'أهلًا بك في جيران حي الغدير'}</h3>
      <p class="muted">${restored ? 'أكّد دخولك للعودة إلى خدمات الحي.' : 'مجتمع يجمع الجيران على التواصل الطيب، والمناسبات، والتعاون، ومساندة بعضنا بعضًا. تصفّح الواجهة بحرية، وانضم إلينا متى رغبت.'}</p>
      <div class="hero-actions"><button class="btn primary" data-gate-join>🌟 طلب الانضمام</button><button class="btn secondary" data-gate>${restored ? '🔐 تأكيد الدخول' : '🔐 دخول الأعضاء'}</button><button class="btn ghost" data-gate-browse>متابعة التصفح</button></div></div>`;
  }
  if (ALWAYS_ON.has(id) || state.manager) return null;
  const svc = await serviceSettings();
  const s = svc[id + (params[0] ? '/' + params[0] : '')] || svc[id];
  if (!s || s.enabled !== false) return null;
  return `<div class="card center"><p class="tile-icon">⏸️</p><h3>هذه الخدمة موقوفة مؤقتًا</h3>${s.note ? `<p>${esc(s.note)}</p>` : ''}<a class="btn secondary" href="#/home">العودة للرئيسية</a></div>`;
});

function renderChrome() {
  const who = document.getElementById('who');
  who.innerHTML = state.user
    ? `<a href="#/account" class="chip">${state.manager ? '🛠️' : state.supervisor ? '🛡️' : '👤'} ${esc(state.user.name)}</a>`
    : `<button class="chip light" data-login>🔐 دخول</button>`;
  who.querySelector('[data-login]')?.addEventListener('click', () => showLogin());
  document.querySelector('[data-nav="manager"]').hidden = !canManage();
}

let lastUser = undefined;
let prefsOwner, prefsPulled;
onChange(() => {
  const owner = state.user && !state.manager ? state.user.id : null;
  if (owner !== prefsOwner) { prefsOwner = owner; prefsPulled = false; P.useOwner(owner); }
  if (owner && state.pin && !prefsPulled) { prefsPulled = true; P.pull({ p_member_id: owner, p_pin: state.pin }).then(changed => { if (changed && currentPage()) refresh(); }).catch(() => {}); }
  renderChrome();
  const key = state.user ? state.user.id + ':' + state.manager + ':' + state.termsOk : '';
  if (lastUser !== undefined && key !== lastUser) { invalidate(); if (currentPage()) refresh(); }
  lastUser = key;
});

document.getElementById('refreshBtn').addEventListener('click', async e => {
  const btn = e.currentTarget;
  btn.classList.add('spin');
  invalidate();
  await loadMembers();
  await refresh();
  btn.classList.remove('spin');
  toast('تم التحديث.');
});

// منع تكبير الواجهة بالإصبعين (Safari في iPhone يتجاهل user-scalable=no).
['gesturestart', 'gesturechange'].forEach(t => document.addEventListener(t, e => e.preventDefault(), { passive: false }));
document.addEventListener('touchmove', e => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });

window.addEventListener('unhandledrejection', e => { console.error(e.reason); });

(async function boot() {
  P.useOwner(null);
  renderChrome();
  try {
    await loadMembers();
    await restoreDevice();
  } catch (e) {
    console.error(e);
    toast(e.message || 'تعذر الاتصال بقاعدة البيانات.', false);
  }
  prefsOwner = state.user && !state.manager ? state.user.id : null; P.useOwner(prefsOwner);
  lastUser = state.user ? state.user.id + ':' + state.manager + ':' + state.termsOk : '';
  start();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
