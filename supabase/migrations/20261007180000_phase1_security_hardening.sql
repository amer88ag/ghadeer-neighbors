create table if not exists public.login_attempt_limits (
  key text primary key,
  failed_count integer not null default 0,
  window_started_at timestamptz not null default now(),
  locked_until timestamptz
);

alter table public.login_attempt_limits enable row level security;
revoke all on public.login_attempt_limits from anon, authenticated;

drop function if exists public.accept_program_terms(bigint,text,text,text);

create or replace function public.accept_program_terms(
  p_member_id bigint,p_member_name text,p_version text,
  p_user_agent text default null,p_pin text default null
) returns jsonb
language plpgsql security definer
set search_path to 'public','extensions','pg_temp'
as $$
declare v_member public.members%rowtype;
begin
  select * into v_member from public.members where id=p_member_id and active=true;
  if not found or p_pin is null or v_member.pin_hash is null
     or v_member.pin_hash <> extensions.crypt(p_pin,v_member.pin_hash)
     or lower(btrim(coalesce(p_member_name,''))) <> lower(btrim(v_member.name))
  then return jsonb_build_object('success',false,'message','تعذر تسجيل الموافقة.'); end if;
  insert into public.program_acceptances(member_id,member_name,version,user_agent)
  values(v_member.id,v_member.name,p_version,p_user_agent)
  on conflict(member_id,version) do update set accepted_at=now(),user_agent=excluded.user_agent;
  return jsonb_build_object('success',true);
end $$;

create or replace function public.member_login(p_member_id bigint,p_pin text)
returns jsonb language plpgsql security definer
set search_path to 'public','extensions','pg_temp'
as $$
declare m public.members%rowtype; r public.member_permissions%rowtype;
v_key text := 'member:'||p_member_id::text; v_limit public.login_attempt_limits%rowtype;
begin
 perform pg_advisory_xact_lock(hashtext(v_key));
 select * into v_limit from public.login_attempt_limits where key=v_key for update;
 if v_limit.locked_until is not null and v_limit.locked_until>now()
 then return jsonb_build_object('success',false,'message','محاولات كثيرة. حاول لاحقًا.'); end if;
 select * into m from public.members where id=p_member_id and active=true;
 if not found or m.pin_hash is null or m.pin_hash<>extensions.crypt(p_pin,m.pin_hash) then
   insert into public.login_attempt_limits(key,failed_count,window_started_at,locked_until)
   values(v_key,1,now(),null)
   on conflict(key) do update set
    failed_count=case when public.login_attempt_limits.window_started_at<now()-interval '15 minutes' then 1 else public.login_attempt_limits.failed_count+1 end,
    window_started_at=case when public.login_attempt_limits.window_started_at<now()-interval '15 minutes' then now() else public.login_attempt_limits.window_started_at end,
    locked_until=case when public.login_attempt_limits.window_started_at<now()-interval '15 minutes' then null when public.login_attempt_limits.failed_count+1>=8 then now()+interval '15 minutes' else public.login_attempt_limits.locked_until end;
   return jsonb_build_object('success',false,'message','الرمز السري غير صحيح');
 end if;
 delete from public.login_attempt_limits where key=v_key;
 select * into r from public.member_permissions where member_id=p_member_id;
 update public.members set last_seen_at=now() where id=p_member_id;
 return jsonb_build_object('success',true,'member_id',m.id,'name',m.name,'role',coalesce(r.role,'member'));
end $$;

create or replace function public.manager_pin_login(p_pin text)
returns jsonb language plpgsql security definer
set search_path to 'public','extensions','pg_temp'
as $$
declare v_key text:='manager'; v_limit public.login_attempt_limits%rowtype; v_ok boolean;
begin
 perform pg_advisory_xact_lock(hashtext(v_key));
 select * into v_limit from public.login_attempt_limits where key=v_key for update;
 if v_limit.locked_until is not null and v_limit.locked_until>now()
 then return jsonb_build_object('success',false,'message','محاولات كثيرة. حاول لاحقًا.'); end if;
 select exists(select 1 from public.app_settings where key='manager_pin' and value=extensions.crypt(p_pin,value)) into v_ok;
 if not v_ok then
   insert into public.login_attempt_limits(key,failed_count,window_started_at,locked_until)
   values(v_key,1,now(),null)
   on conflict(key) do update set
    failed_count=case when public.login_attempt_limits.window_started_at<now()-interval '15 minutes' then 1 else public.login_attempt_limits.failed_count+1 end,
    window_started_at=case when public.login_attempt_limits.window_started_at<now()-interval '15 minutes' then now() else public.login_attempt_limits.window_started_at end,
    locked_until=case when public.login_attempt_limits.window_started_at<now()-interval '15 minutes' then null when public.login_attempt_limits.failed_count+1>=8 then now()+interval '15 minutes' else public.login_attempt_limits.locked_until end;
   return jsonb_build_object('success',false);
 end if;
 delete from public.login_attempt_limits where key=v_key;
 return jsonb_build_object('success',true,'role','super_admin');
end $$;