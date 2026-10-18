/* طبقة البيانات الوحيدة: كل اتصال بـ Supabase يمر من هنا. */
import { SUPABASE_URL, SUPABASE_KEY } from '../config.js';

let client = null;
export function db() {
  if (client) return client;
  const lib = window.supabase;
  if (!lib?.createClient) throw new Error('تعذر تحميل مكتبة قاعدة البيانات. تحقق من الاتصال ثم أعد تحميل الصفحة.');
  client = lib.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

/** يوحّد شكل نتائج RPC (نص JSON، مصفوفة بصف واحد، كائن). */
export function normalize(data) {
  if (typeof data === 'string') { try { return JSON.parse(data); } catch { return data; } }
  if (Array.isArray(data) && data.length === 1 && data[0] && typeof data[0] === 'object' && ('success' in data[0] || 'ok' in data[0])) return data[0];
  return data;
}

const asList = d => { const n = normalize(d); return Array.isArray(n) ? n : []; };

function friendly(error) {
  const msg = error?.message || '';
  if (/Failed to fetch|NetworkError|network/i.test(msg)) return 'تعذر الاتصال بالخادم. تحقق من الإنترنت.';
  if (/Could not find the function|does not exist|PGRST202/i.test(msg)) return 'هذه الخدمة غير مفعلة في قاعدة البيانات بعد.';
  if (/permission denied|not allowed|42501/i.test(msg)) return 'لا تملك صلاحية تنفيذ هذه العملية.';
  return msg || 'تعذر تنفيذ العملية.';
}

/**
 * استدعاء دالة RPC.
 * يعيد دائمًا { ok, data, message, missing } ولا يرمي استثناء.
 * ok = نجاح النقل وعدم إرجاع success:false.
 */
export async function call(name, args = {}) {
  try {
    const { data, error } = await db().rpc(name, args);
    if (error) return { ok: false, data: null, message: friendly(error), missing: /PGRST202|Could not find the function/i.test(error.message || '') || error.code === 'PGRST202' };
    const d = normalize(data);
    const flagged = d && typeof d === 'object' && !Array.isArray(d) && (d.success === false || d.ok === false);
    return { ok: !flagged, data: d, message: (d && (d.message || d.error)) || (flagged ? 'تعذر تنفيذ العملية.' : ''), missing: false };
  } catch (e) {
    return { ok: false, data: null, message: friendly(e), missing: false };
  }
}

/** مثل call لكن يعيد قائمة دائمًا. */
export async function list(name, args = {}) {
  const r = await call(name, args);
  return { ...r, data: r.ok ? asList(r.data) : [] };
}

/** قراءة جدول عام (للجداول المسموح قراءتها فقط عبر RLS). */
export async function table(name, { select = '*', order, ascending = true, limit } = {}) {
  try {
    let q = db().from(name).select(select);
    if (order) q = q.order(order, { ascending });
    if (limit) q = q.limit(limit);
    const { data, error } = await q;
    if (error) return { ok: false, data: [], message: friendly(error) };
    return { ok: true, data: data || [], message: '' };
  } catch (e) {
    return { ok: false, data: [], message: friendly(e) };
  }
}

/** قائمة الجيران العامة (id, name, active) دون أي بيانات حساسة. */
export async function publicMembers() {
  const r = await list('get_public_members');
  if (r.ok && r.data.length) return r.data.filter(m => m.active !== false);
  const v = await table('public_members', { select: 'id,name,active', order: 'id' });
  return v.ok ? v.data.filter(m => m.active !== false) : [];
}

/** دالة طرفية عامة للقراءة فقط (مثل الأخبار المحلية). */
export async function edge(name) {
  try {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, { headers: { apikey: SUPABASE_KEY } });
    if (!r.ok) return { ok: false, data: null, message: 'HTTP ' + r.status };
    return { ok: true, data: await r.json(), message: '' };
  } catch (e) {
    return { ok: false, data: null, message: friendly(e) };
  }
}
