import { $ } from '../lib/dom.js';
import { prayerTimes, renderPrayer } from '../lib/widgets.js';
import { LOCATION } from '../config.js';

export async function render(el) {
  el.innerHTML = `<section class="card widget" data-prayer><p class="muted">جارٍ تحميل المواقيت…</p></section>
    <p class="muted center">المواقيت حسب تقويم أم القرى. الإقامة بعد الأذان: الفجر 25 د، المغرب 10 د، وبقية الصلوات 20 د.</p>`;
  const box = $('[data-prayer]', el);
  const load = async coords => {
    try { renderPrayer(box, await prayerTimes(coords), coords ? 'حسب موقعك الحالي' : LOCATION.label); }
    catch { box.innerHTML = '<p class="status bad">تعذر جلب المواقيت الآن. حاول لاحقًا.</p>'; }
    $('[data-locate]', box)?.addEventListener('click', () => navigator.geolocation?.getCurrentPosition(p => load({ lat: p.coords.latitude.toFixed(4), lon: p.coords.longitude.toFixed(4) }), () => {}, { timeout: 12000, maximumAge: 300000 }));
  };
  load();
}
