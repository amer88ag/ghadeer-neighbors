-- جيران حي الغدير — المجتمعات الجديدة (المرحلة الثانية): كل خدمات البرنامج تعمل داخل كل مجتمع بشكل مستقل.
--
-- الفكرة: كل جدول خدمة يُعاد تسميته إلى <name>_all ويُضاف له عمود community_scope (0 = مجتمع الغدير الأم)،
-- ثم يُنشأ بالاسم القديم عرض (view) قابل للتحديث يعرض صفوف المجتمع الحالي فقط. كل الدوال الحالية تبقى كما هي
-- وتعمل تلقائيًا داخل المجتمع الحالي، لأن أسماء الجداول التي تستخدمها صارت تشير إلى العروض المعزولة.
--
-- المجتمع الحالي يُحدَّد من ترويسة x-community-token التي يرسلها التطبيق بعد «دخول المجتمع».
-- بدون الترويسة (كل الطلبات الحالية والمهام المجدولة) = الغدير، فلا يتغير شيء على بيانات الغدير.
-- لا يُحذف أي جدول ولا أي بيانات.

-- 1) جلسات المجتمعات وتحديد المجتمع الحالي ------------------------------------------------------------
create table if not exists public.ghadeer_community_sessions (
  token_hash text primary key,
  community_id bigint not null references public.ghadeer_communities(id) on delete cascade,
  member_id bigint references public.members(id) on delete cascade,
  is_manager boolean not null default false,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_ghadeer_community_sessions_exp on public.ghadeer_community_sessions(expires_at);
alter table public.ghadeer_community_sessions enable row level security;
revoke all on public.ghadeer_community_sessions from anon, authenticated;

create or replace function public._cc() returns bigint
language plpgsql stable security definer set search_path to 'public', 'extensions', 'pg_temp' as $$
declare v text; t text; cid bigint;
begin
  v := current_setting('ghadeer.cc', true);
  if v is not null and v <> '' then return v::bigint; end if;
  begin
    t := nullif(trim(current_setting('request.headers', true)::json->>'x-community-token'), '');
  exception when others then t := null; end;
  if t is null then
    cid := 0;
  else
    select s.community_id into cid
      from public.ghadeer_community_sessions s join public.ghadeer_communities c on c.id = s.community_id
     where s.token_hash = encode(extensions.digest(t, 'sha256'), 'hex') and s.expires_at > now() and c.status = 'active'
       and (s.is_manager or exists (select 1 from public.ghadeer_community_members m
              where m.community_id = s.community_id and m.member_id = s.member_id and m.status = 'approved'));
    if cid is null then
      raise exception 'community_session_invalid' using hint = 'انتهت جلسة المجتمع، ادخل المجتمع من جديد';
    end if;
  end if;
  perform set_config('ghadeer.cc', cid::text, true);
  return cid;
end; $$;
grant execute on function public._cc() to anon, authenticated;

create or replace function public._cc_has_member(p_member_id bigint) returns boolean
language sql stable security definer set search_path to 'public', 'pg_temp' as $$
  select public._cc() = 0 or exists (select 1 from public.ghadeer_community_members m
    where m.community_id = public._cc() and m.member_id = p_member_id and m.status = 'approved');
$$;
grant execute on function public._cc_has_member(bigint) to anon, authenticated;

create or replace function public._ghadeer_only() returns void
language plpgsql stable security definer set search_path to 'public', 'pg_temp' as $$
begin
  if public._cc() <> 0 then raise exception 'هذه العملية متاحة في مجتمع الغدير فقط'; end if;
end; $$;
grant execute on function public._ghadeer_only() to anon, authenticated;

create or replace function public._scope_fill() returns trigger
language plpgsql security definer set search_path to 'public', 'pg_temp' as $$
begin
  if tg_op = 'INSERT' then
    new.community_scope := coalesce(new.community_scope, public._cc());
  elsif new.community_scope is distinct from old.community_scope then
    raise exception 'لا يمكن نقل البيانات بين المجتمعات';
  end if;
  return new;
end; $$;

-- 2) عزل جداول الخدمات --------------------------------------------------------------------------------
do $$
declare
  t text;
  g record;
  scoped text[] := array[
    'announcements','app_notifications','coffee_schedule','event_expenses','event_participants','ghadeer_service_settings',
    'group_audit_log','group_memberships','group_messages','group_rules','lottery_draws','member_permissions',
    'membership_audit_log','neighbor_check_ins','neighbor_conversations','neighbor_gathering_members','neighbor_gatherings',
    'neighbor_help','neighbor_initiatives','neighbor_market','neighbor_message_reports','neighbor_message_settings',
    'neighbor_messages','neighbor_profiles','neighborhood_events','neighborhood_rental_listings','outing_attendance',
    'outing_expenses','outing_plan_assignments','outing_plan_expenses','outing_plan_organizers','outing_plan_ratings',
    'outing_plan_votes','outing_plans','outing_reviews','outings_schedule','schedule_audit_log','schedule_settings',
    'schedule_thanks_sent','suggestions'];
