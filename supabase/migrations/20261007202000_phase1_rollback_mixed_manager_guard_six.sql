-- Phase 1 safety rollback: mixed manager/supervisor functions.
-- These six functions accept a supervisor PIN in p_manager_pin.
-- The central manager-only guard must NOT run before their own manager/supervisor
-- authorization because it would reject valid supervisor calls and increment
-- the manager lock counter.
--
-- This migration restores each current function definition by removing only
-- the Phase-1 _manager_pin_ok(p_manager_pin) pre-check. It preserves the
-- existing signatures, defaults, permissions, and supervisor authorization.
do $rollback$
declare
  r record;
  v_guard text := E'\n  if not public._manager_pin_ok(p_manager_pin) then\n    return jsonb_build_object(\'success\', false, \'message\', \'الرقم السري غير صحيح أو الحساب مقفل مؤقتًا\');\n  end if;\n';
begin
  for r in
    select p.oid, pg_get_functiondef(p.oid) as def
    from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public'
      and p.proname in (
        'manager_update_coffee_assignment',
        'manager_swap_coffee_dates',
        'manager_update_outing_assignment',
        'manager_swap_outing_dates',
        'manager_set_member_pin',
        'manager_randomize_outing_plan'
      )
      and pg_get_function_arguments(p.oid) ilike '%p_manager_pin%'
  loop
    if position(v_guard in r.def) = 0 then
      raise exception 'Expected Phase-1 mixed-function guard not found in %', r.oid;
    end if;
    execute replace(r.def, v_guard, '');
  end loop;
end
$rollback$;
