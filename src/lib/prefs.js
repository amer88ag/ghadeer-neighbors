/* إعداد الشاشة لكل عضو: الحجم، المظهر، حجم الأيقونات، إخفاء وترتيب الأيقونات وأقسام الرئيسية.
 * يُحفظ على الجهاز فورًا، ويُزامن مع حساب العضو عند توفر رقمه السري ليظهر على أجهزته الأخرى. */
import { call } from './api.js';

export const WIDGETS = [
  ['dhikr', '🤲 شريط الذكر'], ['news', '📢 شريط أخبار الحي'], ['weather', '🌤️ درجة الحرارة'],
  ['prayer', '🕌 مواقيت الصلاة'], ['upcoming', '☕ لقاءات الجيران القادمة'], ['foot', '👥 عدد الجيران']
];
export const DEFAULTS = { scale: 1, theme: 'auto', tiles: 'md', order: [], hidden: [], widgets: {}, motion: true, at: 0 };

let owner = 'guest';
let current = { ...DEFAULTS };
const key = () => 'ghadeer.ui.' + owner;
const read = () => { try { return JSON.parse(localStorage.getItem(key()) || 'null'); } catch { return null; } };
const write = v => { try { localStorage.setItem(key(), JSON.stringify(v)); } catch { /* وضع خاص */ } };
const clean = p => ({
  ...DEFAULTS, ...p,
  scale: Math.min(1.4, Math.max(0.8, Number(p?.scale) || 1)),
  theme: ['auto', 'light', 'dark'].includes(p?.theme) ? p.theme : 'auto',
  tiles: ['sm', 'md', 'lg'].includes(p?.tiles) ? p.tiles : 'md',
  order: Array.isArray(p?.order) ? p.order.filter(x => typeof x === 'string').slice(0, 60) : [],
  hidden: Array.isArray(p?.hidden) ? p.hidden.filter(x => typeof x === 'string').slice(0, 60) : [],
  widgets: p?.widgets && typeof p.widgets === 'object' ? p.widgets : {}
});

export const prefs = () => current;
export const widgetOn = k => current.widgets[k] !== false;

/** يطبّق الإعدادات على الواجهة. */
export function apply() {
  const r = document.documentElement;
  r.dataset.theme = current.theme;
  r.dataset.tiles = current.tiles;
  r.dataset.motion = current.motion ? 'on' : 'off';
  document.body.style.zoom = current.scale === 1 ? '' : String(current.scale);
}

/** يبدّل صاحب الإعدادات (زائر أو عضو) ويحمّل إعداداته المحلية. */
export function useOwner(id) {
  owner = id ? 'm' + id : 'guest';
  current = clean(read() || (owner !== 'guest' ? (() => { try { return JSON.parse(localStorage.getItem('ghadeer.ui.guest') || 'null'); } catch { return null; } })() : null) || {});
  apply();
}

/** يحفظ تغييرًا ويطبّقه، ويزامنه مع الحساب إن أمكن. */
export async function save(patch, creds) {
  current = clean({ ...current, ...patch, at: Date.now() });
  write(current); apply();
  if (creds?.p_member_id && creds?.p_pin) await call('member_set_ui_prefs', { ...creds, p_prefs: current });
}

export function reset(creds) { return save({ ...DEFAULTS }, creds); }

/** يجلب إعدادات الحساب ويعتمدها إن كانت أحدث من المحلية. */
export async function pull(creds) {
  if (!creds?.p_member_id || !creds?.p_pin) return;
  const r = await call('member_get_ui_prefs', creds);
  const remote = r.ok ? r.data?.prefs : null;
  if (remote && (Number(remote.at) || 0) > (Number(current.at) || 0)) { current = clean(remote); write(current); apply(); return true; }
  return false;
}

/** ترتيب أيقونات بحسب اختيار العضو (ما لم يرتبه يبقى بترتيبه الأصلي بعدها). */
export function arrangeTiles(ids) {
  const pos = new Map(current.order.map((id, i) => [id, i]));
  return ids.filter(id => !current.hidden.includes(id))
    .map((id, i) => [id, pos.has(id) ? pos.get(id) : 1000 + i]).sort((a, b) => a[1] - b[1]).map(x => x[0]);
}
