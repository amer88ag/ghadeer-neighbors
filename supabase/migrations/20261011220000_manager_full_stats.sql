-- جيران حي الغدير — إحصاءات شاملة للمطور (قراءة فقط، أعداد مجمعة بلا بيانات شخصية حساسة).
create or replace function public._ghadeer_count(p_table text, p_where text default 'true')
returns bigint language plpgsql stable security definer set search_path to 'public','pg_temp' as $$
declare n bigint;
begin
  if to_regclass('public.' || p_table) is null then return null; end if;
  execute format('select count(*) from public.%I where %s', p_table, p_where) into n;
  return n;
exception when others then return null;
end; $$;
revoke all on function public._ghadeer_count(text,text) from public, anon, authenticated;

create or replace function public.manager_full_stats(p_manager_pin text)
returns jsonb language plpgsql security definer set search_path to 'public','extensions','pg_temp' as $$
begin
  if not public._manager_pin_ok(p_manager_pin) then
    return jsonb_build_object('success', false, 'message', 'الرقم السري غير صحيح أو الحساب مقفل مؤقتًا');
  end if;
  return jsonb_build_object('success', true, 'generated_at', now(),
    'members', jsonb_build_object(
      'active', public._ghadeer_count('members', 'active'),
      'suspended', public._ghadeer_count('members', 'not active'),
      'supervisors', public._ghadeer_count('member_permissions', $q$role = 'supervisor'$q$),
      'seen_7d', public._ghadeer_count('members', $q$active and last_seen_at > now() - interval '7 days'$q$),
      'seen_30d', public._ghadeer_count('members', $q$active and last_seen_at > now() - interval '30 days'$q$),
      'never_seen', public._ghadeer_count('members', 'active and last_seen_at is null'),
      'terms_accepted', public._ghadeer_count('program_acceptances', $q$version = 'terms-1.0'$q$),
      'remembered_devices', public._ghadeer_count('member_device_tokens', 'revoked_at is null and expires_at > now()'),
      'pin_reset_open', public._ghadeer_count('ghadeer_pin_reset_requests', $q$status = 'open'$q$)),
    'coffee', jsonb_build_object(
      'total', public._ghadeer_count('coffee_schedule'),
      'upcoming', public._ghadeer_count('coffee_schedule', 'coffee_date >= current_date'),
      'apologies', public._ghadeer_count('coffee_schedule', 'apology_at is not null')),
    'outings', jsonb_build_object(
      'scheduled_total', public._ghadeer_count('outings_schedule'),
      'upcoming', public._ghadeer_count('outings_schedule', 'outing_date >= current_date'),
      'plans_voting', public._ghadeer_count('outing_plans', $q$status not in ('scheduled','rejected')$q$),
      'plans_scheduled', public._ghadeer_count('outing_plans', $q$status = 'scheduled'$q$),
      'votes', public._ghadeer_count('outing_plan_votes'),
      'ratings', public._ghadeer_count('outing_plan_ratings')),
    'events', jsonb_build_object(
      'total', public._ghadeer_count('neighborhood_events'),
      'upcoming', public._ghadeer_count('neighborhood_events', $q$event_date >= current_date and coalesce(status,'') <> 'ملغاة'$q$),
      'cancelled', public._ghadeer_count('neighborhood_events', $q$status = 'ملغاة'$q$),
      'participants', public._ghadeer_count('event_participants')),
    'communication', jsonb_build_object(
      'group_messages', public._ghadeer_count('group_messages'),
      'group_messages_30d', public._ghadeer_count('group_messages', $q$created_at > now() - interval '30 days'$q$),
      'private_conversations', public._ghadeer_count('neighbor_conversations'),
      'private_messages', public._ghadeer_count('neighbor_messages'),
      'reports', public._ghadeer_count('neighbor_message_reports'),
      'announcements', public._ghadeer_count('announcements'),
      'suggestions', public._ghadeer_count('suggestions')),
    'services', jsonb_build_object(
      'help_open', public._ghadeer_count('neighbor_help', $q$status = 'open'$q$),
      'market_open', public._ghadeer_count('neighbor_market', $q$status = 'open' and kind in ('للبيع','للإهداء','مطلوب')$q$),
      'lost_open', public._ghadeer_count('neighbor_market', $q$status = 'open' and kind in ('مفقود','معثور عليه')$q$),
      'initiatives', public._ghadeer_count('neighbor_initiatives', $q$status <> 'محذوفة'$q$),
      'rentals_open', public._ghadeer_count('neighborhood_rental_listings', $q$status = 'open'$q$),
      'checks_open', public._ghadeer_count('neighbor_check_ins', $q$status <> 'مغلقة'$q$),
      'checks_total', public._ghadeer_count('neighbor_check_ins')),
    'communities', jsonb_build_object(
      'pending', public._ghadeer_count('ghadeer_communities', $q$status = 'pending'$q$),
      'active', public._ghadeer_count('ghadeer_communities', $q$status = 'active'$q$),
      'suspended', public._ghadeer_count('ghadeer_communities', $q$status = 'suspended'$q$),
      'members', public._ghadeer_count('ghadeer_community_members', $q$status = 'approved'$q$)),
    'services_paused', public._ghadeer_count('ghadeer_service_settings', 'not enabled')
  );
end; $$;
revoke all on function public.manager_full_stats(text) from public, anon, authenticated;
grant execute on function public.manager_full_stats(text) to anon, authenticated;
-- التراجع: drop function if exists public.manager_full_stats(text); drop function if exists public._ghadeer_count(text,text);
