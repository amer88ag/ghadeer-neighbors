-- جيران حي الغدير — إصلاح دوال المدير للمناسبات وتكاليف الطلعة.
-- كانت تفشل دائمًا بـ "function crypt(text, text) does not exist" لأن search_path لا يتضمن extensions.
alter function public.manager_add_event_expense(text,bigint,bigint,text,numeric,text) set search_path = public, extensions, pg_temp;
alter function public.manager_create_neighborhood_event(text,text,text,date,time without time zone,text,text,bigint,bigint,text,text,numeric) set search_path = public, extensions, pg_temp;
alter function public.manager_set_event_participant(text,bigint,bigint,text,numeric,numeric) set search_path = public, extensions, pg_temp;
alter function public.manager_set_outing_cost_breakdown(text,bigint,numeric,numeric,numeric,text) set search_path = public, extensions, pg_temp;
