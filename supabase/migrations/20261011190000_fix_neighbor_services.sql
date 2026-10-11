-- جيران حي الغدير — إصلاح نشر خدمات الحي وسوق الحي (كان النشر يفشل دائمًا).
-- السبب: create_neighbor_help كانت تكتب status='offer'/'request' والقيد يسمح بـ open/closed فقط،
-- و create_neighbor_market كانت تكتب status='active' و kind='offer' خلافًا للقيود.
-- الجداول فارغة (لم يُنشر فيها شيء بسبب العطل)، فالتعديل آمن.
-- إضافة: المفقودات كنوعين في سوق الحي ('مفقود'، 'معثور عليه').

alter table public.neighbor_help add column if not exists kind text not null default 'request';
alter table public.neighbor_help drop constraint if exists neighbor_help_kind_check;
alter table public.neighbor_help add constraint neighbor_help_kind_check check (kind in ('request','offer'));

alter table public.neighbor_market drop constraint if exists neighbor_market_kind_check;
alter table public.neighbor_market add constraint neighbor_market_kind_check
  check (kind in ('للبيع','للإهداء','مطلوب','مفقود','معثور عليه'));

create or replace function public.create_neighbor_help(p_member_id bigint, p_pin text, p_title text, p_description text, p_status text)
returns jsonb language plpgsql security definer set search_path to 'public','extensions','pg_temp' as $$
declare n text;
begin
  if not public.member_auth_ok(p_member_id, p_pin) then
    return jsonb_build_object('success', false, 'message', 'الرقم السري غير صحيح');
  end if;
  if nullif(trim(p_title), '') is null then
    return jsonb_build_object('success', false, 'message', 'اكتب عنوان الخدمة');
  end if;
  select name into n from public.members where id = p_member_id and active = true;
  insert into public.neighbor_help(member_id, member_name, title, description, kind, status)
  values (p_member_id, n, left(trim(p_title), 200), left(trim(coalesce(p_description, '')), 2000),
          case when p_status in ('offer', 'عرض') then 'offer' else 'request' end, 'open');
  return jsonb_build_object('success', true, 'message', 'تم نشر الطلب/العرض');
end; $$;

create or replace function public.create_neighbor_market(p_member_id bigint, p_pin text, p_kind text, p_title text, p_description text)
returns jsonb language plpgsql security definer set search_path to 'public','extensions','pg_temp' as $$
declare n text; k text;
begin
  if not public.member_auth_ok(p_member_id, p_pin) then
    return jsonb_build_object('success', false, 'message', 'الرقم السري غير صحيح');
  end if;
  if nullif(trim(p_title), '') is null then
    return jsonb_build_object('success', false, 'message', 'اكتب العنوان');
  end if;
  k := case trim(coalesce(p_kind, ''))
         when 'عرض' then 'للبيع' when 'offer' then 'للبيع'
         when 'طلب' then 'مطلوب' when 'request' then 'مطلوب'
         else trim(coalesce(p_kind, '')) end;
  if k not in ('للبيع', 'للإهداء', 'مطلوب', 'مفقود', 'معثور عليه') then
    return jsonb_build_object('success', false, 'message', 'نوع المشاركة غير صحيح');
  end if;
  select name into n from public.members where id = p_member_id and active = true;
  insert into public.neighbor_market(member_id, member_name, kind, title, description, status)
  values (p_member_id, n, k, left(trim(p_title), 200), left(trim(coalesce(p_description, '')), 2000), 'open');
  return jsonb_build_object('success', true, 'message', 'تم النشر');
end; $$;

create or replace function public.list_neighbor_services()
returns jsonb language sql stable security definer set search_path to 'public','pg_temp' as $$
  select jsonb_build_object(
    'help', coalesce((select jsonb_agg(to_jsonb(h) order by h.created_at desc) from public.neighbor_help h where h.status not in ('closed','مغلقة')), '[]'::jsonb),
    'market', coalesce((select jsonb_agg(to_jsonb(m) order by m.created_at desc) from public.neighbor_market m where m.status not in ('closed','مغلقة')), '[]'::jsonb),
    'initiatives', coalesce((select jsonb_agg(to_jsonb(i) order by i.created_at desc) from public.neighbor_initiatives i where i.status not in ('محذوفة','closed')), '[]'::jsonb)
  );
$$;

revoke all on function public.create_neighbor_help(bigint,text,text,text,text) from public, anon, authenticated;
grant execute on function public.create_neighbor_help(bigint,text,text,text,text) to anon, authenticated;
revoke all on function public.create_neighbor_market(bigint,text,text,text,text) from public, anon, authenticated;
grant execute on function public.create_neighbor_market(bigint,text,text,text,text) to anon, authenticated;
grant execute on function public.list_neighbor_services() to anon, authenticated;
