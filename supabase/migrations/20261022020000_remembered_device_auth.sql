-- «تذكّر هذا الجهاز» دون إعادة الرقم السري: يقبل التحقق رمز الجهاز المحفوظ (بالصيغة dt:<token>) بدل الرقم السري.
-- الرمز عشوائي (64 خانة)، مخزّن مشفّرًا في member_device_tokens، صالح 90 يومًا، ويُلغى بتسجيل الخروج أو بتغيير الرقم
-- السري أو من لوحة المطور. لا يقبل رمز الجهاز في: تغيير الرقم السري، وإصدار رمز جهاز جديد.

-- نسخة احتياطية من تعريفات الدوال قبل التعديل (للاسترجاع عند الحاجة).
create table if not exists public.fn_backup_20261022 as
select p.proname, pg_get_function_identity_arguments(p.oid) args, pg_get_functiondef(p.oid) def, now() saved_at
from pg_proc p join pg_namespace s on s.oid = p.pronamespace
where s.nspname = 'public' and p.prokind = 'f' and (pg_get_functiondef(p.oid) ~ 'pin_hash' or p.proname in ('member_login','issue_member_device_token'));
alter table public.fn_backup_20261022 enable row level security;
revoke all on public.fn_backup_20261022 from anon, authenticated;

create or replace function public._pin_ok(p_member_id bigint, p_pin text, p_hash text) returns boolean
language plpgsql stable security definer set search_path = public, extensions, pg_temp as $$
begin
  if p_pin is null or p_member_id is null then return false; end if;
  if left(p_pin, 3) = 'dt:' then
    return length(p_pin) > 20 and exists (
      select 1 from public.member_device_tokens d join public.members m on m.id = d.member_id and m.active
      where d.member_id = p_member_id and d.revoked_at is null and d.expires_at > now() and d.token_hash = extensions.crypt(substr(p_pin, 4), d.token_hash));
  end if;
  return p_hash is not null and p_hash = extensions.crypt(p_pin, p_hash);
end $$;
revoke execute on function public._pin_ok(bigint, text, text) from public, anon, authenticated;

-- دخول العضو: يقبل الرقم السري أو رمز الجهاز. فشل رمز الجهاز لا يُحسب محاولة خاطئة (حتى لا يُقفل الحساب برمز قديم).
create or replace function public.member_login(p_member_id bigint, p_pin text)
 returns jsonb language plpgsql security definer set search_path to 'public', 'extensions', 'pg_temp' as $function$
declare m public.members%rowtype; r public.member_permissions%rowtype;
v_key text := 'member:'||p_member_id::text; v_limit public.login_attempt_limits%rowtype;
v_next_lock integer;
begin
 perform pg_advisory_xact_lock(hashtext(v_key));
 select * into v_limit from public.login_attempt_limits where key=v_key for update;
 if v_limit.locked_until is not null and v_limit.locked_until>now()
 then return jsonb_build_object('success',false,'message','محاولات كثيرة. حاول لاحقًا.'); end if;
 select * into m from public.members where id=p_member_id and active=true;
 if left(coalesce(p_pin, ''), 3) = 'dt:' then
   if not found or not public._pin_ok(p_member_id, p_pin, m.pin_hash) then
     return jsonb_build_object('success',false,'message','انتهت صلاحية حفظ الجهاز. سجّل الدخول برقمك السري.','reason','device');
   end if;
 elsif not found or m.pin_hash is null or m.pin_hash<>extensions.crypt(p_pin,m.pin_hash) then
   insert into public.login_attempt_limits(key,failed_count,window_started_at,locked_until,lock_count)
   values(v_key,1,now(),null,0)
   on conflict(key) do update set
    failed_count=case when public.login_attempt_limits.window_started_at<now()-interval '15 minutes' then 1 else public.login_attempt_limits.failed_count+1 end,
    window_started_at=case when public.login_attempt_limits.window_started_at<now()-interval '15 minutes' then now() else public.login_attempt_limits.window_started_at end;
   select * into v_limit from public.login_attempt_limits where key=v_key;
   if v_limit.failed_count>=8 then
     v_next_lock:=least(v_limit.lock_count+1,3);
     update public.login_attempt_limits set lock_count=v_next_lock,
       locked_until=now()+case v_next_lock when 1 then interval '15 minutes' when 2 then interval '1 hour' else interval '1 day' end
       where key=v_key;
   end if;
   return jsonb_build_object('success',false,'message','الرمز السري غير صحيح');
 end if;
 if left(coalesce(p_pin, ''), 3) <> 'dt:' then delete from public.login_attempt_limits where key=v_key; end if;
 select * into r from public.member_permissions where member_id=p_member_id;
 update public.members set last_seen_at=now() where id=p_member_id;
 return jsonb_build_object('success',true,'member_id',m.id,'name',m.name,'role',coalesce(r.role,'member'));
