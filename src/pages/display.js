import { esc, toast, $ } from '../lib/dom.js';
import { state, creds } from '../lib/session.js';
import { GROUPS } from './home.js';
import { canManage } from '../lib/session.js';
import * as P from '../lib/prefs.js';

/* إعداد الشاشة: حجم العرض، المظهر، حجم الأيقونات، إظهار أقسام الرئيسية، وإخفاء الأيقونات وترتيبها. */
const sync = () => (state.user && state.pin && !state.manager ? creds() : null);

function tilesList() {
  return GROUPS.flatMap(([, items]) => items).filter(t => (t[4] !== 'admin' || canManage()) && (t[4] !== 'dev' || state.manager));
}

export async function render(el) {
  if (sync()) await P.pull(sync()).catch(() => {});
  const p = P.prefs();
  const all = tilesList();
  const byId = new Map(all.map(t => [t[0], t]));
  const ordered = [...P.arrangeTiles(all.map(t => t[0])), ...p.hidden.filter(id => byId.has(id))];
  const pct = Math.round(p.scale * 100);
  el.innerHTML = `
    <section class="card"><h3>🔎 حجم الشاشة</h3>
      <div class="scale-row"><button class="icon-btn" data-scale="-0.05" aria-label="تصغير">A-</button><input type="range" min="80" max="140" step="5" value="${pct}" name="scale" aria-label="حجم العرض"><button class="icon-btn" data-scale="0.05" aria-label="تكبير">A+</button></div>
      <p class="center"><b data-pct>${pct}%</b></p></section>
    <section class="card"><h3>🌗 المظهر</h3><div class="segmented">${[['auto', 'تلقائي'], ['light', 'فاتح'], ['dark', 'داكن']].map(([k, l]) => `<button type="button" data-theme-btn="${k}" class="${p.theme === k ? 'active' : ''}">${l}</button>`).join('')}</div></section>
    <section class="card"><h3>🔲 حجم الأيقونات</h3><div class="segmented">${[['sm', 'صغيرة'], ['md', 'متوسطة'], ['lg', 'كبيرة']].map(([k, l]) => `<button type="button" data-tiles-btn="${k}" class="${p.tiles === k ? 'active' : ''}">${l}</button>`).join('')}</div>
      <label class="check"><input type="checkbox" name="motion" ${p.motion ? 'checked' : ''}> تحريك الشريطين المتحركين</label></section>
    <section class="card"><h3>🧩 أقسام الرئيسية</h3>${P.WIDGETS.map(([k, l]) => `<label class="check"><input type="checkbox" data-widget="${k}" ${p.widgets[k] !== false ? 'checked' : ''}> ${l}</label>`).join('')}</section>
    <section class="card"><h3>↕️ ترتيب الأيقونات وإخفاؤها</h3><p class="muted">استخدم الأسهم لتحريك الأيقونة، و👁️ لإخفائها أو إظهارها.</p>
      <div class="list" data-tiles-list>${ordered.map(id => { const [, i, t] = byId.get(id); const off = p.hidden.includes(id); return `<div class="row-item tile-row${off ? ' inactive' : ''}" data-id="${id}"><div class="row-main"><b>${i} ${esc(t)}</b>${off ? '<small>مخفية</small>' : ''}</div>
        <div class="row-side"><button class="icon-btn" data-up aria-label="أعلى">▲</button><button class="icon-btn" data-down aria-label="أسفل">▼</button>${id === 'display' ? '' : `<button class="icon-btn" data-eye aria-label="${off ? 'إظهار' : 'إخفاء'}">${off ? '🙈' : '👁️'}</button>`}</div></div>`; }).join('')}</div></section>
    <div class="actions center"><button class="btn secondary" data-reset>↺ استعادة الإعدادات الافتراضية</button><a class="btn primary" href="#/home">✓ تم</a></div>
    <p class="muted center">${sync() ? 'تُحفظ إعداداتك في حسابك وتظهر على أجهزتك الأخرى.' : 'تُحفظ الإعدادات على هذا الجهاز.' + (state.user ? ' أدخل رقمك السري لمزامنتها مع حسابك.' : '')}</p>`;

  const go = async patch => { await P.save(patch, sync()); render(el); };
  const range = $('[name=scale]', el);
  range.oninput = () => { $('[data-pct]', el).textContent = range.value + '%'; P.save({ scale: range.value / 100 }); };
  range.onchange = () => go({ scale: range.value / 100 });
  el.querySelectorAll('[data-scale]').forEach(b => b.onclick = () => go({ scale: Math.round((P.prefs().scale + Number(b.dataset.scale)) * 100) / 100 }));
  el.querySelectorAll('[data-theme-btn]').forEach(b => b.onclick = () => go({ theme: b.dataset.themeBtn }));
  el.querySelectorAll('[data-tiles-btn]').forEach(b => b.onclick = () => go({ tiles: b.dataset.tilesBtn }));
  $('[name=motion]', el).onchange = e => go({ motion: e.target.checked });
  el.querySelectorAll('[data-widget]').forEach(c => c.onchange = () => go({ widgets: { ...P.prefs().widgets, [c.dataset.widget]: c.checked } }));
  const rows = () => [...el.querySelectorAll('[data-tiles-list] [data-id]')].map(r => r.dataset.id);
  el.querySelectorAll('.tile-row').forEach(row => {
    const id = row.dataset.id;
    $('[data-up]', row).onclick = () => { const o = rows(), i = o.indexOf(id); if (i > 0) { [o[i - 1], o[i]] = [o[i], o[i - 1]]; go({ order: o }); } };
    $('[data-down]', row).onclick = () => { const o = rows(), i = o.indexOf(id); if (i < o.length - 1) { [o[i + 1], o[i]] = [o[i], o[i + 1]]; go({ order: o }); } };
    const eye = $('[data-eye]', row); if (eye) eye.onclick = () => { const h = P.prefs().hidden; go({ hidden: h.includes(id) ? h.filter(x => x !== id) : [...h, id], order: rows() }); };
  });
  $('[data-reset]', el).onclick = async () => { await P.reset(sync()); toast('تمت استعادة الإعدادات الافتراضية.'); render(el); };
}
