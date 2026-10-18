-- رسائل الشريط بلون يختاره المطور أو المشرف المخوّل بالرسائل (إضافة فقط، طُبّق على القاعدة الحية 2026-10-18).
alter table public.announcements add column if not exists ticker_color text;

create or replace function public.staff_post_ticker_message(p_member_id bigint, p_pin text, p_title text, p_message text, p_starts_at timestamptz, p_ends_at timestamptz, p_color text)
returns jsonb language plpgsql security definer set search_path to 'public', 'extensions', 'pg_temp' as $$
declare n text; v_id bigint; s timestamptz := coalesce(p_starts_at, now()); c text := lower(nullif(trim(coalesce(p_color, '')), ''));
begin
  n := public._ticker_actor(p_member_id, p_pin);
  if n is null then return jsonb_build_object('success', false, 'message', 'غير مصرح أو بيانات الدخول غير صحيحة'); end if;
  if length(trim(coalesce(p_title, ''))) = 0 then return jsonb_build_object('success', false, 'message', 'اكتب نص الرسالة'); end if;
  if c is not null and c !~ '^#[0-9a-f]{6}$' then return jsonb_build_object('success', false, 'message', 'اللون غير صحيح'); end if;
  if p_ends_at is null or p_ends_at <= s then return jsonb_build_object('success', false, 'message', 'حدد نهاية الرسالة بعد بدايتها'); end if;
  if p_ends_at > s + interval '60 days' then return jsonb_build_object('success', false, 'message', 'أقصى مدة 60 يومًا'); end if;
  insert into public.announcements(title, message, sender_member_id, sender_name, scheduled_at, expires_at, in_ticker, ticker_color)
  values (left(trim(p_title), 200), left(trim(coalesce(p_message, '')), 1000), nullif(p_member_id, 0), n, s, p_ends_at, true, c)
  returning id into v_id;
  insert into public.ghadeer_security_log(action, member_id, metadata) values ('ticker_news_posted', nullif(p_member_id, 0), jsonb_build_object('id', v_id, 'color', c));
  return jsonb_build_object('success', true, 'id', v_id, 'message', 'تم نشر الرسالة في الشريط');
end; $$;
grant execute on function public.staff_post_ticker_message(bigint, text, text, text, timestamptz, timestamptz, text) to anon, authenticated;
notify pgrst, 'reload schema';
