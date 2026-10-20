-- إحصاء استخدام الأيقونات ونشاط الأعضاء للمطور (إضافة فقط، طُبّق على القاعدة الحية 2026-10-20).
create table if not exists public.ghadeer_usage (
  day date not null default (now() at time zone 'Asia/Riyadh')::date,
  page text not null,
  hits integer not null default 0,
  primary key (day, page)
);
create table if not exists public.ghadeer_usage_members (
  day date not null, page text not null, member_id bigint not null references public.members(id) on delete cascade,
  primary key (day, page, member_id)
);
alter table public.ghadeer_usage enable row level security;
alter table public.ghadeer_usage_members enable row level security;
revoke all on public.ghadeer_usage, public.ghadeer_usage_members from anon, authenticated;

create or replace function public.track_page(p_page text, p_member_id bigint default null)
returns void language plpgsql security definer set search_path to 'public', 'pg_temp' as $$
declare d date := (now() at time zone 'Asia/Riyadh')::date; pg text := lower(left(coalesce(p_page, ''), 40));
begin
  if pg !~ '^[a-z][a-z/]{1,39}$' then return; end if;
  insert into public.ghadeer_usage(day, page, hits) values (d, pg, 1) on conflict (day, page) do update set hits = public.ghadeer_usage.hits + 1;
  if p_member_id is not null and exists (select 1 from public.members where id = p_member_id and active) then
    insert into public.ghadeer_usage_members(day, page, member_id) values (d, pg, p_member_id) on conflict do nothing;
  end if;
end; $$;
grant execute on function public.track_page(text, bigint) to anon, authenticated;

create or replace function public.manager_usage_stats(p_manager_pin text, p_days integer default 30)
returns jsonb language plpgsql security definer set search_path to 'public', 'extensions', 'pg_temp' as $$
declare since date := (now() at time zone 'Asia/Riyadh')::date - greatest(1, least(coalesce(p_days, 30), 365)) + 1;
begin
  if not public._manager_pin_ok(p_manager_pin) then return jsonb_build_object('success', false, 'message', 'رقم المطور غير صحيح'); end if;
  return jsonb_build_object('success', true, 'since', since,
    'pages', coalesce((select jsonb_agg(x order by x.hits desc) from (
        select u.page, sum(u.hits)::int hits,
          (select count(distinct m.member_id) from public.ghadeer_usage_members m where m.page = u.page and m.day >= since)::int members
        from public.ghadeer_usage u where u.day >= since group by u.page) x), '[]'::jsonb),
    'daily', coalesce((select jsonb_agg(jsonb_build_object('day', day, 'hits', hits) order by day) from (
        select day, sum(hits)::int hits from public.ghadeer_usage where day >= since group by day) d), '[]'::jsonb),
    'members', coalesce((select jsonb_agg(jsonb_build_object(
        'id', m.id, 'name', m.name, 'active', m.active, 'last_seen_at', m.last_seen_at,
        'terms_at', (select max(a.accepted_at) from public.program_acceptances a where a.member_id = m.id),
        'devices', (select count(*) from public.member_device_tokens t where t.member_id = m.id and t.revoked_at is null and (t.expires_at is null or t.expires_at > now())),
        'pages_30d', (select count(distinct um.page) from public.ghadeer_usage_members um where um.member_id = m.id and um.day >= since),
        'has_phone', m.phone is not null) order by m.last_seen_at desc nulls last, m.name)
      from public.members m), '[]'::jsonb));
end; $$;
grant execute on function public.manager_usage_stats(text, integer) to anon, authenticated;
notify pgrst, 'reload schema';
