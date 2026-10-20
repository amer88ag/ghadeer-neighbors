-- الدليل الصحي: منشآت صحية وأطباء وأسعار ومصادر ومزامنة. عروض المنشآت الصحية تُخزَّن في ghadeer_offers (مرتبطة بـ facility_id)
-- لتوسيع «عروض اليوم» بدل تكرارها. كل الجداول بـ RLS دون سياسات وصول مباشر؛ القراءة والكتابة عبر دوال SECURITY DEFINER فقط.

create table if not exists public.health_sources (
  id text primary key,
  name text not null,
  kind text not null check (kind in ('open_data','official_link','manual','api')),
  url text,
  license text,
  status text not null default 'manual' check (status in ('connected','link_only','needs_permission','manual')),
  notes text,
  last_success_at timestamptz,
  last_error text,
  last_error_at timestamptz
);

create table if not exists public.health_facilities (
  id bigserial primary key,
  source_id text not null references public.health_sources(id),
  external_id text,
  dedupe_key text not null unique,
  name text not null,
  name_en text,
  sector text not null default 'unknown' check (sector in ('government','private','unknown')),
  kind text not null default 'other' check (kind in ('hospital','clinic','phc','pharmacy','lab','radiology','dental','physio','other')),
  city text not null,
  district text,
  lat double precision,
  lng double precision,
  phone text,
  website text,
  booking_url text,
  insurance text,
  opening_hours text,
  community_id bigint,
  verification text not null default 'unverified' check (verification in ('verified','open_data','unverified')),
  status text not null default 'published' check (status in ('published','pending','hidden','rejected')),
  submitted_by bigint,
  verified_at timestamptz,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists health_facilities_city_idx on public.health_facilities (city, status);

create table if not exists public.health_doctors (
  id bigserial primary key,
  facility_id bigint not null references public.health_facilities(id),
  name text not null,
  specialty text not null,
  title text,
  qualifications text,
  languages text,
  availability text,
  source_id text not null references public.health_sources(id),
  source_url text,
  verification text not null default 'unverified' check (verification in ('verified','unverified')),
  status text not null default 'pending' check (status in ('published','pending','hidden','rejected')),
  submitted_by bigint,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (facility_id, name, specialty)
);

create table if not exists public.health_prices (
  id bigserial primary key,
  facility_id bigint not null references public.health_facilities(id),
  doctor_id bigint references public.health_doctors(id),
  service_type text not null check (service_type in ('consult_first','consult_follow','test','treatment','medicine')),
  service_name text not null,
  price numeric(10,2) check (price is null or price >= 0),
  price_status text not null default 'unavailable' check (price_status in ('confirmed','unavailable')),
  source_id text not null references public.health_sources(id),
  source_url text,
  status text not null default 'pending' check (status in ('published','pending','hidden','rejected')),
  submitted_by bigint,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (facility_id, service_type, service_name)
);

create table if not exists public.health_price_history (
  id bigserial primary key,
  price_id bigint not null references public.health_prices(id),
  old_price numeric(10,2),
  new_price numeric(10,2),
  changed_at timestamptz not null default now()
);

create table if not exists public.health_sync_runs (
  id bigserial primary key,
  source_id text not null references public.health_sources(id),
  area text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  ok boolean,
  fetched int default 0,
  inserted int default 0,
  updated int default 0,
  error text
);
create index if not exists health_sync_runs_area_idx on public.health_sync_runs (area, started_at desc);

alter table public.health_sources enable row level security;
alter table public.health_facilities enable row level security;
alter table public.health_doctors enable row level security;
alter table public.health_prices enable row level security;
alter table public.health_price_history enable row level security;
alter table public.health_sync_runs enable row level security;
revoke all on public.health_sources, public.health_facilities, public.health_doctors, public.health_prices, public.health_price_history, public.health_sync_runs from anon, authenticated;

-- توسيع «عروض اليوم» لعروض المنشآت الصحية.
alter table public.ghadeer_offers add column if not exists facility_id bigint references public.health_facilities(id);
alter table public.ghadeer_offers add column if not exists terms text;
alter table public.ghadeer_offers add column if not exists city text;
-- العرض الصحي = عرض مرتبط بمنشأة (facility_id) بتصنيف other، دون تغيير قيود الجدول القائم.

insert into public.health_sources (id, name, kind, url, license, status, notes) values
 ('osm', 'OpenStreetMap', 'open_data', 'https://www.openstreetmap.org/copyright', 'ODbL 1.0', 'connected', 'منشآت صحية (مستشفيات، مستوصفات، صيدليات، مختبرات، أسنان) من بيانات مفتوحة يحررها مجتمع OSM. غير متحقق منها رسميًا.'),
 ('community', 'مساهمات الجيران والمنشآت', 'manual', null, null, 'manual', 'أسعار وأطباء وعروض يرسلها الأعضاء أو مندوبو المنشآت وتنشر بعد مراجعة الإدارة.'),
 ('staff', 'إدارة البرنامج', 'manual', null, null, 'manual', 'بيانات أدخلتها الإدارة بعد التحقق من مصدرها.'),
 ('moh', 'وزارة الصحة', 'official_link', 'https://www.moh.gov.sa/', null, 'needs_permission', 'لا توجد واجهة API عامة لقائمة المنشآت أو الأسعار؛ البيانات المفتوحة المنشورة مؤشرات إجمالية فقط. الربط يتطلب تصريحًا.'),
 ('sehhaty', 'تطبيق صحتي', 'official_link', 'https://www.sehhaty.sa/', null, 'link_only', 'حجز المواعيد في المراكز الحكومية عبر التطبيق الرسمي. لا توجد واجهة ربط عامة.'),
 ('scfhs', 'الهيئة السعودية للتخصصات الصحية', 'official_link', 'https://www.scfhs.org.sa/', null, 'needs_permission', 'التحقق من تصنيف وترخيص الممارس الصحي عبر خدماتها الرسمية. لا توجد واجهة ربط عامة.'),
 ('sfda', 'الهيئة العامة للغذاء والدواء', 'official_link', 'https://www.sfda.gov.sa/ar/drugs-list', null, 'link_only', 'قائمة الأدوية المسجلة وأسعارها الرسمية للبحث من موقع الهيئة. لا توجد واجهة ربط عامة.'),
 ('chi', 'مجلس الضمان الصحي', 'official_link', 'https://www.chi.gov.sa/', null, 'needs_permission', 'شبكات مقدمي الخدمة المعتمدين لدى شركات التأمين. الربط يتطلب تصريحًا.')
on conflict (id) do nothing;

-- تسجيل تغييرات الأسعار.
create or replace function public._health_price_log() returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'UPDATE' and new.price is distinct from old.price then
    insert into public.health_price_history (price_id, old_price, new_price) values (new.id, old.price, new.price);
  end if;
  return new;
end $$;
create or replace trigger health_price_log after update on public.health_prices for each row execute function public._health_price_log();

-- قائمة المدن ومصدرها ووقت آخر تحديث ناجح.
create or replace function public.health_areas() returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'areas', coalesce((select jsonb_agg(jsonb_build_object('area', area, 'last_ok', last_ok, 'last_try', last_try, 'last_error', last_error) order by area) from (
       select area, max(finished_at) filter (where ok) last_ok, max(started_at) last_try,
              (array_agg(error order by started_at desc))[1] last_error
       from public.health_sync_runs group by area) a), '[]'::jsonb),
    'sources', (select jsonb_agg(jsonb_build_object('id', id, 'name', name, 'kind', kind, 'url', url, 'license', license, 'status', status, 'notes', notes, 'last_success_at', last_success_at) order by case status when 'connected' then 0 when 'manual' then 1 when 'link_only' then 2 else 3 end, id) from public.health_sources));
