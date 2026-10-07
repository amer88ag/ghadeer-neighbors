-- Phase 1 follow-up: preserve released-client compatibility and strengthen throttling.
--
-- ROLLBACK PLAN:
-- 1) Restore the previous login_attempt_limits definition by dropping lock_count,
--    then restore member_login and manager_pin_login from 20261007180000.
-- 2) Drop the temporary four-argument accept_program_terms compatibility function.
-- 3) Restore manager_set_manager_pin's previous minimum-length check.
-- 4) Full Phase-1 rollback: restore the pre-Phase-1 accept_program_terms function
--    and drop login_attempt_limits.
-- No application data tables are deleted by this migration.

alter table public.login_attempt_limits add column if not exists lock_count integer not null default 0;

create or replace function public.accept_program_terms(p_member_id bigint,p_member_name text,p_version text,p_user_agent text)
returns jsonb language plpgsql security definer set search_path to 'public','extensions','pg_temp' as $$
begin return jsonb_build_object('success',false,'message','تحديث الصفحة مطلوب قبل تسجيل الموافقة.'); end $$;

-- Login throttling: 8 failures -> 15m, next lock -> 1h, subsequent -> 1d.
create or replace function public.member_login(p_member_id bigint,p_pin text)
returns jsonb language plpgsql security definer set search_path to 'public','extensions','pg_temp' as $$
declare m public.members%rowtype; r public.member_permissions%rowtype;
v_key text := 'member:'||p_member_id::text; v_limit public.login_attempt_limits%rowtype; v_next_lock integer;
begin
 perform pg_advisory_xact_lock(hashtext(v_key));
 select * into v_limit from public.login_attempt_limits where key=v_key for update;
 if v_limit.locked_until is not null and v_limit.locked_until>now() then return jsonb_build_object('success',false,'message','محاولات كثيرة. حاول لاحقًا.'); end if;
 select * into m from public.members where id=p_member_id and active=true;
 if not found or m.pin_hash is null or m.pin_hash<>extensions.crypt(p_pin,m.pin_hash) then
  insert into public.login_attempt_limits(key,failed_count,window_started_at,locked_until,lock_count) values(v_key,1,now(),null,0)
  on conflict(key) do update set failed_count=case when public.login_attempt_limits.window_started_at<now()-interval '15 minutes' then 1 else public.login_attempt_limits.failed_count+1 end,window_started_at=case when public.login_attempt_limits.window_started_at<now()-interval '15 minutes' then now() else public.login_attempt_limits.window_started_at end;
  select * into v_limit from public.login_attempt_limits where key=v_key;
  if v_limit.failed_count>=8 then v_next_lock:=least(v_limit.lock_count+1,3); update public.login_attempt_limits set lock_count=v_next_lock,locked_until=now()+case v_next_lock when 1 then interval '15 minutes' when 2 then interval '1 hour' else interval '1 day' end where key=v_key; end if;
  return jsonb_build_object('success',false,'message','الرمز السري غير صحيح');
 end if;
 delete from public.login_attempt_limits where key=v_key;
 select * into r from public.member_permissions where member_id=p_member_id;
 update public.members set last_seen_at=now() where id=p_member_id;
 return jsonb_build_object('success',true,'member_id',m.id,'name',m.name,'role',coalesce(r.role,'member'));
end $$;

create or replace function public.manager_pin_login(p_pin text)
returns jsonb language plpgsql security definer set search_path to 'public','extensions','pg_temp' as $$
declare v_key text:='manager'; v_limit public.login_attempt_limits%rowtype; v_ok boolean; v_next_lock integer;
begin
 perform pg_advisory_xact_lock(hashtext(v_key));
 select * into v_limit from public.login_attempt_limits where key=v_key for update;
 if v_limit.locked_until is not null and v_limit.locked_until>now() then return jsonb_build_object('success',false,'message','محاولات كثيرة. حاول لاحقًا.'); end if;
 select exists(select 1 from public.app_settings where key='manager_pin' and value=extensions.crypt(p_pin,value)) into v_ok;
 if not v_ok then
  insert into public.login_attempt_limits(key,failed_count,window_started_at,locked_until,lock_count) values(v_key,1,now(),null,0)
  on conflict(key) do update set failed_count=case when public.login_attempt_limits.window_started_at<now()-interval '15 minutes' then 1 else public.login_attempt_limits.failed_count+1 end,window_started_at=case when public.login_attempt_limits.window_started_at<now()-interval '15 minutes' then now() else public.login_attempt_limits.window_started_at end;
  select * into v_limit from public.login_attempt_limits where key=v_key;
  if v_limit.failed_count>=8 then v_next_lock:=least(v_limit.lock_count+1,3); update public.login_attempt_limits set lock_count=v_next_lock,locked_until=now()+case v_next_lock when 1 then interval '15 minutes' when 2 then interval '1 hour' else interval '1 day' end where key=v_key; end if;
  return jsonb_build_object('success',false);
 end if;
 delete from public.login_attempt_limits where key=v_key;
 return jsonb_build_object('success',true,'role','super_admin');
end $$;

create or replace function public.manager_set_manager_pin(p_current_pin text,p_new_pin text)
returns jsonb language plpgsql security definer set search_path to 'public','extensions' as $$
begin
 if not exists(select 1 from public.app_settings where key='manager_pin' and value=extensions.crypt(p_current_pin,value)) then raise exception 'الرقم السري الحالي غير صحيح'; end if;
 if p_new_pin is null or trim(p_new_pin) !~ '^[0-9]{6,12}$' then raise exception 'الرقم السري الجديد يجب أن يكون من 6 إلى 12 رقمًا'; end if;
 update public.app_settings set value=extensions.crypt(trim(p_new_pin),extensions.gen_salt('bf')),updated_at=now() where key='manager_pin';
 return jsonb_build_object('success',true);
end $$;

-- Central PIN verification phase: issue_member_device_token must not raise after auth failure.
-- ROLLBACK: restore its previous raise-exception branch.
create or replace function public.issue_member_device_token(p_member_id bigint,p_pin text,p_device_label text default null)
returns jsonb language plpgsql security definer
set search_path to 'public','extensions','pg_temp' as $$
declare v_token text; v_id bigint;
begin
  if not coalesce((public.member_login(p_member_id,p_pin)->>'success')::boolean,false) then
    return jsonb_build_object('success',false,'message','بيانات الدخول غير صحيحة');
  end if;
  v_token:=encode(gen_random_bytes(32),'hex');
  insert into public.member_device_tokens(member_id,token_hash,device_label)
  values(p_member_id,crypt(v_token,gen_salt('bf')),left(nullif(trim(p_device_label),''),120))
  returning id into v_id;
  return jsonb_build_object('success',true,'device_id',v_id,'token',v_token,'expires_at',now()+interval '90 days');
end $$;

revoke execute on function public.member_login(bigint,text) from anon, authenticated;
revoke execute on function public.manager_pin_login(text) from anon, authenticated;
