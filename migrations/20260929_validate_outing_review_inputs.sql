-- Ghadeer production migration
-- Validate outing-review input at the database boundary.
create or replace function public.submit_outing_review(p_member_id bigint, p_pin text, p_outing_id bigint, p_place smallint, p_food smallint, p_time smallint, p_cost smallint, p_organization smallint, p_cleanliness smallint, p_display_name boolean, p_comment text, p_suggestion text)
returns jsonb
language plpgsql
security definer
set search_path to 'public','extensions'
as $function$
begin
  if not exists(select 1 from public.members m where m.id=p_member_id and m.active and extensions.crypt(p_pin,m.pin_hash)=m.pin_hash) then
    raise exception 'بيانات الدخول غير صحيحة';
  end if;
  if not exists(select 1 from public.outings o where o.id=p_outing_id) then
    raise exception 'الطلعة غير موجودة';
  end if;
  if p_place not between 1 and 5 or p_food not between 1 and 5 or p_time not between 1 and 5 or p_cost not between 1 and 5 or p_organization not between 1 and 5 or p_cleanliness not between 1 and 5 then
    raise exception 'يجب أن تكون جميع التقييمات من 1 إلى 5';
  end if;
  insert into public.outing_reviews(outing_id,member_id,place_rating,food_rating,time_rating,cost_rating,organization_rating,cleanliness_rating,display_name,comment,suggestion)
  values(p_outing_id,p_member_id,p_place,p_food,p_time,p_cost,p_organization,p_cleanliness,p_display_name,nullif(p_comment,''),nullif(p_suggestion,''))
  on conflict(outing_id,member_id) do update set
    place_rating=excluded.place_rating,
    food_rating=excluded.food_rating,
    time_rating=excluded.time_rating,
    cost_rating=excluded.cost_rating,
    organization_rating=excluded.organization_rating,
    cleanliness_rating=excluded.cleanliness_rating,
    display_name=excluded.display_name,
    comment=excluded.comment,
    suggestion=excluded.suggestion,
    updated_at=now();
  return jsonb_build_object('success',true);
end
$function$;