begin
  foreach t in array scoped loop
    if to_regclass('public.' || t || '_all') is not null then continue; end if;  -- طُبّق سابقًا
    execute format('alter table public.%I rename to %I', t, t || '_all');
    execute format('alter table public.%I add column community_scope bigint not null default 0', t || '_all');
    execute format('alter table public.%I alter column community_scope set default public._cc()', t || '_all');
    execute format('create index if not exists %I on public.%I(community_scope)', 'ix_' || t || '_scope', t || '_all');
    execute format('create trigger trg_scope_fill before insert or update on public.%I for each row execute function public._scope_fill()', t || '_all');
    execute format('create view public.%I with (security_invoker = true) as select * from public.%I where community_scope = public._cc() with local check option', t, t || '_all');
    for g in select grantee, privilege_type from information_schema.role_table_grants
              where table_schema = 'public' and table_name = t || '_all' and grantee in ('anon','authenticated','service_role') loop
      execute format('grant %s on public.%I to %I', g.privilege_type, t, g.grantee);
    end loop;
    execute format('revoke all on public.%I from anon, authenticated', t || '_all');
  end loop;
end $$;

-- المفاتيح التي كانت فريدة على مستوى البرنامج صارت فريدة داخل كل مجتمع.
alter table public.member_permissions_all drop constraint member_permissions_pkey, add constraint member_permissions_pkey primary key (community_scope, member_id);
alter table public.neighbor_profiles_all drop constraint neighbor_profiles_pkey, add constraint neighbor_profiles_pkey primary key (community_scope, member_id);
alter table public.neighbor_message_settings_all drop constraint neighbor_message_settings_pkey, add constraint neighbor_message_settings_pkey primary key (community_scope, member_id);
alter table public.schedule_settings_all drop constraint schedule_settings_pkey, add constraint schedule_settings_pkey primary key (community_scope, id);
alter table public.ghadeer_service_settings_all drop constraint ghadeer_service_settings_pkey, add constraint ghadeer_service_settings_pkey primary key (community_scope, key);
alter table public.group_memberships_all drop constraint group_memberships_member_id_group_type_key, add constraint group_memberships_member_id_group_type_key unique (community_scope, member_id, group_type);
alter table public.neighbor_conversations_all drop constraint neighbor_conversations_member_a_member_b_key, add constraint neighbor_conversations_member_a_member_b_key unique (community_scope, member_a, member_b);

-- 3) الأعضاء: الحسابات واحدة للبرنامج كله، وداخل المجتمع لا يظهر إلا أعضاؤه المقبولون ---------------------
do $$
declare g record;
begin
  if to_regclass('public.members_all') is null then
    alter table public.members rename to members_all;
    create view public.members with (security_invoker = true) as
      select * from public.members_all m where public._cc_has_member(m.id);
    for g in select grantee, privilege_type from information_schema.role_table_grants
              where table_schema = 'public' and table_name = 'members_all' and grantee in ('anon','authenticated','service_role') loop
      execute format('grant %s on public.members to %I', g.privilege_type, g.grantee);
    end loop;
  end if;
end $$;
create or replace view public.public_members as select id, name, active from public.members where active = true;