$$;

-- البحث في مدينة محددة: منشآت + أطباء مطابقون + أقل سعر كشف مؤكد + عروض صحية سارية.
create or replace function public.health_search(p_city text, p_q text default null, p_sector text default null, p_kind text default null,
  p_lat double precision default null, p_lng double precision default null, p_insurance text default null, p_max_price numeric default null, p_limit int default 60)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare q text := nullif(trim(coalesce(p_q, '')), ''); today date := (now() at time zone 'Asia/Riyadh')::date; res jsonb;
begin
  if nullif(trim(coalesce(p_city, '')), '') is null then return jsonb_build_object('success', false, 'message', 'اختر المدينة'); end if;
  with f as (
    select h.*,
      (select min(p.price) from public.health_prices p where p.facility_id = h.id and p.status = 'published' and p.price_status = 'confirmed' and p.service_type = 'consult_first') consult_price,
      (select count(*) from public.health_doctors d where d.facility_id = h.id and d.status = 'published') doctors,
      (select jsonb_agg(jsonb_build_object('id', d.id, 'name', d.name, 'specialty', d.specialty)) from public.health_doctors d
        where d.facility_id = h.id and d.status = 'published' and q is not null and (d.name ilike '%' || q || '%' or d.specialty ilike '%' || q || '%')) doctor_hits,
      (select count(*) from public.ghadeer_offers o where o.facility_id = h.id and o.status = 'published' and o.ends_on >= today and o.starts_on <= today) offers,
      case when p_lat is not null and h.lat is not null then round((6371 * acos(least(1, greatest(-1,
        cos(radians(p_lat)) * cos(radians(h.lat)) * cos(radians(h.lng) - radians(p_lng)) + sin(radians(p_lat)) * sin(radians(h.lat))))))::numeric, 1) end km
    from public.health_facilities h
    where h.status = 'published' and h.city = p_city
      and (p_sector is null or p_sector = '' or h.sector = p_sector)
      and (p_kind is null or p_kind = '' or h.kind = p_kind)
      and (p_insurance is null or p_insurance = '' or h.insurance ilike '%' || p_insurance || '%')
  )
  select jsonb_build_object('success', true, 'city', p_city, 'items', coalesce(jsonb_agg(jsonb_build_object(
      'id', id, 'name', name, 'name_en', name_en, 'sector', sector, 'kind', kind, 'district', district, 'phone', phone, 'website', website,
      'booking_url', booking_url, 'insurance', insurance, 'opening_hours', opening_hours, 'lat', lat, 'lng', lng, 'km', km,
      'source_id', source_id, 'verification', verification, 'verified_at', verified_at, 'last_synced_at', last_synced_at, 'updated_at', updated_at,
      'consult_price', consult_price, 'doctors', doctors, 'doctor_hits', doctor_hits, 'offers', offers)
      order by km nulls last, (consult_price is null), kind = 'pharmacy', name), '[]'::jsonb))
  into res
  from (select * from f
        where (q is null or name ilike '%' || q || '%' or coalesce(name_en, '') ilike '%' || q || '%' or coalesce(district, '') ilike '%' || q || '%' or doctor_hits is not null
               or exists (select 1 from public.health_prices p where p.facility_id = f.id and p.status = 'published' and p.service_name ilike '%' || q || '%'))
          and (p_max_price is null or (consult_price is not null and consult_price <= p_max_price))
        order by km nulls last, (consult_price is null), kind = 'pharmacy', name
        limit least(greatest(coalesce(p_limit, 60), 1), 200)) x;
  return res || jsonb_build_object('total_in_city', (select count(*) from public.health_facilities where city = p_city and status = 'published'),
    'last_ok', (select max(finished_at) from public.health_sync_runs where area = p_city and ok),
    'offers', (select coalesce(jsonb_agg(jsonb_build_object('id', o.id, 'title', o.title, 'store', o.store, 'facility_id', o.facility_id, 'price_before', o.price_before, 'price_after', o.price_after,
        'ends_on', o.ends_on, 'terms', o.terms, 'link', o.link) order by o.ends_on), '[]'::jsonb)
      from public.ghadeer_offers o left join public.health_facilities h on h.id = o.facility_id
      where o.facility_id is not null and o.status = 'published' and o.ends_on >= today and o.starts_on <= today and coalesce(h.city, o.city, p_city) = p_city));
