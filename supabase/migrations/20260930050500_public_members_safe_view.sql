-- Public member directory must not expose phone, notes, PIN hashes, or last-seen data.
create view public.public_members with (security_barrier = true) as
select id, name, active
from public.members
where active = true;

revoke all on public.public_members from public;
grant select on public.public_members to anon, authenticated;
