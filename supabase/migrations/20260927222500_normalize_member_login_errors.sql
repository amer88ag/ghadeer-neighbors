create or replace function public.member_login(p_member_id bigint, p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $function$
declare
  m public.members%rowtype;
  r public.member_permissions%rowtype;
begin
  select * into m
  from public.members
  where id=p_member_id and active=true;

  if not found or m.pin_hash is null or m.pin_hash<>extensions.crypt(p_pin,m.pin_hash) then
    return jsonb_build_object('success',false,'message','الرمز السري غير صحيح');
  end if;

  select * into r from public.member_permissions where member_id=p_member_id;
  update public.members set last_seen_at=now() where id=p_member_id;

  return jsonb_build_object(
    'success',true,
    'member_id',m.id,
    'name',m.name,
    'role',coalesce(r.role,'member')
  );
end;
$function$;

revoke all on function public.member_login(bigint,text) from public;
grant execute on function public.member_login(bigint,text) to anon, authenticated;