end $function$;

-- إصدار رمز جهاز جديد يتطلب الرقم السري الحقيقي.
create or replace function public.issue_member_device_token(p_member_id bigint, p_pin text, p_device_label text default null)
 returns jsonb language plpgsql security definer set search_path to 'public', 'extensions', 'pg_temp' as $function$
declare v_token text; v_id bigint;
begin
  if left(coalesce(p_pin, ''), 3) = 'dt:' or not coalesce((public.member_login(p_member_id,p_pin)->>'success')::boolean,false) then
    return jsonb_build_object('success',false,'message','بيانات الدخول غير صحيحة');
  end if;
  v_token:=encode(gen_random_bytes(32),'hex');
  insert into public.member_device_tokens(member_id,token_hash,device_label)
  values(p_member_id,crypt(v_token,gen_salt('bf')),left(nullif(trim(p_device_label),''),120))
  returning id into v_id;
  return jsonb_build_object('success',true,'device_id',v_id,'token',v_token,'expires_at',now()+interval '90 days');
end $function$;

-- الدوال التي تتحقق من الرقم السري مباشرة بمقارنة pin_hash تُحوَّل لاستخدام _pin_ok (نفس السلوك + قبول رمز الجهاز).
do $rewrite$
declare f record; def text; nd text; n int := 0;
begin
  for f in
    select p.oid, p.proname, pg_get_functiondef(p.oid) d from pg_proc p join pg_namespace s on s.oid = p.pronamespace
    where s.nspname = 'public' and p.prokind = 'f' and pg_get_functiondef(p.oid) ~ 'crypt\(\s*[a-z_]+\s*,\s*([a-z_]+\.)?pin_hash\s*\)'
      and p.proname not in ('member_login', '_pin_ok', 'member_change_own_pin', 'manager_set_member_pin', 'manager_reset_member_pin_from_request',
                            'revoke_devices_on_pin_change', 'manager_export_backup', 'manager_restore_backup', 'manager_restore_baseline', 'issue_member_device_token')
  loop
    def := f.d;
    nd := regexp_replace(def, 'extensions\.crypt\(\s*([a-z_]+)\s*,\s*([a-z_]+\.)?pin_hash\s*\)\s*<>\s*([a-z_]+\.)?pin_hash', 'not public._pin_ok(\2id, \1, \2pin_hash)', 'g');
    nd := regexp_replace(nd, 'extensions\.crypt\(\s*([a-z_]+)\s*,\s*([a-z_]+\.)?pin_hash\s*\)\s*=\s*([a-z_]+\.)?pin_hash', 'public._pin_ok(\2id, \1, \2pin_hash)', 'g');
    nd := regexp_replace(nd, '([a-z_]+\.)?pin_hash\s*<>\s*extensions\.crypt\(\s*([a-z_]+)\s*,\s*([a-z_]+\.)?pin_hash\s*\)', 'not public._pin_ok(\1id, \2, \1pin_hash)', 'g');
    nd := regexp_replace(nd, '([a-z_]+\.)?pin_hash\s*=\s*extensions\.crypt\(\s*([a-z_]+)\s*,\s*([a-z_]+\.)?pin_hash\s*\)', 'public._pin_ok(\1id, \2, \1pin_hash)', 'g');
    if nd <> def then execute nd; n := n + 1; end if;
  end loop;
  raise notice 'rewritten % functions', n;
end $rewrite$;
