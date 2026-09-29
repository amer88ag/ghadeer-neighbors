-- Ghadeer security hardening: protect event/outing data tables at the table layer.
-- Public reads/writes are intentionally routed through SECURITY DEFINER RPCs that
-- validate the manager/member PIN and role. No direct client table policies are
-- granted here, so direct PostgREST access remains denied while approved RPCs continue.
alter table public.neighborhood_events enable row level security;
alter table public.event_participants enable row level security;
alter table public.event_expenses enable row level security;
alter table public.outing_reviews enable row level security;
