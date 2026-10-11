/* بيانات مشتركة بين الصفحات مع ذاكرة مؤقتة قصيرة. */
import { table, list, call } from './api.js';
import { state, creds } from './session.js';

const cache = new Map();
const TTL = 60_000;

async function cached(key, loader, force) {
  const hit = cache.get(key);
  if (!force && hit && Date.now() - hit.at < TTL) return hit.value;
  const value = await loader();
  cache.set(key, { at: Date.now(), value });
  return value;
}
export const invalidate = (...keys) => keys.length ? keys.forEach(k => cache.delete(k)) : cache.clear();

export const coffee = force => cached('coffee', async () => (await table('coffee_schedule', { order: 'coffee_date' })).data, force);
export const outings = force => cached('outings', async () => (await table('outings_schedule', { order: 'outing_date' })).data, force);
export const announcements = force => cached('announcements', async () => (await table('announcements', { order: 'created_at', ascending: false, limit: 30 })).data, force);
export const groupMessages = force => cached('messages', async () => (await table('group_messages', { order: 'created_at', ascending: true, limit: 150 })).data, force);
export const settings = force => cached('settings', async () => { const r = await call('get_schedule_settings'); return r.ok && r.data && typeof r.data === 'object' ? r.data : {}; }, force);
export const profiles = force => cached('profiles', async () => (await list('get_member_profiles')).data, force);

/** طلبات الطلعات مع تصويت العضو الحالي (إن كان مسجلًا برقمه). */
export async function outingPlans(force) {
  const plans = await cached('plans', async () => (await list('get_outing_plans')).data, force);
  if (state.user && state.pin && !state.manager) {
    await Promise.all(plans.map(async p => {
      if (p.status === 'scheduled') {
        const r = await call('get_outing_plan_rating', { ...creds(), p_plan_id: p.id });
        p.my_rating = r.ok ? (r.data || {}) : {};
      } else if (p.status !== 'rejected') {
        const r = await call('get_outing_plan_vote', { ...creds(), p_plan_id: p.id });
        p.my_vote = r.ok ? (r.data?.vote || null) : null;
      }
    }));
  }
  return plans;
}

/** المناسبات المنشورة (التي حان وقت ظهورها). */
export function visibleOccasions(rows) {
  const now = Date.now();
  return rows.filter(a => a.is_occasion === true && (!a.scheduled_at || new Date(a.scheduled_at).getTime() <= now));
}

/** الإعلانات العامة الظاهرة (غير المجدولة للمستقبل). */
export function visibleAnnouncements(rows) {
  const now = Date.now();
  return rows.filter(a => !a.scheduled_at || new Date(a.scheduled_at).getTime() <= now);
}
