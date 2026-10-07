-- Phase 1: central manager guard for the two anon-executable manager PIN mutators.
-- manager_set_manager_pin guards p_current_pin.
-- manager_set_neighbor_profiles_enabled guards p_pin.
-- No signatures or grants are changed.

begin;

create or replace function public.manager_set_manager_pin(p_current_pin text,p_new_pin text)
returns jsonb language plpgsql security definer set search_path to 'public','extensions' as $function$
begin
  if not public._manager_pin_ok(p_current_pin) then
    return jsonb_build_object('success', false, 'message', 'الرقم السري غير صحيح أو الحساب مقفل مؤقتًا');
  end if;
  if not exists(select 1 from public.app_settings where key='manager_pin' and value=extensions.crypt(p_current_pin,value))
  then raise exception 'الرقم السري الحالي غير صحيح'; end if;
  if p_new_pin is null or trim(p_new_pin) !~ '^[0-9]{6,12}$'
  then raise exception 'الرقم السري الجديد يجب أن يكون من 6 إلى 12 رقمًا'; end if;
  update public.app_settings set value=extensions.crypt(trim(p_new_pin),extensions.gen_salt('bf')),updated_at=now() where key='manager_pin';
  return jsonb_build_object('success',true);
end $function$;

create or replace function public.manager_set_neighbor_profiles_enabled(p_pin text, p_enabled boolean)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare v_ok boolean;
begin
  if not public._manager_pin_ok(p_pin) then
    return jsonb_build_object('success', false, 'message', 'الرقم السري غير صحيح أو الحساب مقفل مؤقتًا');
  end if;
  select exists(select 1 from public.app_settings where manager_pin = extensions.crypt(p_pin, manager_pin)) into v_ok;
  if not v_ok then return jsonb_build_object('success',false,'error','رمز المدير غير صحيح'); end if;
  update public.app_settings set neighbor_profiles_enabled=p_enabled;
  return jsonb_build_object('success',true,'enabled',p_enabled);
end; $function$;

commit;
