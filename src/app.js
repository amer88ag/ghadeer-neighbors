/* نقطة الدخول الوحيدة للتطبيق. */
import { register, start, refresh, currentPage, setGuard } from './lib/router.js';
import { state, onChange, loadMembers, restoreDevice, showLogin, canManage } from './lib/session.js';
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

const PAGES = [
  ['home', 'الرئيسية', '🏠', home], ['coffee', 'جدول القهوة', '☕', coffee], ['outings', 'الطلعات', '🚐', outings],
  ['events', 'مناسبات الحي', '🎉', events], ['neighbors', 'الجيران', '👥', neighbors], ['messages', 'الرسائل', '💬', messages],
  ['check', 'تفقد جارك', '❤️', check], ['services', 'خدمات الحي', '🤝', services], ['housing', 'سكن الحي', '🏠', housing],
  ['links', 'روابط مفيدة', '🔗', links], ['account', 'حسابي', '👤', account], ['manager', 'لوحة الإدارة', '🛠️', manager],
  ['news', 'أخبار الحي', '📢', news], ['prayer', 'مواقيت الصلاة', '🕌', prayer], ['weather', 'الطقس', '🌤️', weather],
  ['azkar', 'الذكر', '📿', azkar], ['about', 'عن البرنامج', '©️', about], ['terms', 'الشروط والأحكام', '📜', terms]
];
PAGES.forEach(([id, title, icon, mod]) => register({ id, title, icon, render: mod.render }));

// صفحات لا يمكن إيقافها حتى لا يُحجب الدخول أو الإدارة أو الشروط.
const ALWAYS_ON = new Set(['home', 'account', 'manager', 'terms', 'about']);
setGuard(async (id, params) => {
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
onChange(() => {
  renderChrome();
  const key = state.user ? state.user.id + ':' + state.manager : '';
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
  lastUser = state.user ? state.user.id + ':' + state.manager : '';
  start();
})();
