-- جيران حي الغدير — إلغاء رمز «تذكّر هذا الجهاز» من الخادم عند تسجيل الخروج.
-- سابقًا كان الخروج يحذف الرمز من المتصفح فقط ويبقى صالحًا 90 يومًا في القاعدة.
-- من يملك الرمز فقط يستطيع إلغاءه.

create or replace function public.member_revoke_device_token(p_token text)
returns jsonb
language plpgsql
security definer
set search_path to 'public','extensions','pg_temp'
as $$
begin
  if nullif(trim(p_token),'') is null then return jsonb_build_object('success', false); end if;
  update public.member_device_tokens set revoked_at = now()
  where revoked_at is null and token_hash = extensions.crypt(p_token, token_hash);
  return jsonb_build_object('success', true);
end;
$$;
revoke all on function public.member_revoke_device_token(text) from public, anon, authenticated;
grant execute on function public.member_revoke_device_token(text) to anon, authenticated;

-- التراجع: drop function if exists public.member_revoke_device_token(text);
