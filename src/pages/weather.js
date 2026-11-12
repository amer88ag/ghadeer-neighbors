import { esc } from '../lib/dom.js';
import { weatherForecast, weatherLabel, tempTone } from '../lib/widgets.js';
import { LOCATION } from '../config.js';
import { getPreferredLocation, requestUserLocation, clearUserLocation } from '../lib/location.js';
import { toast } from '../lib/dom.js';

export async function render(el) {
  const load = async coords => {
    el.innerHTML = '<section class="card"><p class="muted">جارٍ تحديث بيانات الطقس…</p></section>';
    try {
      const location = coords || getPreferredLocation();
      const j = await weatherForecast(location);
      const c = j.current, d = j.daily;
      const [icon, text] = weatherLabel(c.weather_code);
      const day = s => new Date(s + 'T12:00:00').toLocaleDateString('ar-SA', { weekday: 'long' });
      const label = location.label || (coords ? 'موقعي الحالي' : LOCATION.label);
      const updated = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Riyadh' });
      el.innerHTML = `<section class="card"><div class="widget-head"><b>${icon} الآن</b><span class="muted">${esc(label)}</span></div>
        <div class="weather"><span class="temp ${tempTone(Math.round(c.temperature_2m))}">${Math.round(c.temperature_2m)}°</span><div><b>${text}</b><div class="muted">المحسوسة ${Math.round(c.apparent_temperature)}° · الرطوبة ${c.relative_humidity_2m}% · الرياح ${Math.round(c.wind_speed_10m)} كم/س</div></div></div>
        <div class="actions small"><button class="btn secondary" type="button" data-locate>📍 تحديث حسب موقعي الحالي</button><span class="muted">آخر تحديث ${updated}</span></div></section>
        <section class="card"><h3>📅 الأيام القادمة</h3><div class="list">${d.time.map((t, i) => { const [ic, tx] = weatherLabel(d.weather_code[i]); return `<div class="row-item"><div class="row-main"><b>${i ? day(t) : 'اليوم'}</b><small>${ic} ${tx}${d.precipitation_probability_max?.[i] != null ? ' · احتمال المطر ' + d.precipitation_probability_max[i] + '%' : ''}</small></div><div class="row-side"><b>${Math.round(d.temperature_2m_max[i])}°</b><span class="muted">${Math.round(d.temperature_2m_min[i])}°</span></div></div>`; }).join('')}</div></section>`;
      el.querySelector('[data-locate]')?.addEventListener('click', async e => {
        const button = e.currentTarget; button.disabled = true;
        try { const current = await requestUserLocation(); await load(current); toast('تم تحديث الطقس حسب موقعك.'); }
        catch (error) { toast(error.message, false); button.disabled = false; }
      });
    } catch {
      el.innerHTML = '<div class="card"><p class="status bad">تعذر جلب الطقس الآن. تحقق من اتصال الإنترنت وحاول لاحقًا.</p><button class="btn secondary" data-retry>إعادة المحاولة</button></div>';
      el.querySelector('[data-retry]')?.addEventListener('click', () => load(coords));
    }
  };
  await load();
  window.removeEventListener('ghadeer:location-updated', window._ghadeerWeatherLocationHandler);
  window._ghadeerWeatherLocationHandler = () => load();
  window.addEventListener('ghadeer:location-updated', window._ghadeerWeatherLocationHandler);
}
