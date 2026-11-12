/* إدارة موقع المستخدم: طلب الإذن مرة واحدة عند أول تشغيل، ثم تحديث صامت كل 5 دقائق. */
import { LOCATION } from '../config.js';

const STORAGE_KEY = 'ghadeer_weather_prayer_location_v1';
const FIRST_REQUEST_KEY = 'ghadeer_location_first_request_done_v1';
const REFRESH_MS = 5 * 60 * 1000;
let timer = null;
let started = false;

function valid(value) {
  const lat = Number(value?.lat), lon = Number(value?.lon);
  return Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180
    ? { lat, lon, label: 'موقعي الحالي' } : null;
}

export function getPreferredLocation() {
  try { return valid(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')) || LOCATION; }
  catch { return LOCATION; }
}

function saveLocation(coords) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(coords)); } catch {}
  window.dispatchEvent(new CustomEvent('ghadeer:location-updated', { detail: coords }));
  return coords;
}

function readPosition({ prompt = false } = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('المتصفح لا يدعم تحديد الموقع.'));
    navigator.geolocation.getCurrentPosition(position => {
      const coords = valid({ lat: position.coords.latitude, lon: position.coords.longitude });
      if (!coords) return reject(new Error('تعذر قراءة إحداثيات الموقع.'));
      resolve(saveLocation(coords));
    }, error => {
      const message = error?.code === 1 ? 'لم تسمح بالوصول إلى موقعك. يمكنك تفعيل الإذن من إعدادات المتصفح.' :
        error?.code === 2 ? 'تعذر تحديد موقعك حاليًا.' : 'انتهت مهلة تحديد الموقع. حاول مرة أخرى.';
      reject(new Error(message));
    }, { enableHighAccuracy: false, timeout: 15000, maximumAge: prompt ? 0 : 60000 });
  });
}

/** طلب أولي وحيد؛ لا يعاد إظهار نافذة الإذن تلقائيًا بعد الرفض أو الإغلاق. */
async function firstLocationRequest() {
  let attempted = false;
  try { attempted = localStorage.getItem(FIRST_REQUEST_KEY) === '1'; } catch {}
  if (attempted) return;
  try { localStorage.setItem(FIRST_REQUEST_KEY, '1'); } catch {}
  try { await readPosition({ prompt: true }); } catch { /* يبقى موقع أبها الافتراضي */ }
}

async function refreshIfAllowed() {
  if (document.visibilityState === 'hidden') return;
  try {
    if (navigator.permissions?.query) {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      if (permission.state !== 'granted') return;
    } else {
      // في المتصفحات التي لا تدعم Permissions API لا نعيد طلب الإذن تلقائيًا.
      return;
    }
    await readPosition();
  } catch { /* الاحتفاظ بآخر موقع ناجح أو موقع أبها */ }
}

function schedule() {
  clearTimeout(timer);
  timer = setTimeout(async () => {
    await refreshIfAllowed();
    schedule();
  }, REFRESH_MS);
}

/** يبدأ مرة واحدة عند تشغيل التطبيق، ويستأنف التحديث عند العودة للتطبيق. */
export function initializeLocationUpdates() {
  if (started) return;
  started = true;
  firstLocationRequest().finally(() => {
    schedule();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      refreshIfAllowed().finally(schedule);
    } else {
      clearTimeout(timer);
    }
  });
  window.addEventListener('focus', () => {
    if (document.visibilityState === 'visible') refreshIfAllowed().finally(schedule);
  });
}

/** تحديد يدوي من زر المستخدم؛ لا يؤثر في عدد طلبات الإذن التلقائية. */
export function requestUserLocation() {
  return readPosition({ prompt: true });
}

export function clearUserLocation() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
  return LOCATION;
}
