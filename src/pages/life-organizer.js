import { esc, toast } from '../lib/dom.js';
import { state } from '../lib/session.js';

const KEY = 'ghadeer-life-organizer-v1';
const today = () => new Date().toLocaleDateString('en-CA');
const safeDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') ? value : today();

function load() {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) || '{}');
    const owner = state.user?.id;
    return owner && all[owner] && typeof all[owner] === 'object'
      ? { tasks: Array.isArray(all[owner].tasks) ? all[owner].tasks : [], appointments: Array.isArray(all[owner].appointments) ? all[owner].appointments : [], expenses: Array.isArray(all[owner].expenses) ? all[owner].expenses : [] }
      : { tasks: [], appointments: [], expenses: [] };
  } catch { return { tasks: [], appointments: [], expenses: [] }; }
}
function save(data) {
  const owner = state.user?.id;
  if (!owner) { toast('سجّل الدخول أولًا لحفظ بياناتك.'); return false; }
  try {
    const all = JSON.parse(localStorage.getItem(KEY) || '{}');
    all[owner] = data;
    localStorage.setItem(KEY, JSON.stringify(all));
    return true;
  } catch { toast('تعذر الحفظ على هذا الجهاز.'); return false; }
}
const dateLabel = value => {
  try { return new Date(value + 'T12:00:00').toLocaleDateString('ar-SA', { weekday: 'short', day: 'numeric', month: 'short' }); }
  catch { return value; }
};
const money = n => new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 2 }).format(Number(n) || 0);

