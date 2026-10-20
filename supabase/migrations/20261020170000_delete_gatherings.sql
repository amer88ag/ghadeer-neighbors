-- حذف التجمعات: طلبات الطلعات (المقترحة)، والطلعات المجدولة، ومناسبات الحي.
-- الصلاحيات:
--   • المطور (رقم المدير): يحذف أي تجمع.
--   • المشرف المفوَّض بإدارة الطلعات: يحذف أي تجمع.
--   • العضو: يحذف اقتراح الطلعة الذي طرحه هو فقط، ما دام لم يُدرج في الجدول بعد.
-- حذف الاقتراح المدرج يحذف موعده من الجدول، وحذف الموعد يحذف اقتراحه المرتبط،
-- حتى لا يبقى أثر معلّق في «المطروحة» أو «الجدول».

create or replace function public.delete_gathering(
  p_kind text,
  p_id bigint,
  p_member_id bigint default null,
  p_pin text default null,
  p_manager_pin text default null
) returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions', 'pg_temp'
as $$
declare
  v_staff boolean := false;
  v_plan public.outing_plans%rowtype;
  v_outing_id bigint;
  v_plan_id bigint;
begin
  if p_kind not in ('plan', 'outing', 'event') then
    return jsonb_build_object('success', false, 'message', 'نوع غير معروف');
  end if;

  if p_manager_pin is not null then
    if not public._manager_pin_ok(p_manager_pin) then
      return jsonb_build_object('success', false, 'message', 'الرقم السري غير صحيح أو الحساب مقفل مؤقتًا');
    end if;
    v_staff := true;
  elsif p_member_id is not null and p_pin is not null then
    if not exists (select 1 from public.members m
                   where m.id = p_member_id and m.active
                     and m.pin_hash = extensions.crypt(p_pin, m.pin_hash)) then
      return jsonb_build_object('success', false, 'message', 'بيانات الدخول غير صحيحة');
    end if;
    v_staff := exists (select 1 from public.member_permissions mp
                       where mp.member_id = p_member_id
                         and mp.role in ('supervisor', 'super_admin')
                         and mp.can_manage_outings);
  else
    return jsonb_build_object('success', false, 'message', 'سجّل الدخول أولًا');
  end if;

  if p_kind = 'plan' then
    select * into v_plan from public.outing_plans where id = p_id;
    if not found then return jsonb_build_object('success', false, 'message', 'الاقتراح غير موجود'); end if;
    if not v_staff then
      if v_plan.created_by is distinct from p_member_id then
        return jsonb_build_object('success', false, 'message', 'يمكنك حذف اقتراحاتك فقط');
      end if;
      if v_plan.status = 'scheduled' then
        return jsonb_build_object('success', false, 'message', 'الطلعة اعتُمدت في الجدول؛ حذفها للمطور أو المشرف');
      end if;
    end if;
    v_outing_id := v_plan.scheduled_outing_id;
    delete from public.outing_plans where id = p_id;  -- الأصوات والمنظمون والمصروفات والتقييمات تُحذف تلقائيًا
    if v_outing_id is not null then
      delete from public.schedule_thanks_sent where schedule_type = 'outing' and schedule_id = v_outing_id;
      delete from public.outings_schedule where id = v_outing_id;
    end if;
    return jsonb_build_object('success', true);
  end if;

  if not v_staff then
    return jsonb_build_object('success', false, 'message', 'الحذف للمطور أو المشرف المفوض');
  end if;

  if p_kind = 'outing' then
    select plan_id into v_plan_id from public.outings_schedule where id = p_id;
    if not found then return jsonb_build_object('success', false, 'message', 'موعد الطلعة غير موجود'); end if;
    delete from public.schedule_thanks_sent where schedule_type = 'outing' and schedule_id = p_id;
    delete from public.outings_schedule where id = p_id;  -- الحضور والمصروفات والتقييمات تُحذف تلقائيًا
    if v_plan_id is not null then
      delete from public.outing_plans where id = v_plan_id;
    end if;
    return jsonb_build_object('success', true);
  end if;

  -- p_kind = 'event'
  if not exists (select 1 from public.neighborhood_events where id = p_id) then
    return jsonb_build_object('success', false, 'message', 'المناسبة غير موجودة');
  end if;
  delete from public.neighborhood_events where id = p_id;  -- المشاركون والمصروفات تُحذف تلقائيًا
  return jsonb_build_object('success', true);
end
$$;

revoke all on function public.delete_gathering(text, bigint, bigint, text, text) from public;
grant execute on function public.delete_gathering(text, bigint, bigint, text, text) to anon, authenticated;
