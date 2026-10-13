-- Join requests for Ghadeer Neighbors. Additive migration: does not modify existing member records.
create table if not exists public.ghadeer_join_requests (
  id bigint generated always as identity primary key,
  full_name text not null check (char_length(trim(full_name)) between 3 and 120),
  phone text not null check (char_length(regexp_replace(phone, '\\D', '', 'g')) between 9 and 15),
  address text not null check (char_length(trim(address)) between 3 and 240),
  occupation text,
  note text,
  terms_version text not null,
  terms_accepted_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending','processed','declined')),
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  processed_by text
);
create index if not exists ghadeer_join_requests_pending_idx
  on public.ghadeer_join_requests(status, created_at desc);
alter table public.ghadeer_join_requests enable row level security;
revoke all on public.ghadeer_join_requests from public, anon, authenticated;

create or replace function public.submit_ghadeer_join_request(
  p_full_name text, p_phone text, p_address text, p_occupation text, p_note text, p_terms_version text
) returns jsonb
language plpgsql security definer set search_path to 'public','extensions','pg_temp' as $$
declare clean_phone text := regexp_replace(coalesce(p_phone,''), '\\D', '', 'g');
begin
  if char_length(trim(coalesce(p_full_name,''))) not between 3 and 120 then
    return jsonb_build_object('success',false,'message','يرجى إدخال الاسم الكامل.');
  end if;
  if char_length(clean_phone) not between 9 and 15 then
    return jsonb_build_object('success',false,'message','يرجى إدخال رقم جوال صحيح.');
  end if;
  if char_length(trim(coalesce(p_address,''))) not between 3 and 240 then
    return jsonb_build_object('success',false,'message','يرجى إدخال الحي أو العنوان.');
  end if;
  if coalesce(trim(p_terms_version),'') <> '1.0' then
    return jsonb_build_object('success',false,'message','إصدار الشروط غير صحيح. حدّث الصفحة وحاول مجددًا.');
  end if;
  if exists (select 1 from public.ghadeer_join_requests r
             where regexp_replace(r.phone, '\\D', '', 'g') = clean_phone and r.status = 'pending'
               and r.created_at > now() - interval '30 days') then
    return jsonb_build_object('success',false,'message','يوجد طلب انضمام قيد المراجعة بهذا الرقم.');
  end if;
  insert into public.ghadeer_join_requests(full_name,phone,address,occupation,note,terms_version)
  values (trim(p_full_name),clean_phone,trim(p_address),nullif(trim(coalesce(p_occupation,'')),''),nullif(trim(coalesce(p_note,'')),''),p_terms_version);
  return jsonb_build_object('success',true,'message','تم استلام طلبك بنجاح.');
end; $$;
revoke all on function public.submit_ghadeer_join_request(text,text,text,text,text,text) from public, authenticated;
grant execute on function public.submit_ghadeer_join_request(text,text,text,text,text,text) to anon;

create or replace function public.manager_list_ghadeer_join_requests(p_manager_pin text)
returns jsonb language plpgsql security definer set search_path to 'public','extensions','pg_temp' as $$
begin
  if not public._manager_pin_ok(p_manager_pin) then
    return jsonb_build_object('success',false,'message','الرقم السري غير صحيح أو الحساب مقفل مؤقتًا');
  end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
    'id',id,'full_name',full_name,'phone',phone,'address',address,'occupation',occupation,'note',note,
    'terms_version',terms_version,'terms_accepted_at',terms_accepted_at,'status',status,'created_at',created_at
  ) order by created_at desc) from public.ghadeer_join_requests where status = 'pending'), '[]'::jsonb);
end; $$;
revoke all on function public.manager_list_ghadeer_join_requests(text) from public, anon, authenticated;
grant execute on function public.manager_list_ghadeer_join_requests(text) to anon, authenticated;

create or replace function public.manager_close_ghadeer_join_request(p_manager_pin text,p_request_id bigint,p_status text)
returns jsonb language plpgsql security definer set search_path to 'public','extensions','pg_temp' as $$
begin
  if not public._manager_pin_ok(p_manager_pin) then
    return jsonb_build_object('success',false,'message','الرقم السري غير صحيح أو الحساب مقفل مؤقتًا');
  end if;
  if p_status not in ('processed','declined') then
    return jsonb_build_object('success',false,'message','حالة الطلب غير صحيحة');
  end if;
  update public.ghadeer_join_requests set status=p_status,processed_at=now(),processed_by='manager'
  where id=p_request_id and status='pending';
  if not found then return jsonb_build_object('success',false,'message','الطلب غير موجود أو تمت معالجته'); end if;
  return jsonb_build_object('success',true,'message',case when p_status='processed' then 'تم إغلاق الطلب بعد معالجة الإضافة.' else 'تم رفض الطلب وإغلاقه.' end);
end; $$;
revoke all on function public.manager_close_ghadeer_join_request(text,bigint,text) from public, anon, authenticated;
grant execute on function public.manager_close_ghadeer_join_request(text,bigint,text) to anon, authenticated;
