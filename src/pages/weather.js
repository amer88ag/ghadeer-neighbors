import { esc } from '../lib/dom.js';
import { weatherForecast, weatherLabel } from '../lib/widgets.js';
import { LOCATION } from '../config.js';

export async function render(el) {
  try {
    const j = await weatherForecast();
    const c = j.current, d = j.daily;
    const [icon, text] = weatherLabel(c.weather_code);
    const day = s => new Date(s + 'T12:00:00').toLocaleDateString('ar-SA', { weekday: 'long' });
    el.innerHTML = `<section class="card"><div class="widget-head"><b>${icon} الآن</b><span class="muted">${esc(LOCATION.label)}</span></div>
      <div class="weather"><span class="temp">${Math.round(c.temperature_2m)}°</span><div><b>${text}</b><div class="muted">المحسوسة ${Math.round(c.apparent_temperature)}° · الرطوبة ${c.relative_humidity_2m}% · الرياح ${Math.round(c.wind_speed_10m)} كم/س</div></div></div></section>
      <section class="card"><h3>📅 الأيام القادمة</h3><div class="list">${d.time.map((t, i) => { const [ic, tx] = weatherLabel(d.weather_code[i]); return `<div class="row-item"><div class="row-main"><b>${i ? day(t) : 'اليوم'}</b><small>${ic} ${tx}${d.precipitation_probability_max?.[i] ? ' · مطر ' + d.precipitation_probability_max[i] + '%' : ''}</small></div><div class="row-side"><b>${Math.round(d.temperature_2m_max[i])}°</b><span class="muted">${Math.round(d.temperature_2m_min[i])}°</span></div></div>`; }).join('')}</div></section>`;
  } catch {
    el.innerHTML = '<div class="card"><p class="status bad">تعذر جلب الطقس الآن. حاول لاحقًا.</p></div>';
  }
}
