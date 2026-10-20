-- مزامنة الدليل الصحي من داخل قاعدة البيانات (pg_net + pg_cron): خوادم Overpass ترفض طلبات وظائف الحافة (HTTP 406)
-- بينما تقبلها من قاعدة البيانات. الطلب يُرسل لمدينة واحدة عند الحاجة، وتُعالج الاستجابة كل دقيقة، مع إعادة المحاولة بخادم بديل.
create extension if not exists pg_net;

create table if not exists public.health_area_config (
  city text primary key, lat double precision not null, lng double precision not null, radius_m int not null default 12000, sort int not null default 100
);
alter table public.health_area_config enable row level security;
revoke all on public.health_area_config from anon, authenticated;
insert into public.health_area_config (city, lat, lng, radius_m, sort) values
 ('أبها', 18.2164, 42.5053, 12000, 1), ('خميس مشيط', 18.3061, 42.7290, 12000, 2), ('محايل عسير', 18.5440, 42.0470, 8000, 3), ('بيشة', 19.9842, 42.5900, 10000, 4),
 ('الرياض', 24.7136, 46.6753, 30000, 5), ('جدة', 21.5433, 39.1728, 25000, 6), ('مكة المكرمة', 21.4225, 39.8262, 15000, 7), ('المدينة المنورة', 24.4672, 39.6111, 15000, 8),
 ('الدمام', 26.4207, 50.0888, 15000, 9), ('الخبر', 26.2172, 50.1971, 12000, 10), ('الأحساء', 25.3833, 49.5867, 15000, 11), ('الطائف', 21.2703, 40.4158, 12000, 12),
 ('الباحة', 20.0129, 41.4677, 10000, 13), ('جازان', 16.8892, 42.5511, 10000, 14), ('نجران', 17.5656, 44.2289, 12000, 15), ('تبوك', 28.3835, 36.5662, 12000, 16),
 ('بريدة', 26.3260, 43.9750, 12000, 17), ('حائل', 27.5114, 41.7208, 12000, 18), ('سكاكا', 29.9697, 40.2064, 10000, 19), ('عرعر', 30.9753, 41.0381, 10000, 20)
on conflict (city) do nothing;

alter table public.health_sync_runs add column if not exists request_id bigint;
alter table public.health_sync_runs add column if not exists attempt int not null default 1;

