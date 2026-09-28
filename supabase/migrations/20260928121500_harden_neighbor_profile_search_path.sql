-- Harden SECURITY DEFINER profile RPC search_path to match the messaging/rental hardening.
alter function public.save_neighbor_profile(bigint,text,text,text,text,text,text,text,boolean)
  set search_path = public, extensions, pg_temp;
