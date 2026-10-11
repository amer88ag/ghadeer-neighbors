-- جيران حي الغدير — صلاحيات المطور (المدير) الكاملة + الإقرار بالأنظمة والشروط بإصدار محدد.
-- إضافة فقط، لا تحذف بيانات.
--   1) إعدادات الخدمات: تفعيل/إيقاف كل خدمة وترتيبها وملاحظة تظهر للأعضاء عند الإيقاف.
--   2) قائمة كل الأعضاء للمدير (النشطين والموقوفين) وإيقاف/إعادة العضو.
--   3) إدارة المحتوى: إغلاق أو إعادة فتح منشورات الخدمات والسوق والمبادرات والسكن، وإلغاء/إعادة المناسبات.
--   4) حالة قبول إصدار محدد من الأنظمة والشروط.

create table if not exists public.ghadeer_service_settings (
  key text primary key,
  enabled boolean not null default true,
  sort_order integer,
  note text,
  updated_at timestamptz not null default now()
);
alter table public.ghadeer_service_settings enable row level security;
revoke all on public.ghadeer_service_settings from anon, authenticated;

create or replace function public.get_service_settings()
returns jsonb language sql stable security definer set search_path to 'public','pg_temp' as $$
  select coalesce(jsonb_agg(jsonb_build_object('key', key, 'enabled', enabled, 'sort_order', sort_order, 'note', note) order by key), '[]'::jsonb)
  from public.ghadeer_service_settings;
$$;
revoke all on function public.get_service_settings() from public, anon, authenticated;
grant execute on function public.get_service_settings() to anon, authenticated;

create or replace function public.manager_set_service_setting(p_manager_pin text, p_key text, p_enabled boolean, p_sort_order integer, p_note text)
returns jsonb language plpgsql security definer set search_path to 'public','extensions','pg_temp' as $$
begin
  if not public._manager_pin_ok(p_manager_pin) then
    return jsonb_build_object('success', false, 'message', 'الرقم السري غير صحيح أو الحساب مقفل مؤقتًا');
  end if;
  if p_key is null or p_key !~ '^[a-z]+(/[a-z]+)?$' then
    return jsonb_build_object('success', false, 'message', 'مفتاح الخدمة غير صحيح');
  end if;
  insert into public.ghadeer_service_settings(key, enabled, sort_order, note, updated_at)
  values (p_key, coalesce(p_enabled, true), p_sort_order, nullif(left(trim(coalesce(p_note, '')), 300), ''), now())
  on conflict (key) do update set enabled = excluded.enabled, sort_order = excluded.sort_order, note = excluded.note, updated_at = now();
  insert into public.ghadeer_security_log(action, metadata) values ('service_setting', jsonb_build_object('key', p_key, 'enabled', p_enabled, 'sort', p_sort_order));
  return jsonb_build_object('success', true);
end; $$;
revoke all on function public.manager_set_service_setting(text,text,boolean,integer,text) from public, anon, authenticated;
grant execute on function public.manager_set_service_setting(text,text,boolean,integer,text) to anon, authenticated;

create or replace function public.manager_list_members(p_manager_pin text)
returns jsonb language plpgsql security definer set search_path to 'public','extensions','pg_temp' as $$
begin
  if not public._manager_pin_ok(p_manager_pin) then
    return jsonb_build_object('success', false, 'message', 'الرقم السري غير صحيح أو الحساب مقفل مؤقتًا');
  end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'name', m.name, 'phone', m.phone, 'notes', m.notes, 'active', m.active,
           'last_seen_at', m.last_seen_at, 'role', coalesce(p.role, 'member')) order by m.active desc, m.name)
         from public.members m left join public.member_permissions p on p.member_id = m.id), '[]'::jsonb);
end; $$;
revoke all on function public.manager_list_members(text) from public, anon, authenticated;
grant execute on function public.manager_list_members(text) to anon, authenticated;

create or replace function public.manager_set_member_active(p_manager_pin text, p_member_id bigint, p_active boolean)
returns jsonb language plpgsql security definer set search_path to 'public','extensions','pg_temp' as $$
begin
  if not public._manager_pin_ok(p_manager_pin) then
    return jsonb_build_object('success', false, 'message', 'الرقم السري غير صحيح أو الحساب مقفل مؤقتًا');
  end if;
  update public.members set active = coalesce(p_active, true) where id = p_member_id;
  if not found then return jsonb_build_object('success', false, 'message', 'العضو غير موجود'); end if;
  if not coalesce(p_active, true) then
    -- العضو الموقوف يفقد أي صلاحيات إشراف وتُلغى رموز أجهزته.
    update public.member_permissions set role = 'member', can_manage_schedule = false, can_manage_members = false, can_send_messages = false,
      can_manage_coffee = false, can_manage_outings = false, can_manage_dates = false, can_manage_rules = false,
      can_send_group_messages = false, can_manage_lottery = false, can_manage_apologies = false, updated_at = now()
    where member_id = p_member_id;
    update public.member_device_tokens set revoked_at = now() where member_id = p_member_id and revoked_at is null;
  end if;
  insert into public.ghadeer_security_log(action, member_id) values (case when coalesce(p_active, true) then 'member_restored' else 'member_suspended' end, p_member_id);
  return jsonb_build_object('success', true, 'message', case when coalesce(p_active, true) then 'تمت إعادة العضو' else 'تم إيقاف العضو' end);