export async function render(el) {
  if (!state.user || !state.termsOk) {
    el.innerHTML = '<section class="card center"><h3>منظّم حياتي</h3><p>سجّل الدخول إلى حسابك لاستخدام المنظّم الشخصي.</p><a class="btn primary" href="#/account">الانتقال إلى حسابي</a></section>';
    return;
  }
  let data = load();
  let tab = 'tasks';
  const draw = () => {
    const pending = data.tasks.filter(x => !x.done).length;
    const totalExpenses = data.expenses.reduce((sum, x) => sum + (Number(x.amount) || 0), 0);
    el.innerHTML = `
      <section class="card life-hero">
        <p class="muted">مساحتك الشخصية · لا تُنشر بياناتك في قروب الحي</p>
        <h2>رتّب يومك، خطوة بخطوة</h2>
        <div class="life-stats">
          <div class="life-stat"><b>${pending}</b><small>مهام متبقية</small></div>
          <div class="stat"><b>${data.appointments.length}</b><small>مواعيد مسجلة</small></div>
          <div class="stat"><b>${money(totalExpenses)}</b><small>مصروفات مسجلة (ر.س)</small></div>
        </div>
      </section>
      <nav class="life-tabs" aria-label="أقسام منظّم حياتي">
        <button type="button" data-tab="tasks" class="${tab === 'tasks' ? 'active' : ''}">☑️ مهامي</button>
        <button type="button" data-tab="appointments" class="${tab === 'appointments' ? 'active' : ''}">🗓️ مواعيدي</button>
        <button type="button" data-tab="expenses" class="${tab === 'expenses' ? 'active' : ''}">💳 مصروفاتي</button>
      </nav>
      <section class="card life-panel" data-panel></section>
      <p class="muted center small">نسخة أولية: تحفظ البيانات على هذا الجهاز فقط، ولا تتم مزامنتها بين الأجهزة.</p>`;
    el.querySelectorAll('[data-tab]').forEach(btn => btn.addEventListener('click', () => { tab = btn.dataset.tab; draw(); }));
    const panel = el.querySelector('[data-panel]');
    if (tab === 'tasks') {
      panel.innerHTML = `
        <h3>مهام اليوم وما بعده</h3>
        <form data-add-task class="life-form">
          <label>المهمة<input name="title" maxlength="120" placeholder="مثال: شراء احتياجات المنزل" required></label>
          <label>التاريخ<input name="date" type="date" value="${today()}" required></label>
          <button class="btn primary" type="submit">＋ إضافة مهمة</button>
        </form>
        <div class="life-list">${data.tasks.length ? data.tasks.slice().sort((a,b) => a.date.localeCompare(b.date)).map(item => `
          <article class="life-item ${item.done ? 'done' : ''}">
            <label class="life-check"><input type="checkbox" data-task-done="${esc(item.id)}" ${item.done ? 'checked' : ''}><span><b>${esc(item.title)}</b><small>${dateLabel(item.date)}</small></span></label>
            <button class="icon-btn" type="button" data-task-delete="${esc(item.id)}" aria-label="حذف المهمة">🗑️</button>
          </article>`).join('') : '<p class="muted center">لا توجد مهام بعد. أضف أول مهمة لك.</p>'}</div>`;
      panel.querySelector('[data-add-task]').addEventListener('submit', e => {
        e.preventDefault(); const fd = new FormData(e.currentTarget);
        const title = String(fd.get('title') || '').trim(); if (!title) return;
        data.tasks.push({ id: crypto.randomUUID?.() || String(Date.now()), title, date: safeDate(fd.get('date')), done: false });
        if (save(data)) { toast('أُضيفت المهمة.'); draw(); }
      });
      panel.querySelectorAll('[data-task-done]').forEach(input => input.addEventListener('change', () => {
        const item = data.tasks.find(x => x.id === input.dataset.taskDone); if (item) item.done = input.checked;
        if (save(data)) draw();
      }));
      panel.querySelectorAll('[data-task-delete]').forEach(btn => btn.addEventListener('click', () => {
        data.tasks = data.tasks.filter(x => x.id !== btn.dataset.taskDelete); if (save(data)) draw();
      }));
    } else if (tab === 'appointments') {
      panel.innerHTML = `
        <h3>مواعيدي والتزاماتي</h3>
        <form data-add-appointment class="life-form">
          <label>عنوان الموعد<input name="title" maxlength="120" placeholder="مثال: موعد المستشفى" required></label>
          <div class="life-form-row"><label>التاريخ<input name="date" type="date" value="${today()}" required></label><label>الوقت<input name="time" type="time"></label></div>
          <button class="btn primary" type="submit">＋ إضافة موعد</button>
        </form>
        <div class="life-list">${data.appointments.length ? data.appointments.slice().sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time)).map(item => `
          <article class="life-item"><span class="life-item-icon">🗓️</span><span class="life-item-text"><b>${esc(item.title)}</b><small>${dateLabel(item.date)} ${esc(item.time || '')}</small></span><button class="icon-btn" type="button" data-appointment-delete="${esc(item.id)}" aria-label="حذف الموعد">🗑️</button></article>`).join('') : '<p class="muted center">لم تسجل أي موعد حتى الآن.</p>'}</div>`;
      panel.querySelector('[data-add-appointment]').addEventListener('submit', e => {
        e.preventDefault(); const fd = new FormData(e.currentTarget); const title = String(fd.get('title') || '').trim(); if (!title) return;
        data.appointments.push({ id: crypto.randomUUID?.() || String(Date.now()), title, date: safeDate(fd.get('date')), time: String(fd.get('time') || '') });
        if (save(data)) { toast('أُضيف الموعد.'); draw(); }
      });
      panel.querySelectorAll('[data-appointment-delete]').forEach(btn => btn.addEventListener('click', () => {
        data.appointments = data.appointments.filter(x => x.id !== btn.dataset.appointmentDelete); if (save(data)) draw();
      }));
    } else {
      panel.innerHTML = `
        <h3>متابعة المصروفات</h3>
        <form data-add-expense class="life-form">
          <label>وصف المصروف<input name="title" maxlength="100" placeholder="مثال: مشتريات المنزل" required></label>
          <div class="life-form-row"><label>المبلغ (ريال)<input name="amount" type="number" min="0.01" max="10000000" step="0.01" placeholder="0.00" required></label><label>التاريخ<input name="date" type="date" value="${today()}" required></label></div>
          <button class="btn primary" type="submit">＋ تسجيل مصروف</button>
        </form>
        <div class="life-list">${data.expenses.length ? data.expenses.slice().sort((a,b) => b.date.localeCompare(a.date)).map(item => `
          <article class="life-item"><span class="life-item-icon">💳</span><span class="life-item-text"><b>${esc(item.title)}</b><small>${dateLabel(item.date)}</small></span><strong>${money(item.amount)} ر.س</strong><button class="icon-btn" type="button" data-expense-delete="${esc(item.id)}" aria-label="حذف المصروف">🗑️</button></article>`).join('') : '<p class="muted center">لا توجد مصروفات مسجلة.</p>'}</div>`;
      panel.querySelector('[data-add-expense]').addEventListener('submit', e => {
        e.preventDefault(); const fd = new FormData(e.currentTarget); const title = String(fd.get('title') || '').trim(); const amount = Number(fd.get('amount'));
        if (!title || !Number.isFinite(amount) || amount <= 0) return;
        data.expenses.push({ id: crypto.randomUUID?.() || String(Date.now()), title, amount, date: safeDate(fd.get('date')) });
        if (save(data)) { toast('سُجل المصروف.'); draw(); }
      });
      panel.querySelectorAll('[data-expense-delete]').forEach(btn => btn.addEventListener('click', () => {
        data.expenses = data.expenses.filter(x => x.id !== btn.dataset.expenseDelete); if (save(data)) draw();
      }));
    }
  };
  draw();
}
