/* اختيار الموقع بموافقة المستخدم، مع الرجوع لموقع مجتمع الغدير عند عدم الاختيار. */
import { LOCATION } from '../config.js';

const STORAGE_KEY = 'ghadeer_weather_prayer_location_v1';

function valid(value) {
  const lat = Number(value?.lat), lon = Number(value?.lon);
  return Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180
    ? { lat, lon, label: 'موقعي الحالي' } : null;
}

export function getPreferredLocation() {
  try { return valid(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')) || LOCATION; }
  catch { return LOCATION; }
}

/** لا يُطلب GPS إلا بعد ضغط المستخدم على زر «حسب موقعي الحالي». */
export function requestUserLocation() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject(new Error('المتصفح لا يدعم تحديد الموقع.'));
    navigator.geolocation.getCurrentPosition(position => {
      const coords = valid({ lat: position.coords.latitude, lon: position.coords.longitude });
      if (!coords) return reject(new Error('تعذر قراءة إحداثيات الموقع.'));
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(coords)); } catch {}
      resolve(coords);
    }, error => {
      const message = error?.code === 1 ? 'لم تسمح بالوصول إلى موقعك. يمكنك تفعيل الإذن من إعدادات المتصفح.' :
        error?.code === 2 ? 'تعذر تحديد موقعك حاليًا.' : 'انتهت مهلة تحديد الموقع. حاول مرة أخرى.';
      reject(new Error(message));
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 });
  });
}

export function clearUserLocation() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
  return LOCATION;
}