end $$;

-- تفاصيل منشأة.
create or replace function public.health_facility(p_id bigint) returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select case when h.id is null then jsonb_build_object('success', false, 'message', 'المنشأة غير موجودة') else jsonb_build_object('success', true,
    'facility', to_jsonb(h) - 'submitted_by' - 'dedupe_key' - 'community_id' || jsonb_build_object('source_name', s.name, 'source_url', s.url, 'license', s.license),
    'doctors', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'name', d.name, 'specialty', d.specialty, 'title', d.title, 'qualifications', d.qualifications,
        'languages', d.languages, 'availability', d.availability, 'verification', d.verification, 'source_url', d.source_url, 'verified_at', d.verified_at, 'updated_at', d.updated_at) order by d.specialty, d.name)
      from public.health_doctors d where d.facility_id = h.id and d.status = 'published'), '[]'::jsonb),
    'prices', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'service_type', p.service_type, 'service_name', p.service_name, 'price', p.price, 'price_status', p.price_status,
        'doctor', (select name from public.health_doctors where id = p.doctor_id), 'source', (select name from public.health_sources where id = p.source_id), 'source_url', p.source_url,
        'verified_at', p.verified_at, 'updated_at', p.updated_at) order by p.service_type, p.service_name)
      from public.health_prices p where p.facility_id = h.id and p.status = 'published'), '[]'::jsonb),
    'offers', coalesce((select jsonb_agg(jsonb_build_object('id', o.id, 'title', o.title, 'description', o.description, 'price_before', o.price_before, 'price_after', o.price_after,
        'starts_on', o.starts_on, 'ends_on', o.ends_on, 'terms', o.terms, 'link', o.link) order by o.ends_on)
      from public.ghadeer_offers o where o.facility_id = h.id and o.status = 'published' and o.ends_on >= (now() at time zone 'Asia/Riyadh')::date
        and o.starts_on <= (now() at time zone 'Asia/Riyadh')::date), '[]'::jsonb)) end
  from (select 1) one left join public.health_facilities h on h.id = p_id and h.status = 'published' left join public.health_sources s on s.id = h.source_id;
