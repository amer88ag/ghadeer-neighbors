/* نقطة الدخول الوحيدة للتطبيق. */
import { register, start, refresh, currentPage } from './lib/router.js';
import { state, onChange, loadMembers, restoreDevice, showLogin, canManage } from './lib/session.js';
import { toast, esc } from './lib/dom.js';
import { invalidate } from './lib/data.js';
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

const PAGES = [
  ['home', 'الرئيسية', '🏠', home], ['coffee', 'جدول القهوة', '☕', coffee], ['outings', 'الطلعات', '🚐', outings],
  ['events', 'مناسبات الحي', '🎉', events], ['neighbors', 'الجيران', '👥', neighbors], ['messages', 'الرسائل', '💬', messages],
  ['check', 'تفقد جارك', '❤️', check], ['services', 'خدمات الحي', '🤝', services], ['housing', 'سكن الحي', '🏠', housing],
  ['links', 'روابط مفيدة', '🔗', links], ['account', 'حسابي', '👤', account], ['manager', 'لوحة الإدارة', '🛠️', manager]
];
PAGES.forEach(([id, title, icon, mod]) => register({ id, title, icon, render: mod.render }));

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
