-- صلاحيات إضافية للمطور (إضافة فقط، طُبّق على القاعدة الحية 2026-10-18):
-- حالة البرنامج العامة (الإيقاف المؤقت ونص الترحيب ومقدمة الدعوة)، تعديل النصوص، وإلغاء تذكّر الدخول على كل الأجهزة.
create or replace function public.get_app_status()
returns jsonb language sql stable security definer set search_path to 'public', 'pg_temp' as $$
  select jsonb_build_object(
    'paused', coalesce((select is_paused from public.program_control limit 1), false),
    'pause_message', (select message from public.program_control limit 1),
    'home_welcome', (select value from public.app_settings where key = 'home_welcome'),
    'invite_intro', (select value from public.app_settings where key = 'invite_intro'));
$$;
grant execute on function public.get_app_status() to anon, authenticated;

create or replace function public.manager_set_app_text(p_manager_pin text, p_key text, p_value text)
returns jsonb language plpgsql security definer set search_path to 'public', 'extensions', 'pg_temp' as $$
declare v text := left(trim(coalesce(p_value, '')), 1500);
begin
  if not public._manager_pin_ok(p_manager_pin) then return jsonb_build_object('success', false, 'message', 'رقم المطور غير صحيح'); end if;
  if p_key not in ('home_welcome', 'invite_intro') then return jsonb_build_object('success', false, 'message', 'إعداد غير معروف'); end if;
  insert into public.app_settings(key, value) values (p_key, v) on conflict (key) do update set value = excluded.value, updated_at = now();
  insert into public.ghadeer_security_log(action, metadata) values ('app_text_changed', jsonb_build_object('key', p_key));
  return jsonb_build_object('success', true, 'message', 'تم الحفظ');
end; $$;

create or replace function public.manager_revoke_all_devices(p_manager_pin text)
returns jsonb language plpgsql security definer set search_path to 'public', 'extensions', 'pg_temp' as $$
declare n int;
begin
  if not public._manager_pin_ok(p_manager_pin) then return jsonb_build_object('success', false, 'message', 'رقم المطور غير صحيح'); end if;
  update public.member_device_tokens set revoked_at = now() where revoked_at is null;
  get diagnostics n = row_count;
  insert into public.ghadeer_security_log(action, metadata) values ('all_devices_revoked', jsonb_build_object('count', n));
  return jsonb_build_object('success', true, 'count', n, 'message', 'تم إلغاء تذكّر الدخول على ' || n || ' جهاز');
end; $$;
grant execute on function public.manager_set_app_text(text, text, text), public.manager_revoke_all_devices(text) to anon, authenticated;
notify pgrst, 'reload schema';