-- 4) تعديل الدوال الحالية آليًا ----------------------------------------------------------------------------
-- (أ) أهداف ON CONFLICT للجداول التي صار مفتاحها يشمل المجتمع.
-- (ب) إصلاح أمني: دوال كانت تستدعي member_login وتتجاهل نتيجته، فتقبل رقمًا سريًا خاطئًا.
-- (ج) عمليات تخص البرنامج كله (حسابات الأعضاء، رقم المطور، النسخ الاحتياطي، المجتمعات...) تبقى في الغدير فقط.
do $$
declare
  r record; nd text;
  ghadeer_only text[] := array[
    'manager_delete_all_program_data','manager_restore_baseline','manager_restore_backup','manager_export_backup',
    'manager_set_manager_pin','manager_set_program_pause','manager_set_occasion_automation','supervisor_set_occasion_automation',
    'manager_set_neighbor_profiles_enabled','manager_delete_member','manager_set_member_active','manager_update_member_name',
    'manager_set_member_pin','manager_add_member','manager_update_member_profile','manager_list_pin_reset_requests',
    'manager_resolve_pin_reset_request','community_request_create','community_my_list','community_join_by_code',
    'community_members','community_decide_member','community_regenerate_code','manager_review_community',
    'supervisor_review_community','manager_list_communities','supervisor_list_communities','accept_program_terms',
    'issue_member_device_token','member_change_own_pin','request_member_pin_reset'];
begin
  for r in select p.oid, p.proname, p.prorettype::regtype::text rt, pg_get_functiondef(p.oid) d
             from pg_proc p where p.pronamespace = 'public'::regnamespace and p.prokind = 'f' and p.proname !~ '^mutqin' loop
    nd := regexp_replace(r.d,
      '(insert\s+into\s+(public\.)?(member_permissions|neighbor_profiles|neighbor_message_settings|schedule_settings|ghadeer_service_settings|group_memberships|neighbor_conversations)\M[^;]*?on\s+conflict\s*\()',
      '\1community_scope, ', 'gi');
    nd := regexp_replace(nd, 'perform\s+public\.member_login\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)\s*;',
      case when r.rt = 'jsonb'
        then 'if not coalesce((public.member_login(\1,\2)->>''success'')::boolean,false) then return jsonb_build_object(''success'',false,''message'',''بيانات الدخول غير صحيحة''); end if;'
        else 'if not coalesce((public.member_login(\1,\2)->>''success'')::boolean,false) then raise exception ''غير مصرح أو بيانات الدخول غير صحيحة''; end if;' end,
      'gi');
    if r.proname = any(ghadeer_only) and nd ~* 'language plpgsql' and nd !~ '_ghadeer_only\(\)' then
      nd := regexp_replace(nd, '^(.*?\$function\$.*?\mbegin\M)', '\1 perform public._ghadeer_only();', 'i');
    end if;
    if nd <> r.d then execute nd; end if;
  end loop;
end $$;

-- 5) تجهيز المجتمع عند اعتماده، وصلاحيات صاحبه ومشرفيه داخل مجتمعه ------------------------------------------
create or replace function public._community_sync_admin(p_community_id bigint, p_member_id bigint, p_admin boolean) returns void
language plpgsql security definer set search_path to 'public', 'pg_temp' as $$
begin
  if p_admin then
    insert into public.member_permissions_all(community_scope, member_id, role, can_apologize, can_manage_schedule, can_manage_members,
      can_send_messages, can_manage_coffee, can_manage_outings, can_manage_dates, can_manage_rules, can_manage_lottery,
      can_manage_apologies, can_send_group_messages)
    values (p_community_id, p_member_id, 'supervisor', true, true, true, true, true, true, true, true, true, true, true)
    on conflict (community_scope, member_id) do update set role = 'supervisor', can_manage_schedule = true, can_manage_members = true,
      can_send_messages = true, can_manage_coffee = true, can_manage_outings = true, can_manage_dates = true, can_manage_rules = true,
      can_manage_lottery = true, can_manage_apologies = true, can_send_group_messages = true, updated_at = now();
  else
    delete from public.member_permissions_all where community_scope = p_community_id and member_id = p_member_id;
  end if;
end; $$;
revoke all on function public._community_sync_admin(bigint, bigint, boolean) from public, anon, authenticated;

create or replace function public._community_on_status() returns trigger
language plpgsql security definer set search_path to 'public', 'pg_temp' as $$
begin
  if new.status = 'active' then
    insert into public.schedule_settings_all(community_scope, id) values (new.id, true) on conflict do nothing;
    perform public._community_sync_admin(new.id, m.member_id, true)
      from public.ghadeer_community_members m where m.community_id = new.id and m.status = 'approved' and m.role in ('owner','admin');
  end if;
  return new;
