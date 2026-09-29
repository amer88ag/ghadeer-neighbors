-- جيران حي الغدير بالمحالة
-- Member PIN recovery: request -> manager verification -> secure PIN reset.
create or replace function public.request_member_pin_reset(
  p_member_id bigint,
  p_name text,
  p_phone text default null
) returns jsonb
language plpgsql
security definer
set search_path to 'public','extensions','pg_temp'
as $$
declare
  v_member public.members%rowtype;
  v_existing bigint;
begin
  select * into v_member from public.members where id=p_member_id and active=true;
  if not found then
    return jsonb_build_object('success',true,'message','إذا كانت البيانات مطابقة، تم تسجيل طلب الاستعادة للمراجعة.');
  end if;
  if lower(btrim(coalesce(p_name,''))) <> lower(btrim(v_member.name)) then
    return jsonb_build_object('success',true,'message','إذا كانت البيانات مطابقة، تم تسجيل طلب الاستعادة للمراجعة.');
  end if;
  if v_member.phone is not null and btrim(v_member.phone) <> '' and (p_phone is null or btrim(p_phone) <> btrim(v_member.phone)) then
    return jsonb_build_object('success',true,'message','إذا كانت البيانات مطابقة، تم تسجيل طلب الاستعادة للمراجعة.');
  end if;
  select id into v_existing from public.account_support_requests
  where member_id=v_member.id and request_type='password_reset'
    and status in ('open','pending','in_review')
    and created_at > now() - interval '30 minutes'
  order by created_at desc limit 1;
  if v_existing is not null then
    return jsonb_build_object('success',true,'message','يوجد طلب استعادة مفتوح بالفعل وسيتم مراجعته.');
  end if;
  insert into public.account_support_requests(member_id,user_id,full_name,phone,request_type,status,assigned_role,metadata)
  values(v_member.id,null,v_member.name,nullif(btrim(p_phone),''),'password_reset','open','manager',jsonb_build_object('source','member_pin_recovery'));
  insert into public.account_security_audit_log(user_id,action,success,metadata)
  values(null,'member_pin_reset_requested',true,jsonb_build_object('member_id',v_member.id));
  return jsonb_build_object('success',true,'message','تم تسجيل طلب استعادة الرقم السري للمراجعة.');
end;
$$;

create or replace function public.manager_get_pin_reset_requests(p_manager_pin text) returns jsonb
language plpgsql security definer set search_path to 'public','extensions','pg_temp' as $$
begin
  if not exists(select 1 from public.app_settings where key='manager_pin' and value=extensions.crypt(p_manager_pin,value)) then raise exception 'غير مصرح'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'member_id',r.member_id,'full_name',r.full_name,'phone',r.phone,'status',r.status,'created_at',r.created_at) order by r.created_at desc)
    from public.account_support_requests r where r.request_type='password_reset' and r.status in ('open','pending','in_review')), '[]'::jsonb);
end;
$$;

create or replace function public.manager_reset_member_pin_from_request(p_manager_pin text,p_request_id bigint,p_new_pin text) returns jsonb
language plpgsql security definer set search_path to 'public','extensions','pg_temp' as $$
declare v_request public.account_support_requests%rowtype; v_member public.members%rowtype;
begin
  if not exists(select 1 from public.app_settings where key='manager_pin' and value=extensions.crypt(p_manager_pin,value)) then raise exception 'غير مصرح'; end if;
  if p_new_pin is null or btrim(p_new_pin) !~ '^[0-9]{4,12}$' then raise exception 'الرقم السري يجب أن يكون من 4 إلى 12 رقمًا'; end if;
  select * into v_request from public.account_support_requests where id=p_request_id and request_type='password_reset' and status in ('open','pending','in_review');
  if not found then raise exception 'طلب الاستعادة غير موجود أو مغلق'; end if;
  select * into v_member from public.members where id=v_request.member_id and active=true;
  if not found then raise exception 'العضو غير موجود أو غير نشط'; end if;
  update public.members set pin_hash=extensions.crypt(btrim(p_new_pin),extensions.gen_salt('bf')) where id=v_member.id;
  update public.account_support_requests set status='closed',closed_at=now(),updated_at=now(),metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object('resolved_by','manager','resolved_at',now()) where id=v_request.id;
  insert into public.account_security_audit_log(user_id,action,success,metadata) values(null,'member_pin_reset_by_manager',true,jsonb_build_object('request_id',v_request.id,'member_id',v_member.id));
  return jsonb_build_object('success',true,'message','تم تغيير الرقم السري وإغلاق طلب الاستعادة.');
end;
$$;

revoke all on function public.request_member_pin_reset(bigint,text,text) from public, anon, authenticated;
grant execute on function public.request_member_pin_reset(bigint,text,text) to anon, authenticated;
revoke all on function public.manager_get_pin_reset_requests(text) from public, anon, authenticated;
grant execute on function public.manager_get_pin_reset_requests(text) to anon, authenticated;
revoke all on function public.manager_reset_member_pin_from_request(text,bigint,text) from public, anon, authenticated;
grant execute on function public.manager_reset_member_pin_from_request(text,bigint,text) to anon, authenticated;
