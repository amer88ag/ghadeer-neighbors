/* أدوات الرئيسية: مواقيت الصلاة، الطقس، الذكر، لوحة الأحاديث. */
import { LOCATION, TIMEZONE, IQAMA } from '../config.js';
import { esc } from './dom.js';

const PRAYERS = [['Fajr', 'الفجر'], ['Sunrise', 'الشروق'], ['Dhuhr', 'الظهر'], ['Asr', 'العصر'], ['Maghrib', 'المغرب'], ['Isha', 'العشاء']];

function dateKey() {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: TIMEZONE, day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date());
  return p.replace(/\//g, '-');
}
function nowMinutes() {
  const [h, m] = new Intl.DateTimeFormat('en-GB', { timeZone: TIMEZONE, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()).split(':').map(Number);
  return h * 60 + m;
}
const toMin = t => { const [h, m] = String(t).slice(0, 5).split(':').map(Number); return h * 60 + m; };
const fromMin = m => { m = (m + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
export const iqamaTime = (key, t) => IQAMA[key] != null ? fromMin(toMin(t) + IQAMA[key]) : '';

async function fetchJSON(url) {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}

/** وقت بنظام 12 ساعة: 5:15 ص */
export const fmt12 = t => { const m = toMin(t); const h = Math.floor(m / 60) % 24; return `${h % 12 || 12}:${String(m % 60).padStart(2, '0')} ${h < 12 ? 'ص' : 'م'}`; };
const dur = m => (Math.floor(m / 60) ? Math.floor(m / 60) + ' س ' : '') + (m % 60) + ' د';

/** المواقيت حسب تقويم أم القرى لإحداثيات الحي (أو موقع المستخدم). */
export async function prayerTimes(coords) {
  const c = coords || LOCATION;
  const j = await fetchJSON(`https://api.aladhan.com/v1/timings/${dateKey()}?latitude=${c.lat}&longitude=${c.lon}&method=4&timezonestring=${encodeURIComponent(TIMEZONE)}`);
  const t = j?.data?.timings;
  if (!t) throw new Error('no timings');
  return { timings: t, hijri: j.data?.date?.hijri };
}

/** حالة الصلاة الآن: بين الأذان والإقامة، أو الصلاة القادمة. */
function prayerState(timings) {
  const now = nowMinutes();
  const five = PRAYERS.filter(([k]) => k !== 'Sunrise');
  for (const [k, n] of five) {
    const ad = toMin(timings[k]), iq = ad + (IQAMA[k] || 0);
    if (now >= ad && now < iq) return { key: k, text: `إقامة ${n} بعد <b>${dur(iq - now)}</b>` };
  }
  const next = five.find(([k]) => toMin(timings[k]) > now) || five[0];
  return { key: next[0], text: `${next[1]} بعد <b>${dur((toMin(timings[next[0]]) - now + 1440) % 1440)}</b>` };
}

export function renderPrayer(el, { timings, hijri }, label, { compact = false } = {}) {
  const st = prayerState(timings);
  const list = compact ? PRAYERS.filter(([k]) => k !== 'Sunrise') : PRAYERS;
  el.innerHTML = `<div class="prayer-head"><b>🕌 ${st.text}</b><span class="muted">${compact ? 'الشروق ' + fmt12(timings.Sunrise) : esc(label)}</span></div>
    <div class="prayer-grid${compact ? ' compact' : ''}">${list.map(([k, n]) => `<div class="${k === st.key ? 'now' : ''}"><small>${n}</small><b>${fmt12(timings[k])}</b>${IQAMA[k] != null ? `<small class="iq">${compact ? 'إقامة ' + fmt12(iqamaTime(k, timings[k])).slice(0, -2) : 'الإقامة ' + fmt12(iqamaTime(k, timings[k]))}</small>` : ''}</div>`).join('')}</div>
    ${!compact && hijri ? `<div class="muted center">${esc(hijri.day)} ${esc(hijri.month?.ar || '')} ${esc(hijri.year)} هـ</div>` : ''}
    ${compact ? '' : '<div class="actions small"><button class="link-btn" data-locate>📍 حسب موقعي الحالي</button></div>'}`;
  // تحديث العدّاد كل دقيقة ما دام العنصر ظاهرًا.
  clearTimeout(el._pt);
  el._pt = setTimeout(() => { if (el.isConnected) renderPrayer(el, { timings, hijri }, label, { compact }); }, 60000 - Date.now() % 60000 + 50);
}

const WEATHER_CODES = { 0: ['☀️', 'صحو'], 1: ['🌤️', 'غائم جزئيًا'], 2: ['⛅', 'غائم جزئيًا'], 3: ['☁️', 'غائم'], 45: ['🌫️', 'ضباب'], 48: ['🌫️', 'ضباب'], 51: ['🌦️', 'رذاذ'], 53: ['🌦️', 'رذاذ'], 55: ['🌦️', 'رذاذ'], 61: ['🌧️', 'مطر خفيف'], 63: ['🌧️', 'مطر'], 65: ['🌧️', 'مطر غزير'], 80: ['🌦️', 'زخات'], 81: ['🌧️', 'زخات'], 82: ['⛈️', 'زخات قوية'], 95: ['⛈️', 'عواصف رعدية'], 96: ['⛈️', 'عواصف وبرد'], 99: ['⛈️', 'عواصف وبرد'] };

export async function weatherForecast() {
  return fetchJSON(`https://api.open-meteo.com/v1/forecast?latitude=${LOCATION.lat}&longitude=${LOCATION.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=6&timezone=${encodeURIComponent(TIMEZONE)}`);
}
export const weatherLabel = code => WEATHER_CODES[code] || ['🌡️', 'الطقس'];

/** درجة الحرارة فقط، ولونها حسب الحرارة. */
export const tempTone = t => t <= 5 ? 'temp-freezing' : t <= 15 ? 'temp-cold' : t <= 25 ? 'temp-mild' : t <= 34 ? 'temp-warm' : 'temp-hot';
export async function renderWeather(el) {
  try {
    const j = await fetchJSON(`https://api.open-meteo.com/v1/forecast?latitude=${LOCATION.lat}&longitude=${LOCATION.lon}&current=temperature_2m,weather_code&timezone=${encodeURIComponent(TIMEZONE)}`);
    const temp = Math.round(j.current.temperature_2m);
    el.className = el.className.replace(/\btemp-\w+/g, '').trim() + ' ' + tempTone(temp);
    el.innerHTML = `<span data-weather-temp>${temp}°</span>`;
    el.setAttribute('aria-label', `درجة الحرارة الآن ${temp}، اضغط لعرض تفاصيل الطقس`);
  } catch {
    el.innerHTML = '<span data-weather-temp>—°</span>';
  }
}

export const DHIKR = ['سبحان الله وبحمده', 'سبحان الله العظيم', 'لا إله إلا الله وحده لا شريك له', 'اللهم صل وسلم على نبينا محمد', 'أستغفر الله وأتوب إليه', 'لا حول ولا قوة إلا بالله'];

export const HADITH = [
  { topic: 'حسن الجوار', text: 'ما زال جبريل يوصيني بالجار حتى ظننت أنه سيورثه.', source: 'صحيح البخاري 6014', url: 'https://sunnah.com/bukhari:6014' },
  { topic: 'حسن الجوار', text: 'من كان يؤمن بالله واليوم الآخر فلا يؤذ جاره.', source: 'صحيح البخاري 6018', url: 'https://sunnah.com/bukhari:6018' },
  { topic: 'حسن المعاملة', text: 'من كان يؤمن بالله واليوم الآخر فليقل خيرًا أو ليصمت.', source: 'صحيح مسلم 47a', url: 'https://sunnah.com/muslim/1/79' },
  { topic: 'الأخوة', text: 'لا يؤمن أحدكم حتى يحب لأخيه ما يحب لنفسه.', source: 'صحيح البخاري 13', url: 'https://sunnah.com/bukhari/2/6' },
  { topic: 'سلامة الناس', text: 'المسلم من سلم المسلمون من لسانه ويده.', source: 'صحيح مسلم 41', url: 'https://sunnah.com/muslim/1/69' },
  { topic: 'تفريج الكرب', text: 'والله في عون العبد ما كان العبد في عون أخيه.', source: 'صحيح مسلم 2699a', url: 'https://sunnah.com/muslim:2699a' },
  { topic: 'الأخلاق', text: 'لا تحاسدوا ولا تباغضوا ولا تدابروا، وكونوا عباد الله إخوانًا.', source: 'صحيح مسلم 2564a', url: 'https://sunnah.com/muslim/45/40' },
  { topic: 'الرحمة والتعاون', text: 'من نفس عن مؤمن كربة من كرب الدنيا نفس الله عنه كربة من كرب يوم القيامة.', source: 'صحيح مسلم 2699a', url: 'https://sunnah.com/muslim:2699a' }
];
