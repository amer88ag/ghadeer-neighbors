-- جيران حي الغدير — قراءة إعدادات العضو الحالية (صفة السكن وطرق التواصل) لعرضها في «بطاقتي».
-- كانت الواجهة تحفظ هذه الإعدادات دون أن تستطيع قراءتها، فتظهر قيم افتراضية قد تستبدل الإعدادات الفعلية عند الحفظ.
-- إضافة فقط، لا تغيّر أي دالة قائمة.

create or replace function public.neighbor_get_my_settings(p_member_id bigint, p_pin text)
returns jsonb
language plpgsql
security definer
set search_path to 'public','extensions','pg_temp'
as $$
begin
  if not public.member_auth_ok(p_member_id, p_pin) then
    return jsonb_build_object('success', false, 'message', 'بيانات الدخول غير صحيحة');
  end if;
  return jsonb_build_object(
    'success', true,
    'residency_type', coalesce((select residency_type from public.neighbor_profiles where member_id = p_member_id), 'unspecified'),
    'in_app', coalesce((select in_app_enabled from public.neighbor_message_settings where member_id = p_member_id), true),
    'whatsapp', coalesce((select whatsapp_enabled from public.neighbor_message_settings where member_id = p_member_id), false),
    'phone', coalesce((select phone_enabled from public.neighbor_message_settings where member_id = p_member_id), false)
  );
end;
$$;

revoke all on function public.neighbor_get_my_settings(bigint,text) from public, anon, authenticated;
grant execute on function public.neighbor_get_my_settings(bigint,text) to anon, authenticated;

-- التراجع: drop function if exists public.neighbor_get_my_settings(bigint,text);
