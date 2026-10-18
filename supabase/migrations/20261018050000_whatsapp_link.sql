-- ربط الواتساب للأعضاء (بدون واجهة واتساب للأعمال): رقم العضو بإذنه، وروابط wa.me، ورابط قروب الواتساب.
-- إضافة فقط.

-- العضو يحفظ رقم واتسابه ويحدد هل يسمح للجيران بمراسلته.
create or replace function public.member_set_whatsapp(p_member_id bigint, p_pin text, p_phone text, p_allow boolean)
returns jsonb language plpgsql security definer set search_path to 'public', 'extensions', 'pg_temp' as $$
declare v_phone text := nullif(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), '');
begin
  if not public.member_auth_ok(p_member_id, p_pin) then return jsonb_build_object('success', false, 'message', 'بيانات الدخول غير صحيحة'); end if;
  if v_phone like '9665%' then v_phone := '0' || substr(v_phone, 4); end if;
  if v_phone is not null and v_phone !~ '^05[0-9]{8}$' then return jsonb_build_object('success', false, 'message', 'رقم الجوال يجب أن يكون 10 أرقام ويبدأ بـ 05'); end if;
  if v_phone is not null and exists (select 1 from public.members where phone = v_phone and id <> p_member_id) then
    return jsonb_build_object('success', false, 'message', 'رقم الجوال مسجل لعضو آخر'); end if;
  update public.members set phone = v_phone where id = p_member_id;
  insert into public.neighbor_message_settings(member_id, whatsapp_enabled) values (p_member_id, coalesce(p_allow, false) and v_phone is not null)
    on conflict (member_id) do update set whatsapp_enabled = excluded.whatsapp_enabled, updated_at = now();
  return jsonb_build_object('success', true, 'message', 'تم حفظ إعدادات الواتساب');
end; $$;

create or replace function public.member_get_whatsapp(p_member_id bigint, p_pin text)
returns jsonb language plpgsql security definer set search_path to 'public', 'extensions', 'pg_temp' as $$
begin
  if not public.member_auth_ok(p_member_id, p_pin) then return jsonb_build_object('success', false, 'message', 'بيانات الدخول غير صحيحة'); end if;
  return jsonb_build_object('success', true,
    'phone', (select phone from public.members where id = p_member_id),
    'allow', coalesce((select whatsapp_enabled from public.neighbor_message_settings where member_id = p_member_id), false),
    'group_link', (select value from public.app_settings where key = 'whatsapp_group_link'));
end; $$;

-- قائمة الجيران الذين سمحوا بالمراسلة عبر الواتساب (للأعضاء فقط).
create or replace function public.neighbors_whatsapp_list(p_member_id bigint, p_pin text)
returns jsonb language plpgsql security definer set search_path to 'public', 'extensions', 'pg_temp' as $$
begin
  if not public.member_auth_ok(p_member_id, p_pin) then return jsonb_build_object('success', false, 'message', 'بيانات الدخول غير صحيحة'); end if;
  return jsonb_build_object('success', true, 'items', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'name', m.name, 'wa', '966' || substr(m.phone, 2)) order by m.name)
    from public.members m join public.neighbor_message_settings s on s.member_id = m.id
    where m.active and s.whatsapp_enabled and m.phone ~ '^05[0-9]{8}$'), '[]'::jsonb),
    'group_link', (select value from public.app_settings where key = 'whatsapp_group_link'));
end; $$;

-- المطور يحدد رابط قروب الواتساب (يظهر للأعضاء فقط).
create or replace function public.manager_set_whatsapp_group(p_manager_pin text, p_link text)
returns jsonb language plpgsql security definer set search_path to 'public', 'extensions', 'pg_temp' as $$
declare v text := trim(coalesce(p_link, ''));
begin
  if not public._manager_pin_ok(p_manager_pin) then return jsonb_build_object('success', false, 'message', 'رقم المطور غير صحيح'); end if;
  if v <> '' and v !~ '^https://(chat\.whatsapp\.com|wa\.me)/' then return jsonb_build_object('success', false, 'message', 'الرابط يجب أن يبدأ بـ https://chat.whatsapp.com/'); end if;
  insert into public.app_settings(key, value) values ('whatsapp_group_link', v) on conflict (key) do update set value = excluded.value, updated_at = now();
  return jsonb_build_object('success', true, 'message', 'تم حفظ رابط القروب');
end; $$;

grant execute on function public.member_set_whatsapp(bigint, text, text, boolean), public.member_get_whatsapp(bigint, text),
  public.neighbors_whatsapp_list(bigint, text), public.manager_set_whatsapp_group(text, text) to anon, authenticated;
notify pgrst, 'reload schema';
