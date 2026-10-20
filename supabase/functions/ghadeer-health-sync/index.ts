// غلاف بسيط لطلب مزامنة مدينة في الدليل الصحي. المزامنة الفعلية تتم داخل قاعدة البيانات (pg_net + pg_cron)
// لأن خوادم Overpass ترفض طلبات وظائف الحافة؛ انظر supabase/migrations/20261020150000_health_sync_db.sql.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { auth: { persistSession: false } });
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const u = new URL(req.url);
  const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
  const area = String(body.area || u.searchParams.get('area') || '');
  const { data, error } = area ? await db.rpc('health_request_sync', { p_city: area }) : await db.rpc('health_sync_status', { p_city: '' });
  return new Response(JSON.stringify(error ? { success: false, message: error.message } : data), { headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' } });
});