end; $$;
drop trigger if exists trg_community_on_status on public.ghadeer_communities;
create trigger trg_community_on_status after insert or update of status on public.ghadeer_communities
  for each row execute function public._community_on_status();

create or replace function public._community_member_sync() returns trigger
language plpgsql security definer set search_path to 'public', 'pg_temp' as $$
begin
  perform public._community_sync_admin(new.community_id, new.member_id, new.status = 'approved' and new.role in ('owner','admin'));
  return new;
end; $$;
drop trigger if exists trg_community_member_sync on public.ghadeer_community_members;
create trigger trg_community_member_sync after insert or update of role, status on public.ghadeer_community_members
  for each row execute function public._community_member_sync();

-- المجتمعات المعتمدة قبل هذا الترحيل
insert into public.schedule_settings_all(community_scope, id) select id, true from public.ghadeer_communities where status = 'active' on conflict do nothing;
select public._community_sync_admin(m.community_id, m.member_id, true)
  from public.ghadeer_community_members m join public.ghadeer_communities c on c.id = m.community_id
 where c.status = 'active' and m.status = 'approved' and m.role in ('owner','admin');

-- 6) دخول المجتمع والخروج منه ------------------------------------------------------------------------------
create or replace function public.community_enter(p_member_id bigint, p_pin text, p_community_id bigint)
returns jsonb language plpgsql security definer set search_path to 'public', 'extensions', 'pg_temp' as $$
declare c public.ghadeer_communities%rowtype; v_role text; v_token text;
begin
  perform public._ghadeer_only();
  if not public.member_auth_ok(p_member_id, p_pin) then return jsonb_build_object('success', false, 'message', 'بيانات الدخول غير صحيحة'); end if;
  select * into c from public.ghadeer_communities where id = p_community_id;
  if not found or c.status <> 'active' then return jsonb_build_object('success', false, 'message', 'المجتمع غير متاح حاليًا'); end if;
  select role into v_role from public.ghadeer_community_members where community_id = p_community_id and member_id = p_member_id and status = 'approved';
  if v_role is null then return jsonb_build_object('success', false, 'message', 'لست عضوًا مقبولًا في هذا المجتمع'); end if;
  delete from public.ghadeer_community_sessions where expires_at < now();
  v_token := encode(gen_random_bytes(32), 'hex');
  insert into public.ghadeer_community_sessions(token_hash, community_id, member_id, expires_at)
    values (encode(digest(v_token, 'sha256'), 'hex'), p_community_id, p_member_id, now() + interval '30 days');
  return jsonb_build_object('success', true, 'token', v_token, 'id', c.id, 'name', c.name, 'role', v_role);
end; $$;

create or replace function public.manager_enter_community(p_manager_pin text, p_community_id bigint)
returns jsonb language plpgsql security definer set search_path to 'public', 'extensions', 'pg_temp' as $$
declare c public.ghadeer_communities%rowtype; v_token text;
begin
  perform public._ghadeer_only();
  if not public._manager_pin_ok(p_manager_pin) then return jsonb_build_object('success', false, 'message', 'رقم المطور غير صحيح'); end if;
  select * into c from public.ghadeer_communities where id = p_community_id;
  if not found or c.status <> 'active' then return jsonb_build_object('success', false, 'message', 'المجتمع غير مفعّل'); end if;
  v_token := encode(gen_random_bytes(32), 'hex');
  insert into public.ghadeer_community_sessions(token_hash, community_id, is_manager, expires_at)
    values (encode(digest(v_token, 'sha256'), 'hex'), p_community_id, true, now() + interval '1 day');
  insert into public.ghadeer_security_log(action, metadata) values ('manager_entered_community', jsonb_build_object('community_id', p_community_id));
  return jsonb_build_object('success', true, 'token', v_token, 'id', c.id, 'name', c.name, 'role', 'manager');
end; $$;

create or replace function public.community_leave(p_token text)
returns jsonb language plpgsql security definer set search_path to 'public', 'extensions', 'pg_temp' as $$
begin
  delete from public.ghadeer_community_sessions where token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex');
  return jsonb_build_object('success', true);
end; $$;

grant execute on function public.community_enter(bigint, text, bigint), public.manager_enter_community(text, bigint), public.community_leave(text) to anon, authenticated;

notify pgrst, 'reload schema';
