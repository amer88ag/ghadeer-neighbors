drop policy if exists "ghadeer admin manage coffee" on public.coffee_schedule;
create policy "ghadeer admin insert coffee" on public.coffee_schedule for insert to authenticated with check (is_app_admin());
create policy "ghadeer admin update coffee" on public.coffee_schedule for update to authenticated using (is_app_admin()) with check (is_app_admin());
create policy "ghadeer admin delete coffee" on public.coffee_schedule for delete to authenticated using (is_app_admin());

drop policy if exists "ghadeer admin manage members" on public.members;
create policy "ghadeer admin insert members" on public.members for insert to authenticated with check (is_app_admin());
create policy "ghadeer admin update members" on public.members for update to authenticated using (is_app_admin()) with check (is_app_admin());
create policy "ghadeer admin delete members" on public.members for delete to authenticated using (is_app_admin());

drop policy if exists "ghadeer admin manage outings" on public.outings_schedule;
create policy "ghadeer admin insert outings" on public.outings_schedule for insert to authenticated with check (is_app_admin());
create policy "ghadeer admin update outings" on public.outings_schedule for update to authenticated using (is_app_admin()) with check (is_app_admin());
create policy "ghadeer admin delete outings" on public.outings_schedule for delete to authenticated using (is_app_admin());
