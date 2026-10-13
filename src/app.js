/* نقطة الدخول الوحيدة للتطبيق. */
import { register, start, refresh, currentPage, setGuard } from './lib/router.js';
import { state, onChange, loadMembers, restoreDevice, showLogin, canManage, requirePin } from './lib/session.js';
import { toast, esc } from './lib/dom.js';
import { invalidate, serviceSettings } from './lib/data.js';
import * as home from './pages/home.js';
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
import { showJoinRequest } from './lib/join.js';

const PAGES = [
  ['home', 'الرئيسية', '🏠', home], ['coffee', 'جدول القهوة', '☕', coffee], ['outings', 'الطلعات', '🚐', outings],
  ['events', 'مناسبات الحي', '🎉', events], ['neighbors', 'الجيران', '👥', neighbors], ['messages', 'الرسائل', '💬', messages],
  ['check', 'تفقد جارك', '❤️', check], ['services', 'خدمات الحي', '🤝', services], ['housing', 'سكن الحي', '🏠', housing],
  ['links', 'روابط مفيدة', '🔗', links], ['account', 'حسابي', '👤', account], ['manager', 'لوحة الإدارة', '🛠️', manager],
  ['news', 'أخبار الحي', '📢', news], ['prayer', 'مواقيت الصلاة', '🕌', prayer], ['weather', 'الطقس', '🌤️', weather],
  ['azkar', 'الذكر', '📿', azkar], ['about', 'عن البرنامج', '©️', about], ['terms', 'الشروط والأحكام', '📜', terms], ['install', 'النشر والتثبيت', '📲', install],
  ['community', 'مجتمع جديد', '🏘️', community], ['stats', 'الإحصاءات', '📊', stats]
];
PAGES.forEach(([id, title, icon, mod]) => register({ id, title, icon, render: mod.render }));

// صفحات متاحة للزائر: الواجهة فقط والتعريف والشروط والدخول. كل ما عداها يتطلب دخول عضو وموافقته على الشروط.
const PUBLIC = new Set(['home', 'account', 'terms', 'about', 'install', 'manager']);
// صفحات لا يمكن إيقافها حتى لا يُحجب الدخول أو الإدارة أو الشروط.
const ALWAYS_ON = new Set(['home', 'account', 'manager', 'terms', 'about', 'install', 'stats']);
export const isPublicRoute = id => PUBLIC.has(String(id).split('/')[0]);

setGuard(async (id, params) => {
  if (!PUBLIC.has(id) && !state.manager && !(state.user && state.termsOk)) {
    const restored = state.user && !state.pin;
    setTimeout(() => {
      document.querySelector('[data-gate-login]')?.addEventListener('click', async () => {
        const ok = restored ? await requirePin() : await showLogin({ reason: 'سجّل دخولك للمتابعة. إذا لم تكن عضوًا، يمكنك إرسال طلب انضمام.' });
        if (ok) refresh();
      });
      document.querySelector('[data-gate-join]')?.addEventListener('click', showJoinRequest);
    });
    return `<section class="card center gate gate-welcome">
      <div class="gate-welcome-icon">🏡</div>
      <p class="entry-kicker">يا مرحبًا بك بين جيرانك</p>
      <h3>${restored ? 'أهلًا بعودتك' : 'جيران حي الغدير.. حيّ يجمعنا'}</h3>
      <p class="gate-welcome-lead">التواصل الطيب يبدأ من الجيرة</p>
      <p class="muted">تعرّف على أخبار الحي، ومواعيد القهوة والطلعات، ومناسبات الجيران، والخدمات والمبادرات التي تعزز التعاون والتراحم بين أهل الحي.</p>
      <p class="muted">${restored ? 'أكّد هويتك للمتابعة إلى هذه الخدمة.' : 'هذه الخدمة متاحة للأعضاء. انضم إلينا لتشارك وتتواصل مع جيرانك.'}</p>
      <div class="gate-welcome-actions">
        <button class="btn primary block" data-gate-login>🔑 ${restored ? 'تأكيد الدخول' : 'دخول الأعضاء'}</button>
        ${restored ? '' : '<button class="btn secondary block" data-gate-join>✨ طلب الانضمام إلى الحي</button>'}
        <a class="btn guest block" href="#/home">👁️ متابعة التصفح كزائر</a>
      </div>
    </section>`;
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
    : '';
  document.querySelector('[data-nav="manager"]').hidden = !canManage();
}

let lastUser = undefined;
onChange(() => {
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

window.addEventListener('unhandledrejection', e => { console.error(e.reason); });

(async function boot() {
  renderChrome();
  try {
    await loadMembers();
    await restoreDevice();
  } catch (e) {
    console.error(e);
    toast(e.message || 'تعذر الاتصال بقاعدة البيانات.', false);
  }
  lastUser = state.user ? state.user.id + ':' + state.manager + ':' + state.termsOk : '';
  start();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
