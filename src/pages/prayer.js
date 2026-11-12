import { prayerTimes, renderPrayer } from '../lib/widgets.js';
import { LOCATION } from '../config.js';
import { requestUserLocation, clearUserLocation } from '../lib/location.js';
import { toast } from '../lib/dom.js';

export async function render(el) {
  el.innerHTML = `<section class="card widget" data-prayer><p class="muted">جارٍ تحميل المواقيت…</p></section>
    <p class="muted center">المواقيت حسب تقويم أم القرى. الإقامة بعد الأذان: الفجر 25 د، المغرب 10 د، والظهر والعصر والعشاء 20 د.</p>`;
  const box = el.querySelector('[data-prayer]');
  const load = async coords => {
    try {
      const result = await prayerTimes(coords);
      renderPrayer(box, result, result.locationLabel || LOCATION.label);
    } catch {
      box.innerHTML = '<p class="status bad">تعذر جلب المواقيت الآن. تحقق من اتصال الإنترنت وحاول لاحقًا.</p><button class="btn secondary" data-retry>إعادة المحاولة</button>';
      box.querySelector('[data-retry]')?.addEventListener('click', () => load());
    }
  };
  box.addEventListener('click', async e => {
    if (e.target.closest('[data-locate]')) {
      const button = e.target.closest('[data-locate]');
      button.disabled = true;
      try { const coords = await requestUserLocation(); await load(coords); toast('تم تحديث المواقيت حسب موقعك.'); }
      catch (error) { toast(error.message, false); }
      finally { button.disabled = false; }
    }
  });
  load();
  window.removeEventListener('ghadeer:location-updated', window._ghadeerPrayerLocationHandler);
  window._ghadeerPrayerLocationHandler = () => { if (el.isConnected) load(); };
  window.addEventListener('ghadeer:location-updated', window._ghadeerPrayerLocationHandler);
}