-- إرسال طلب Overpass لمدينة (المحاولة n تستخدم الخادم n).
create or replace function public._health_send(p_run bigint, p_city text, p_attempt int) returns void language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare c public.health_area_config; eps text[] := array['https://overpass-api.de/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];
  q text; rid bigint;
begin
  select * into c from public.health_area_config where city = p_city;
  q := format('[out:json][timeout:60];(nwr["amenity"~"^(hospital|clinic|doctors|pharmacy|dentist)$"](around:%s,%s,%s);nwr["healthcare"~"^(hospital|clinic|centre|doctor|dentist|laboratory|physiotherapist|pharmacy|rehabilitation)$"](around:%s,%s,%s););out center tags 1500;',
    c.radius_m, c.lat, c.lng, c.radius_m, c.lat, c.lng);
  select net.http_get(eps[least(p_attempt, 3)], params := jsonb_build_object('data', q), headers := '{"User-Agent":"GhadeerNeighbors/1.0"}'::jsonb, timeout_milliseconds := 90000) into rid;
  update public.health_sync_runs set request_id = rid, attempt = p_attempt where id = p_run;
end $$;

-- طلب تحديث مدينة (عام، مع حد: مرة كل 24 ساعة بعد نجاح، ولا طلبين متزامنين).
create or replace function public._health_request(p_city text, p_force boolean) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare last_ok timestamptz; pending bigint; v_run bigint;
begin
  if not exists (select 1 from public.health_area_config where city = p_city) then return jsonb_build_object('success', false, 'message', 'مدينة غير مدعومة'); end if;
  select max(finished_at) into last_ok from public.health_sync_runs where area = p_city and ok;
  if not p_force and last_ok > now() - interval '24 hours' then return jsonb_build_object('success', true, 'status', 'fresh', 'last_ok', last_ok); end if;
  select id into pending from public.health_sync_runs where area = p_city and ok is null and started_at > now() - interval '5 minutes' order by id desc limit 1;
  if pending is not null then return jsonb_build_object('success', true, 'status', 'running', 'run_id', pending); end if;
  insert into public.health_sync_runs (source_id, area) values ('osm', p_city) returning id into v_run;
  perform public._health_send(v_run, p_city, 1);
  return jsonb_build_object('success', true, 'status', 'queued', 'run_id', v_run);
end $$;
create or replace function public.health_request_sync(p_city text) returns jsonb language sql security definer set search_path = public, pg_temp as $$
  select public._health_request(p_city, false);
$$;
-- للإدارة: تحديث فوري حتى لو حُدّثت المدينة خلال 24 ساعة (بحد أدنى 10 دقائق بين كل تحديث).
create or replace function public.staff_health_sync(p_member_id bigint, p_pin text, p_city text) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if public._offers_staff(p_member_id, p_pin) is null then return jsonb_build_object('success', false, 'message', 'غير مصرح'); end if;
  if exists (select 1 from public.health_sync_runs where area = p_city and started_at > now() - interval '10 minutes') then
    return jsonb_build_object('success', false, 'message', 'حُدّثت هذه المدينة قبل أقل من 10 دقائق'); end if;
  return public._health_request(p_city, true);
end $$;

-- حالة آخر عملية لمدينة.
create or replace function public.health_sync_status(p_city text) returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((select jsonb_build_object('run_id', id, 'ok', ok, 'fetched', fetched, 'inserted', inserted, 'updated', updated, 'error', error, 'started_at', started_at, 'finished_at', finished_at, 'attempt', attempt)
    from public.health_sync_runs where area = p_city order by id desc limit 1), '{}'::jsonb);
$$;

-- تصنيف النوع والقطاع من وسوم OSM.
create or replace function public._health_kind(t jsonb, nm text) returns text language sql immutable as $$
  select case
    when t->>'amenity' = 'pharmacy' or t->>'healthcare' = 'pharmacy' then 'pharmacy'
    when t->>'amenity' = 'dentist' or t->>'healthcare' = 'dentist' or nm ~* '(أسنان|dental)' then 'dental'
    when t->>'healthcare' = 'laboratory' or nm ~* '(مختبر|laborator)' then 'lab'
    when coalesce(t->>'healthcare:speciality', '') ~* 'radiolog' or nm ~* '(أشعة|radiolog|imaging)' then 'radiology'
    when t->>'healthcare' in ('physiotherapist', 'rehabilitation') or nm ~* '(علاج طبيعي|physio)' then 'physio'
    when t->>'amenity' = 'hospital' or t->>'healthcare' = 'hospital' then 'hospital'
    when nm ~* '(الرعاية الصحية الأولية|رعاية صحية أولية|مركز صحي|primary health)' then 'phc'
    when t->>'amenity' in ('clinic', 'doctors') or t->>'healthcare' in ('clinic', 'doctor', 'centre') then 'clinic'
    else 'other' end;
$$;
create or replace function public._health_sector(t jsonb, nm text, kind text) returns text language sql immutable as $$
  select case
    when lower(coalesce(t->>'operator:type', '')) in ('government', 'public', 'military') then 'government'
    when lower(coalesce(t->>'operator:type', '')) in ('private', 'commercial') then 'private'
    when (coalesce(t->>'operator', '') || ' ' || nm) ~* '(الخاص|private|ألماني|الالماني|الألماني|german|مستوصف|عيادات|polyclinic|clinics|medical complex)' then 'private'
    when (coalesce(t->>'operator', '') || ' ' || nm) ~* '(وزارة الصحة|ministry of health|\mMOH\M|\mPHC\M|الحرس الوطني|national guard|القوات المسلحة|armed forces|العسكري|military|الجامعي|university hospital|الرعاية الصحية الأولية|primary health care|مستشفى الملك|king [a-z]+ hospital|مدينة الملك|مركز الأمير|prince [a-z ]+cent|الهلال الأحمر|المركزي|central hospital|مستشفى عسير|العام\M|general hospital|الولادة وال)' then 'government'
    when kind = 'pharmacy' or (coalesce(t->>'operator', '') || ' ' || nm) ~* '(أهلي|الأهلي|مجمع|الوطني|national hospital|\mdr\.|د\. |مركز .* الطبي)' then 'private'
    else 'unknown' end;
$$;

-- معالجة الاستجابات المنتهية (تُشغَّل كل دقيقة، ويمكن تشغيلها يدويًا).
create or replace function public.health_process_sync() returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare r record; resp record; n_fetched int; n_ins int; n_upd int; done int := 0; err text;
begin
  for r in select * from public.health_sync_runs where ok is null and request_id is not null order by id loop
    select * into resp from net._http_response where id = r.request_id;
    if not found then
      if r.started_at < now() - interval '6 minutes' then
        update public.health_sync_runs set ok = false, finished_at = now(), error = 'انتهت مهلة الاستجابة' where id = r.id; done := done + 1;
      end if;
      continue;
    end if;
    if resp.status_code = 200 and resp.content is not null and left(ltrim(resp.content), 1) = '{' then
      begin
        with els as (
          select e, coalesce(e->'tags', '{}'::jsonb) t from jsonb_array_elements((resp.content::jsonb)->'elements') e
        ), rows as (
          select distinct on (key) 'osm:' || (e->>'type') || ':' || (e->>'id') key, (e->>'type') || '/' || (e->>'id') ext,
            left(regexp_replace(coalesce(nullif(t->>'name:ar', ''), t->>'name'), '\s+', ' ', 'g'), 150) nm,
            nullif(left(t->>'name:en', 150), '') nm_en, t,
            coalesce((e->>'lat')::float8, (e->'center'->>'lat')::float8) la, coalesce((e->>'lon')::float8, (e->'center'->>'lon')::float8) lo
          from els where coalesce(nullif(t->>'name:ar', ''), t->>'name') is not null
        ), up as (
          insert into public.health_facilities as h (source_id, external_id, dedupe_key, name, name_en, kind, sector, city, district, lat, lng, phone, website, opening_hours, verification, last_synced_at, updated_at)
          select 'osm', ext, key, nm, nm_en, public._health_kind(t, nm || ' ' || coalesce(nm_en, '')), public._health_sector(t, nm || ' ' || coalesce(nm_en, ''), public._health_kind(t, nm || ' ' || coalesce(nm_en, ''))),
            r.area, nullif(left(coalesce(t->>'addr:suburb', t->>'addr:district', t->>'addr:neighbourhood', ''), 80), ''), la, lo,
            nullif(left(regexp_replace(coalesce(t->>'phone', t->>'contact:phone', ''), '[^0-9+]', '', 'g'), 20), ''),
            nullif(left(regexp_replace(case when coalesce(t->>'website', t->>'contact:website', '') = '' then '' when coalesce(t->>'website', t->>'contact:website') ~* '^https?://' then coalesce(t->>'website', t->>'contact:website') else 'https://' || coalesce(t->>'website', t->>'contact:website') end, '^http:', 'https:', 'i'), 300), ''),
            nullif(left(t->>'opening_hours', 120), ''), 'open_data', now(), now()
          from rows where la is not null and lo is not null
          on conflict (dedupe_key) do update set name = excluded.name, name_en = excluded.name_en, kind = excluded.kind, sector = excluded.sector, district = coalesce(excluded.district, h.district),
            lat = excluded.lat, lng = excluded.lng, phone = coalesce(excluded.phone, h.phone), website = coalesce(excluded.website, h.website), opening_hours = coalesce(excluded.opening_hours, h.opening_hours),
            last_synced_at = now(), updated_at = now()
          returning (xmax = 0) inserted
        )
        select (select count(*) from els), count(*) filter (where inserted), count(*) filter (where not inserted) into n_fetched, n_ins, n_upd from up;
        update public.health_sync_runs set ok = true, finished_at = now(), fetched = n_fetched, inserted = n_ins, updated = n_upd, error = null where id = r.id;
        update public.health_sources set last_success_at = now() where id = 'osm';
      exception when others then
        update public.health_sync_runs set ok = false, finished_at = now(), error = left('خطأ في المعالجة: ' || sqlerrm, 400) where id = r.id;
      end;
      done := done + 1;
    else
      err := coalesce('HTTP ' || resp.status_code, '') || coalesce(' ' || left(resp.error_msg, 150), '') || case when resp.timed_out then ' (مهلة)' else '' end;
      if r.attempt < 3 then
        update public.health_sync_runs set error = left(coalesce(error || ' | ', '') || err, 400) where id = r.id;
        perform public._health_send(r.id, r.area, r.attempt + 1);
      else
        update public.health_sync_runs set ok = false, finished_at = now(), error = left(coalesce(error || ' | ', '') || err, 400) where id = r.id;
        update public.health_sources set last_error = left(err, 400), last_error_at = now() where id = 'osm';
        done := done + 1;
      end if;
    end if;
  end loop;
  return jsonb_build_object('processed', done);
end $$;

-- تحديث أسبوعي للمدن التي سبق طلبها (حتى 3 مدن في كل تشغيل).
create or replace function public.health_refresh_stale() returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare c text; n int := 0;
begin
  for c in select area from public.health_sync_runs group by area having max(finished_at) filter (where ok) < now() - interval '7 days' order by max(finished_at) filter (where ok) limit 3 loop
    perform public._health_request(c, true); n := n + 1;
  end loop;
  return jsonb_build_object('queued', n);
end $$;

revoke execute on function public._health_send(bigint, text, int), public._health_request(text, boolean), public.health_process_sync(), public.health_refresh_stale() from anon, authenticated, public;
grant execute on function public.health_request_sync(text), public.health_sync_status(text), public.staff_health_sync(bigint, text, text) to anon, authenticated;

select cron.schedule('ghadeer-health-process', '* * * * *', 'select public.health_process_sync()');
select cron.schedule('ghadeer-health-refresh', '17 3 * * 5', 'select public.health_refresh_stale()');

-- تثبيت search_path لدوال التصنيف (تنبيه المستشار الأمني).
alter function public._health_kind(jsonb, text) set search_path = pg_catalog, pg_temp;
alter function public._health_sector(jsonb, text, text) set search_path = pg_catalog, pg_temp;
