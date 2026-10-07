-- Central PIN verification phase: first call path converted to non-throwing auth failure.
-- ROLLBACK: restore issue_member_device_token to its prior raise-exception branch.
create or replace function public.issue_member_device_token(p_member_id bigint,p_pin text,p_device_label text default null)
returns jsonb language plpgsql security definer
set search_path to 'public','extensions','pg_temp'
as $$
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
