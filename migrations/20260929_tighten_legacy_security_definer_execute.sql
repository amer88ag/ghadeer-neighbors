-- جيران حي الغدير بالمحالة
-- Security hardening: remove public API execution from legacy SECURITY DEFINER functions
-- that do not perform their own caller authentication.
-- Verified against production logs before applying.
revoke execute on function public.accept_program_terms(bigint,text,text,text) from anon, authenticated;
revoke execute on function public.revoke_all_member_devices(bigint) from anon, authenticated;
revoke execute on function public.revoke_member_device(bigint,bigint) from anon, authenticated;
