-- Restore the member acceptance RPC grant required by the production member flow.
-- The function remains SECURITY DEFINER and validates the member identity server-side.
grant execute on function public.accept_program_terms(bigint,text,text,text) to anon;
grant execute on function public.accept_program_terms(bigint,text,text,text) to authenticated;
