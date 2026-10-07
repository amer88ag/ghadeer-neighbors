-- Phase 1 isolation audit — READ ONLY
-- Run in Supabase SQL Editor. This file performs SELECT-only inspection.

-- 1) Tables and whether RLS is enabled.
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r','p','v','m')
order by c.relname;

-- 2) Tables containing community_id.
select
  table_schema,
  table_name,
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and column_name = 'community_id'
order by table_name;

-- 3) Explicit anon table privileges.
select
  table_schema,
  table_name,
  privilege_type
from information_schema.role_table_grants
where grantee = 'anon'
  and table_schema = 'public'
order by table_name, privilege_type;

-- 4) Direct privilege checks for the sensitive members table and public_members.
select
  has_table_privilege('anon','public.members','SELECT') as anon_can_select_members,
  has_table_privilege('anon','public.members','INSERT') as anon_can_insert_members,
  has_table_privilege('anon','public.members','UPDATE') as anon_can_update_members,
  has_table_privilege('anon','public.members','DELETE') as anon_can_delete_members,
  has_table_privilege('anon','public.public_members','SELECT') as anon_can_select_public_members;

-- 5) All public RLS policies, with special attention to members.
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 6) Policies specifically mentioning members.
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('members','public_members')
order by tablename, policyname;

-- 7) Functions executable by anon.
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as result_type,
  has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by p.proname, arguments;

-- 8) Public-member object definition/type.
select
  n.nspname as schema_name,
  c.relname as object_name,
  case c.relkind
    when 'v' then 'view'
    when 'm' then 'materialized view'
    when 'r' then 'table'
    when 'p' then 'partitioned table'
    else c.relkind::text
  end as object_type
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('members','public_members');

-- 9) Columns exposed by public_members, if it exists.
select
  table_schema,
  table_name,
  ordinal_position,
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'public_members'
order by ordinal_position;
