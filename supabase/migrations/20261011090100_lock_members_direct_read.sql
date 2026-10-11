-- جيران حي الغدير — منع قراءة جدول الأعضاء مباشرة من المتصفح.
-- طبّقه بعد التأكد على Preview أن الواجهة الجديدة تعمل (هي لا تقرأ members مباشرة إطلاقًا؛
-- تستخدم get_public_members أو العرض public_members).
-- تحقق قبل التطبيق: هل توجد دوال SECURITY INVOKER يستدعيها anon وتقرأ members؟
--   select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
--   where n.nspname='public' and not p.prosecdef and p.prosrc ilike '%members%';
-- إذا ظهرت دوال تستخدمها الواجهة فلا تطبّق هذا الملف قبل تحويلها إلى SECURITY DEFINER.

begin;
revoke select on public.members from anon;
grant select on public.public_members to anon, authenticated;
commit;

-- التراجع: grant select on public.members to anon;
