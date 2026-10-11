import { esc, $ } from '../lib/dom.js';
import { DHIKR, HADITH } from '../lib/widgets.js';

/** الذكر والتذكير: مسبحة بسيطة وأحاديث الجوار بمصادرها. لا يُحفظ شيء على الخادم. */
export async function render(el) {
  let count = 0, i = 0;
  el.innerHTML = `<section class="card center tasbeeh"><p class="muted">اضغط للتسبيح</p><h2 data-text>${esc(DHIKR[0])}</h2>
      <button class="tasbeeh-btn" data-tap aria-label="تسبيحة"><span data-count>0</span></button>
      <div class="actions" style="justify-content:center"><button class="small-btn" data-next>الذكر التالي ‹</button><button class="small-btn ghost" data-reset>تصفير</button></div></section>
    <section class="card"><h3>🌿 أحاديث في حسن الجوار والأخلاق</h3><div class="list">${HADITH.map(h => `<div class="row-item col"><span class="pill">${esc(h.topic)}</span><p class="hadith-text">${esc(h.text)}</p><a target="_blank" rel="noopener" href="${esc(h.url)}">المصدر: ${esc(h.source)} ↗</a></div>`).join('')}</div></section>`;
  const show = () => { $('[data-count]', el).textContent = count; $('[data-text]', el).textContent = DHIKR[i]; };
  $('[data-tap]', el).onclick = () => { count++; navigator.vibrate?.(8); show(); };
  $('[data-next]', el).onclick = () => { i = (i + 1) % DHIKR.length; count = 0; show(); };
  $('[data-reset]', el).onclick = () => { count = 0; show(); };
}
