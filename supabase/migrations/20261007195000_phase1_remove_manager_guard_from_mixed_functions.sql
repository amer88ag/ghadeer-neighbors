-- Phase 1: remove manager-only guard from functions that accept supervisor PINs.
-- Mixed authorization functions intentionally retain their existing manager-or-supervisor
-- authorization path. Do not replace with _manager_pin_ok, because that would count
-- valid supervisor attempts against the manager throttle.
--
-- Applied to the live Supabase project in one transaction.
-- No signatures or grants are changed.

begin;

do $migration$
declare
  r record;
  v_guard text := E'\n  if not public._manager_pin_ok(p_manager_pin) then\n    return jsonb_build_object(\'success\', false, \'message\', \'الرقم السري غير صحيح أو الحساب مقفل مؤقتًا\');\n  end if;';
  v_new text;
begin
  for r in
    select p.oid, p.proname, pg_get_functiondef(p.oid) as def
    from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public'
      and (
        (p.proname='manager_add_member'
         and pg_get_function_identity_arguments(p.oid) =
             'p_manager_pin text, p_name text, p_phone text, p_notes text, p_member_pin text')
        or p.proname in (
          'manager_delete_member',
          'manager_randomize_outings',
          'manager_update_member_profile'
        )
      )
  loop
    if position(v_guard in r.def)=0 then
      raise exception 'Expected manager guard not found in %.%', r.proname, r.oid;
    end if;

    v_new := replace(r.def, v_guard, '');

    if v_new = r.def then
      raise exception 'No change produced for %.%', r.proname, r.oid;
    end if;

    execute v_new;
  end loop;
end
$migration$;

commit;
