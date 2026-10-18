-- إعداد الشاشة لكل عضو (إضافة فقط، طُبّق على القاعدة الحية 2026-10-18).
create table if not exists public.member_ui_prefs (
  member_id bigint primary key references public.members(id) on delete cascade,
  prefs jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.member_ui_prefs enable row level security;
revoke all on public.member_ui_prefs from anon, authenticated;

create or replace function public.member_get_ui_prefs(p_member_id bigint, p_pin text)
returns jsonb language plpgsql security definer set search_path to 'public', 'extensions', 'pg_temp' as $$
begin
  if not public.member_auth_ok(p_member_id, p_pin) then return jsonb_build_object('success', false, 'message', 'بيانات الدخول غير صحيحة'); end if;
  return jsonb_build_object('success', true, 'prefs', (select prefs from public.member_ui_prefs where member_id = p_member_id), 'updated_at', (select updated_at from public.member_ui_prefs where member_id = p_member_id));
end; $$;

create or replace function public.member_set_ui_prefs(p_member_id bigint, p_pin text, p_prefs jsonb)
returns jsonb language plpgsql security definer set search_path to 'public', 'extensions', 'pg_temp' as $$
begin
  if not public.member_auth_ok(p_member_id, p_pin) then return jsonb_build_object('success', false, 'message', 'بيانات الدخول غير صحيحة'); end if;
  if jsonb_typeof(p_prefs) <> 'object' or length(p_prefs::text) > 8000 then return jsonb_build_object('success', false, 'message', 'إعدادات غير صالحة'); end if;
  insert into public.member_ui_prefs(member_id, prefs) values (p_member_id, p_prefs)
    on conflict (member_id) do update set prefs = excluded.prefs, updated_at = now();
  return jsonb_build_object('success', true, 'message', 'تم حفظ إعدادات الشاشة');
end; $$;
grant execute on function public.member_get_ui_prefs(bigint, text), public.member_set_ui_prefs(bigint, text, jsonb) to anon, authenticated;
notify pgrst, 'reload schema';
