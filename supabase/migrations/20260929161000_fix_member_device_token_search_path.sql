-- Fix remembered-device authentication functions to resolve pgcrypto helpers.
create or replace function public.issue_member_device_token(p_member_id bigint, p_pin text, p_device_label text default null)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions', 'pg_temp'
as $function$
declare
  v_token text;
  v_id bigint;
begin
  if not coalesce((public.member_login(p_member_id,p_pin)->>'success')::boolean,false) then
    raise exception 'بيانات الدخول غير صحيحة';
  end if;
  v_token:=encode(gen_random_bytes(32),'hex');
  insert into public.member_device_tokens(member_id,token_hash,device_label)
  values(p_member_id,crypt(v_token,gen_salt('bf')),left(nullif(trim(p_device_label),''),120))
  returning id into v_id;
  return jsonb_build_object('success',true,'device_id',v_id,'token',v_token,'expires_at',now()+interval '90 days');
end;
$function$;

create or replace function public.member_login_by_device_token(p_token text)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions', 'pg_temp'
as $function$
declare
  d public.member_device_tokens%rowtype;
  m public.members%rowtype;
begin
  if nullif(trim(p_token),'') is null then
    return jsonb_build_object('success',false,'reason','missing_token');
  end if;
  select * into d
  from public.member_device_tokens
  where revoked_at is null
    and expires_at>now()
    and token_hash=crypt(p_token,token_hash)
  order by last_seen_at desc
  limit 1;
  if not found then
    return jsonb_build_object('success',false,'reason','invalid_or_expired_device');
  end if;
  update public.member_device_tokens set last_seen_at=now() where id=d.id;
  select * into m from public.members where id=d.member_id and active=true;
  if not found then
    return jsonb_build_object('success',false,'reason','inactive_member');
  end if;
  return jsonb_build_object('success',true,'member_id',m.id,'name',m.name,'device_id',d.id,'expires_at',d.expires_at);
end;
$function$;