$$;

-- إضافة بيانات: العضو يرسل للمراجعة، والإدارة/المشرف المخول ينشر مباشرة. لا يعدّل أحد حقول منشأة مصدرها موثوق/مفتوح؛ تُرسل تصحيحات كأسعار وأطباء مرتبطة.
create or replace function public.health_submit(p_member_id bigint, p_pin text, p_type text, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare staff text := public._offers_staff(p_member_id, p_pin); st text; who bigint := nullif(p_member_id, 0);
  fac bigint := nullif(p_data->>'facility_id', '')::bigint; v_id bigint; v_price numeric; today date := (now() at time zone 'Asia/Riyadh')::date; n text;
  link text := nullif(trim(coalesce(p_data->>'link', p_data->>'source_url', '')), '');
begin
  if staff is null and (coalesce(p_member_id, 0) = 0 or not public.member_auth_ok(p_member_id, p_pin)) then return jsonb_build_object('success', false, 'message', 'بيانات الدخول غير صحيحة'); end if;
  st := case when staff is not null then 'published' else 'pending' end;
  if link is not null and link !~ '^https://' then return jsonb_build_object('success', false, 'message', 'الرابط يجب أن يبدأ بـ https://'); end if;
  if p_type <> 'facility' and (fac is null or not exists (select 1 from public.health_facilities where id = fac and status = 'published')) then
    return jsonb_build_object('success', false, 'message', 'اختر المنشأة'); end if;

  if p_type = 'facility' then
    if length(trim(coalesce(p_data->>'name', ''))) < 3 or length(trim(coalesce(p_data->>'city', ''))) < 2 then return jsonb_build_object('success', false, 'message', 'اكتب اسم المنشأة والمدينة'); end if;
    if coalesce(p_data->>'sector', '') not in ('government','private') then return jsonb_build_object('success', false, 'message', 'حدد هل المنشأة حكومية أم خاصة'); end if;
    if coalesce(p_data->>'kind', '') not in ('hospital','clinic','phc','pharmacy','lab','radiology','dental','physio','other') then return jsonb_build_object('success', false, 'message', 'اختر نوع المنشأة'); end if;
    if exists (select 1 from public.health_facilities where city = trim(p_data->>'city') and lower(regexp_replace(name, '\s+', ' ', 'g')) = lower(regexp_replace(trim(p_data->>'name'), '\s+', ' ', 'g'))) then
      return jsonb_build_object('success', false, 'message', 'المنشأة موجودة في الدليل بالفعل'); end if;
    insert into public.health_facilities (source_id, dedupe_key, name, sector, kind, city, district, phone, website, booking_url, insurance, opening_hours, verification, status, submitted_by, verified_at)
    values (case when staff is not null then 'staff' else 'community' end, 'm:' || md5(lower(trim(p_data->>'city')) || '|' || lower(regexp_replace(trim(p_data->>'name'), '\s+', ' ', 'g'))),
      left(trim(p_data->>'name'), 150), p_data->>'sector', p_data->>'kind', left(trim(p_data->>'city'), 60), nullif(left(trim(coalesce(p_data->>'district', '')), 80), ''),
      nullif(left(regexp_replace(coalesce(p_data->>'phone', ''), '[^0-9+]', '', 'g'), 20), ''), link, nullif(trim(coalesce(p_data->>'booking_url', '')), ''),
      nullif(left(trim(coalesce(p_data->>'insurance', '')), 300), ''), nullif(left(trim(coalesce(p_data->>'opening_hours', '')), 120), ''),
      case when staff is not null then 'verified' else 'unverified' end, st, who, case when staff is not null then now() end) returning id into v_id;

  elsif p_type = 'doctor' then
    if length(trim(coalesce(p_data->>'name', ''))) < 3 or length(trim(coalesce(p_data->>'specialty', ''))) < 2 then return jsonb_build_object('success', false, 'message', 'اكتب اسم الطبيب وتخصصه'); end if;
    insert into public.health_doctors (facility_id, name, specialty, title, qualifications, languages, availability, source_id, source_url, verification, status, submitted_by, verified_at)
    values (fac, left(trim(p_data->>'name'), 120), left(trim(p_data->>'specialty'), 80), nullif(left(trim(coalesce(p_data->>'title', '')), 60), ''),
      nullif(left(trim(coalesce(p_data->>'qualifications', '')), 300), ''), nullif(left(trim(coalesce(p_data->>'languages', '')), 80), ''), nullif(left(trim(coalesce(p_data->>'availability', '')), 120), ''),
      case when staff is not null then 'staff' else 'community' end, link, case when staff is not null and link is not null then 'verified' else 'unverified' end, st, who, case when staff is not null then now() end)
    on conflict (facility_id, name, specialty) do nothing returning id into v_id;
    if v_id is null then return jsonb_build_object('success', false, 'message', 'الطبيب مضاف لهذه المنشأة بالفعل'); end if;

  elsif p_type = 'price' then
    if coalesce(p_data->>'service_type', '') not in ('consult_first','consult_follow','test','treatment','medicine') then return jsonb_build_object('success', false, 'message', 'اختر نوع الخدمة'); end if;
    if length(trim(coalesce(p_data->>'service_name', ''))) < 2 then return jsonb_build_object('success', false, 'message', 'اكتب اسم الخدمة'); end if;
    v_price := nullif(p_data->>'price', '')::numeric;
    if v_price is not null and (v_price < 0 or v_price > 1000000) then return jsonb_build_object('success', false, 'message', 'السعر غير صحيح'); end if;
    if v_price is not null and link is null and staff is null then return jsonb_build_object('success', false, 'message', 'أرفق رابط المصدر الرسمي للسعر (موقع المنشأة أو إعلانها)'); end if;
    if staff is null and exists (select 1 from public.health_prices where facility_id = fac and service_type = p_data->>'service_type' and service_name = trim(p_data->>'service_name')) then
      -- اقتراح تحديث لسعر موجود يُسجّل كطلب منفصل بانتظار المراجعة دون المساس بالسعر المنشور.
      insert into public.health_prices (facility_id, service_type, service_name, price, price_status, source_id, source_url, status, submitted_by)
      values (fac, p_data->>'service_type', left(trim(p_data->>'service_name'), 100) || ' (تحديث مقترح ' || to_char(now(), 'YYYYMMDDHH24MISS') || ')', v_price,
        case when v_price is null then 'unavailable' else 'confirmed' end, 'community', link, 'pending', who) returning id into v_id;
    else
      insert into public.health_prices (facility_id, service_type, service_name, price, price_status, source_id, source_url, status, submitted_by, verified_at)
      values (fac, p_data->>'service_type', left(trim(p_data->>'service_name'), 100), v_price, case when v_price is null then 'unavailable' else 'confirmed' end,
        case when staff is not null then 'staff' else 'community' end, link, st, who, case when staff is not null then now() end)
      on conflict (facility_id, service_type, service_name) do update set price = excluded.price, price_status = excluded.price_status, source_id = excluded.source_id,
        source_url = coalesce(excluded.source_url, health_prices.source_url), verified_at = now(), updated_at = now(), status = 'published'
      returning id into v_id;
    end if;

  elsif p_type = 'offer' then
    if length(trim(coalesce(p_data->>'title', ''))) < 3 then return jsonb_build_object('success', false, 'message', 'اكتب عنوان العرض'); end if;
    if nullif(p_data->>'ends_on', '') is null or (p_data->>'ends_on')::date < coalesce(nullif(p_data->>'starts_on', '')::date, today) or (p_data->>'ends_on')::date > today + 120 then
      return jsonb_build_object('success', false, 'message', 'حدد تاريخ انتهاء صحيحًا (حتى 120 يومًا)'); end if;
    if nullif(p_data->>'price_after', '') is not null and nullif(p_data->>'price_before', '') is not null and (p_data->>'price_after')::numeric > (p_data->>'price_before')::numeric then
      return jsonb_build_object('success', false, 'message', 'السعر بعد الخصم يجب ألا يزيد عن السعر قبله'); end if;
    if exists (select 1 from public.ghadeer_offers where facility_id = fac and title = trim(p_data->>'title') and ends_on >= today and status in ('published','pending')) then
      return jsonb_build_object('success', false, 'message', 'هذا العرض مضاف بالفعل'); end if;
    select name into n from public.health_facilities where id = fac;
    insert into public.ghadeer_offers (title, description, category, store, branch, price_before, price_after, link, starts_on, ends_on, status, submitted_by, submitter_name, facility_id, terms, city)
    values (left(trim(p_data->>'title'), 150), nullif(left(trim(coalesce(p_data->>'description', '')), 600), ''), 'other', n, null,
      nullif(p_data->>'price_before', '')::numeric, nullif(p_data->>'price_after', '')::numeric, link, coalesce(nullif(p_data->>'starts_on', '')::date, today), (p_data->>'ends_on')::date,
      st, who, coalesce(staff, (select name from public.members where id = p_member_id)), fac, nullif(left(trim(coalesce(p_data->>'terms', '')), 400), ''),
      (select city from public.health_facilities where id = fac)) returning id into v_id;
  else
    return jsonb_build_object('success', false, 'message', 'نوع غير معروف');
  end if;
  return jsonb_build_object('success', true, 'id', v_id, 'status', st, 'message', case when st = 'published' then 'تم النشر في الدليل الصحي' else 'تم الإرسال، وسيظهر بعد مراجعة الإدارة' end);
end $$;

-- مراجعة الإدارة.
create or replace function public.staff_health_pending(p_member_id bigint, p_pin text) returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if public._offers_staff(p_member_id, p_pin) is null then return jsonb_build_object('success', false, 'message', 'غير مصرح'); end if;
  return jsonb_build_object('success', true, 'items', coalesce((select jsonb_agg(x order by x->>'created_at') from (
    select jsonb_build_object('type', 'facility', 'id', id, 'title', name, 'detail', city || coalesce(' · ' || district, '') || ' · ' || sector || ' · ' || kind, 'link', website, 'created_at', created_at,
      'by', (select name from public.members where id = submitted_by)) x from public.health_facilities where status = 'pending'
    union all select jsonb_build_object('type', 'doctor', 'id', d.id, 'title', d.name, 'detail', d.specialty || ' · ' || h.name, 'link', d.source_url, 'created_at', d.created_at,
      'by', (select name from public.members where id = d.submitted_by)) from public.health_doctors d join public.health_facilities h on h.id = d.facility_id where d.status = 'pending'
    union all select jsonb_build_object('type', 'price', 'id', p.id, 'title', p.service_name, 'detail', coalesce(p.price::text || ' ر.س', 'غير متوفر') || ' · ' || h.name, 'link', p.source_url, 'created_at', p.created_at,
      'by', (select name from public.members where id = p.submitted_by)) from public.health_prices p join public.health_facilities h on h.id = p.facility_id where p.status = 'pending'
  ) s), '[]'::jsonb),
  'runs', coalesce((select jsonb_agg(jsonb_build_object('area', area, 'ok', ok, 'fetched', fetched, 'inserted', inserted, 'updated', updated, 'error', error, 'at', started_at) order by started_at desc)
    from (select * from public.health_sync_runs order by started_at desc limit 15) r), '[]'::jsonb));
end $$;

create or replace function public.staff_health_review(p_member_id bigint, p_pin text, p_type text, p_id bigint, p_status text) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare base text; real_name text;
begin
  if public._offers_staff(p_member_id, p_pin) is null then return jsonb_build_object('success', false, 'message', 'غير مصرح'); end if;
  if p_status not in ('published','rejected','hidden') then return jsonb_build_object('success', false, 'message', 'حالة غير صحيحة'); end if;
  if p_type = 'facility' then
    update public.health_facilities set status = p_status, verification = case when p_status = 'published' and source_id in ('community','staff') then 'verified' else verification end,
      verified_at = case when p_status = 'published' then now() else verified_at end, updated_at = now() where id = p_id;
  elsif p_type = 'doctor' then
    update public.health_doctors set status = p_status, verification = case when p_status = 'published' and source_url is not null then 'verified' else verification end,
      verified_at = case when p_status = 'published' then now() else verified_at end, updated_at = now() where id = p_id;
  elsif p_type = 'price' then
    select service_name into real_name from public.health_prices where id = p_id;
    base := regexp_replace(coalesce(real_name, ''), ' \(تحديث مقترح \d+\)$', '');
    if p_status = 'published' and base <> real_name then
      -- اعتماد تحديث مقترح: يُحدَّث السعر الأصلي (ويُسجَّل في السجل) ويُخفى الطلب.
      update public.health_prices o set price = n.price, price_status = n.price_status, source_url = coalesce(n.source_url, o.source_url), source_id = 'community', verified_at = now(), updated_at = now()
        from public.health_prices n where n.id = p_id and o.facility_id = n.facility_id and o.service_type = n.service_type and o.service_name = base;
      update public.health_prices set status = 'hidden', updated_at = now() where id = p_id;
    else
      update public.health_prices set status = p_status, verified_at = case when p_status = 'published' then now() else verified_at end, updated_at = now() where id = p_id;
    end if;
  else return jsonb_build_object('success', false, 'message', 'نوع غير معروف'); end if;
  if not found then return jsonb_build_object('success', false, 'message', 'العنصر غير موجود'); end if;
  return jsonb_build_object('success', true, 'message', case p_status when 'published' then 'تم النشر' when 'rejected' then 'تم الرفض' else 'تم الإخفاء' end);
end $$;

-- «عروض اليوم» تعرض العروض الصحية أيضًا مع رابط المنشأة.
create or replace function public.offers_list() returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'title', title, 'description', description, 'category', category, 'store', store, 'branch', branch,
    'price_before', price_before, 'price_after', price_after, 'link', link, 'starts_on', starts_on, 'ends_on', ends_on, 'submitter_name', submitter_name, 'created_at', created_at,
    'facility_id', facility_id, 'terms', terms, 'city', city)
    order by ends_on, created_at desc), '[]'::jsonb)
  from public.ghadeer_offers where status = 'published' and ends_on >= (now() at time zone 'Asia/Riyadh')::date and starts_on <= (now() at time zone 'Asia/Riyadh')::date;
$$;

grant execute on function public.health_areas(), public.health_search(text, text, text, text, double precision, double precision, text, numeric, int), public.health_facility(bigint),
  public.health_submit(bigint, text, text, jsonb), public.staff_health_pending(bigint, text), public.staff_health_review(bigint, text, text, bigint, text), public.offers_list() to anon, authenticated;
revoke execute on function public._health_price_log() from anon, authenticated, public;