end; $$;
revoke all on function public.manager_set_member_active(text,bigint,boolean) from public, anon, authenticated;
grant execute on function public.manager_set_member_active(text,bigint,boolean) to anon, authenticated;

create or replace function public.manager_list_content(p_manager_pin text)
returns jsonb language plpgsql security definer set search_path to 'public','extensions','pg_temp' as $$
begin
  if not public._manager_pin_ok(p_manager_pin) then
    return jsonb_build_object('success', false, 'message', 'الرقم السري غير صحيح أو الحساب مقفل مؤقتًا');
  end if;
  return jsonb_build_object(
    'help', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'title', title, 'member_name', member_name, 'status', status, 'kind', kind, 'created_at', created_at) order by created_at desc) from public.neighbor_help), '[]'::jsonb),
    'market', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'title', title, 'member_name', member_name, 'status', status, 'kind', kind, 'created_at', created_at) order by created_at desc) from public.neighbor_market), '[]'::jsonb),
    'initiative', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'title', title, 'member_name', member_name, 'status', status, 'created_at', created_at) order by created_at desc) from public.neighbor_initiatives), '[]'::jsonb),
    'rental', coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'title', r.title, 'member_name', m.name, 'status', r.status, 'kind', r.kind, 'created_at', r.created_at) order by r.created_at desc) from public.neighborhood_rental_listings r left join public.members m on m.id = r.member_id), '[]'::jsonb),
    'event', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'title', title, 'status', status, 'event_date', event_date, 'created_at', created_at) order by event_date desc) from public.neighborhood_events), '[]'::jsonb)
  );
end; $$;
revoke all on function public.manager_list_content(text) from public, anon, authenticated;
grant execute on function public.manager_list_content(text) to anon, authenticated;

create or replace function public.manager_set_content_open(p_manager_pin text, p_kind text, p_id bigint, p_open boolean)
returns jsonb language plpgsql security definer set search_path to 'public','extensions','pg_temp' as $$
declare n int;
begin
  if not public._manager_pin_ok(p_manager_pin) then
    return jsonb_build_object('success', false, 'message', 'الرقم السري غير صحيح أو الحساب مقفل مؤقتًا');
  end if;
  case p_kind
    when 'help' then update public.neighbor_help set status = case when p_open then 'open' else 'closed' end where id = p_id;
    when 'market' then update public.neighbor_market set status = case when p_open then 'open' else 'closed' end where id = p_id;
    when 'initiative' then update public.neighbor_initiatives set status = case when p_open then 'مفتوحة' else 'محذوفة' end, updated_at = now() where id = p_id;
    when 'rental' then update public.neighborhood_rental_listings set status = case when p_open then 'open' else 'closed' end where id = p_id;
    when 'event' then update public.neighborhood_events set status = case when p_open then 'مخطط' else 'ملغاة' end, updated_at = now() where id = p_id;
    else return jsonb_build_object('success', false, 'message', 'نوع المحتوى غير صحيح');
  end case;
  get diagnostics n = row_count;
  if n = 0 then return jsonb_build_object('success', false, 'message', 'العنصر غير موجود'); end if;
  insert into public.ghadeer_security_log(action, metadata) values ('content_' || case when p_open then 'reopened' else 'closed' end, jsonb_build_object('kind', p_kind, 'id', p_id));
  return jsonb_build_object('success', true);
end; $$;
revoke all on function public.manager_set_content_open(text,text,bigint,boolean) from public, anon, authenticated;
grant execute on function public.manager_set_content_open(text,text,bigint,boolean) to anon, authenticated;

create or replace function public.member_terms_status(p_member_id bigint, p_pin text, p_version text)
returns jsonb language plpgsql security definer set search_path to 'public','extensions','pg_temp' as $$
begin
  if not public.member_auth_ok(p_member_id, p_pin) then
    return jsonb_build_object('success', false, 'message', 'بيانات الدخول غير صحيحة');
  end if;
  return jsonb_build_object('success', true, 'accepted',
    exists(select 1 from public.program_acceptances where member_id = p_member_id and version = p_version));
end; $$;
revoke all on function public.member_terms_status(bigint,text,text) from public, anon, authenticated;
grant execute on function public.member_terms_status(bigint,text,text) to anon, authenticated;

-- التراجع:
--   drop function if exists public.member_terms_status(bigint,text,text);
--   drop function if exists public.manager_set_content_open(text,text,bigint,boolean);
--   drop function if exists public.manager_list_content(text);
--   drop function if exists public.manager_set_member_active(text,bigint,boolean);
--   drop function if exists public.manager_list_members(text);
--   drop function if exists public.manager_set_service_setting(text,text,boolean,integer,text);
--   drop function if exists public.get_service_settings();
--   drop table if exists public.ghadeer_service_settings;
