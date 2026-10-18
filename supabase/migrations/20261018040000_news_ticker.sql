-- شريط أخبار الحي: إعلانات بفترة زمنية يحددها المطور أو المشرف المخوّل بالرسائل.
-- إضافة فقط: عمود expires_at في announcements ودالتان للنشر والحذف.
alter table public.announcements add column if not exists expires_at timestamptz;
alter table public.announcements add column if not exists in_ticker boolean not null default false;

create or replace function public._ticker_actor(p_member_id bigint, p_pin text) returns text
language plpgsql security definer set search_path to 'public', 'extensions', 'pg_temp' as $$
declare n text;
begin
  if coalesce(p_member_id, 0) = 0 then
    if public._manager_pin_ok(p_pin) then return 'إدارة جيران الغدير'; end if;
    return null;
  end if;
  if not public.member_auth_ok(p_member_id, p_pin) then return null; end if;
  select m.name into n from public.members m join public.member_permissions mp on mp.member_id = m.id
   where m.id = p_member_id and m.active and mp.role = 'supervisor' and (mp.can_send_messages or mp.can_send_group_messages);
  return n;
end; $$;
revoke all on function public._ticker_actor(bigint, text) from public, anon, authenticated;

-- p_member_id = 0 للمطور (برقمه)، أو رقم المشرف.
create or replace function public.staff_post_ticker_news(p_member_id bigint, p_pin text, p_title text, p_message text, p_starts_at timestamptz, p_ends_at timestamptz)
returns jsonb language plpgsql security definer set search_path to 'public', 'extensions', 'pg_temp' as $$
declare n text; v_id bigint; s timestamptz := coalesce(p_starts_at, now());
begin
  n := public._ticker_actor(p_member_id, p_pin);
  if n is null then return jsonb_build_object('success', false, 'message', 'غير مصرح أو بيانات الدخول غير صحيحة'); end if;
  if length(trim(coalesce(p_title, ''))) = 0 then return jsonb_build_object('success', false, 'message', 'اكتب نص الإعلان'); end if;
  if p_ends_at is null or p_ends_at <= s then return jsonb_build_object('success', false, 'message', 'حدد نهاية الإعلان بعد بدايته'); end if;
  if p_ends_at > s + interval '60 days' then return jsonb_build_object('success', false, 'message', 'أقصى مدة للإعلان 60 يومًا'); end if;
  insert into public.announcements(title, message, sender_member_id, sender_name, scheduled_at, expires_at, in_ticker)
  values (left(trim(p_title), 200), left(trim(coalesce(p_message, '')), 1000), nullif(p_member_id, 0), n, s, p_ends_at, true)
  returning id into v_id;
  insert into public.ghadeer_security_log(action, member_id, metadata) values ('ticker_news_posted', nullif(p_member_id, 0), jsonb_build_object('id', v_id));
  return jsonb_build_object('success', true, 'id', v_id, 'message', 'تم نشر الإعلان في شريط الأخبار');
end; $$;

create or replace function public.staff_delete_ticker_news(p_member_id bigint, p_pin text, p_id bigint)
returns jsonb language plpgsql security definer set search_path to 'public', 'extensions', 'pg_temp' as $$
declare n text;
begin
  n := public._ticker_actor(p_member_id, p_pin);
  if n is null then return jsonb_build_object('success', false, 'message', 'غير مصرح أو بيانات الدخول غير صحيحة'); end if;
  delete from public.announcements where id = p_id and in_ticker;
  if not found then return jsonb_build_object('success', false, 'message', 'الإعلان غير موجود'); end if;
  insert into public.ghadeer_security_log(action, member_id, metadata) values ('ticker_news_deleted', nullif(p_member_id, 0), jsonb_build_object('id', p_id));
  return jsonb_build_object('success', true, 'message', 'تم حذف الإعلان');
end; $$;

grant execute on function public.staff_post_ticker_news(bigint, text, text, text, timestamptz, timestamptz), public.staff_delete_ticker_news(bigint, text, bigint) to anon, authenticated;
notify pgrst, 'reload schema';
