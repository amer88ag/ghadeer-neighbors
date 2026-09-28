drop policy if exists "admin manage coffee" on public.coffee_schedule;
drop policy if exists "admin write coffee" on public.coffee_schedule;
drop policy if exists "admin delete coffee" on public.coffee_schedule;
drop policy if exists "admin insert coffee" on public.coffee_schedule;
drop policy if exists "admin update coffee" on public.coffee_schedule;
create policy "ghadeer admin manage coffee" on public.coffee_schedule for all to authenticated using (is_app_admin()) with check (is_app_admin());

drop policy if exists "admin manage members" on public.members;
drop policy if exists "admin write members" on public.members;
drop policy if exists "admin delete members" on public.members;
drop policy if exists "admin insert members" on public.members;
drop policy if exists "admin update members" on public.members;
create policy "ghadeer admin manage members" on public.members for all to authenticated using (is_app_admin()) with check (is_app_admin());

drop policy if exists "admin manage outings" on public.outings_schedule;
drop policy if exists "admin write outings" on public.outings_schedule;
drop policy if exists "admin delete outings" on public.outings_schedule;
drop policy if exists "admin insert outings" on public.outings_schedule;
drop policy if exists "admin update outings" on public.outings_schedule;
create policy "ghadeer admin manage outings" on public.outings_schedule for all to authenticated using (is_app_admin()) with check (is_app_admin());
