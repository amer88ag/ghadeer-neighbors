/* Mock of window.supabase for browser tests — implements the RPC/table contract used by the app. */
(function () {
  const today = new Date(); const iso = d => d.toISOString().slice(0, 10);
  const plus = n => { const d = new Date(today); d.setDate(d.getDate() + n); return iso(d); };
  const members = [{ id: 1, name: 'عامر', active: true }, { id: 2, name: 'سعيد', active: true }, { id: 3, name: 'خالد', active: true }];
  const pins = { 1: '1234', 2: '5555', 3: '7777' };
  const db = {
    coffee_schedule: [{ id: 11, member_id: 1, coffee_date: plus(3), coffee_time: '20:00:00', status: 'مجدول' }, { id: 12, member_id: 2, coffee_date: plus(17), coffee_time: '20:00:00' }, { id: 10, member_id: 3, coffee_date: plus(-11), coffee_time: '20:00:00' }],
    outings_schedule: [{ id: 21, member1_id: 2, member2_id: 3, outing_date: plus(20), outing_time: '17:00:00', outing_type: 'عشاء', outing_place: 'السودة' }],
    announcements: [{ id: 31, title: 'اليوم الوطني', message: 'كل عام والوطن بخير', is_occasion: true, occasion_type: 'وطنية', created_at: new Date().toISOString() }, { id: 32, title: 'مستقبلي', message: 'لا يظهر', scheduled_at: new Date(Date.now() + 864e5 * 5).toISOString(), created_at: new Date().toISOString() }, { id: 33, title: 'صيانة شبكة المياه', message: 'الخميس صباحًا', in_ticker: true, ticker_color: '#1565c0', scheduled_at: new Date(Date.now() - 36e5).toISOString(), expires_at: new Date(Date.now() + 864e5).toISOString(), created_at: new Date().toISOString(), sender_name: 'إدارة جيران الغدير' }, { id: 34, title: 'إعلان منتهي', message: '', in_ticker: true, scheduled_at: new Date(Date.now() - 3 * 864e5).toISOString(), expires_at: new Date(Date.now() - 864e5).toISOString(), created_at: new Date(Date.now() - 3 * 864e5).toISOString() }],
    group_messages: [{ id: 41, sender_member_id: 2, sender_name: 'سعيد', message: 'السلام عليكم', created_at: new Date().toISOString() }],
    member_permissions: [{ member_id: 2, role: 'supervisor', can_manage_coffee: true }, { member_id: 1, role: 'member', can_send_group_messages: true }]
  };
  const plans = [{ id: 51, outing_type: 'رحلة برية', outing_place: 'تهامة', outing_date: plus(10), outing_time: '16:00', status: 'voting', attending_count: 3, total_expense: 300, per_person_cost: 100, organizers: [{ member_id: 1, member_name: 'عامر' }] }];
  const convs = [];
  const msgs = [];
  const calls = window.__calls = [];
  const auth = a => pins[a.p_member_id] && pins[a.p_member_id] === a.p_pin;
  const mgr = a => a.p_manager_pin === '9999';
  const deny = { success: false, message: 'بيانات الدخول غير صحيحة' };
  const handlers = {
    get_public_members: () => members,
    member_login: a => pins[a.p_member_id] === a.p_pin ? { success: true, member_id: a.p_member_id, name: members.find(m => m.id === a.p_member_id).name, role: a.p_member_id === 2 ? 'supervisor' : 'member' } : { success: false, message: 'الرمز السري غير صحيح' },
    manager_pin_login: a => ({ success: a.p_pin === '9999', message: a.p_pin === '9999' ? '' : 'الرقم السري غير صحيح.' }),
    get_program_acceptance: a => ({ exists: a.p_member_id !== 3 }),
    member_terms_status: a => auth(a) ? { success: true, accepted: a.p_member_id !== 3 || window.__accepted3 === true } : deny,
    get_service_settings: () => window.__svc || [],
    manager_set_service_setting: a => { if (!mgr(a)) return { success: false, message: 'غير مصرح' }; window.__svc = (window.__svc || []).filter(x => x.key !== a.p_key).concat([{ key: a.p_key, enabled: a.p_enabled, sort_order: a.p_sort_order, note: a.p_note }]); return { success: true }; },
    manager_list_members: a => mgr(a) ? members.map(m => ({ ...m, role: m.id === 2 ? 'supervisor' : 'member' })).concat([{ id: 9, name: 'عضو موقوف', active: false, role: 'member' }]) : { success: false, message: 'غير مصرح' },
    manager_list_ghadeer_join_requests: a => mgr(a) ? [{ id: 701, full_name: 'مقدم طلب تجريبي', phone: '0550000000', address: 'حي الغدير', status: 'pending', terms_version: '1.0', terms_accepted_at: new Date().toISOString(), created_at: new Date().toISOString() }] : { success: false, message: 'غير مصرح' },
    supervisor_list_ghadeer_join_requests: a => auth(a) && a.p_member_id === 2 ? [{ id: 701, full_name: 'مقدم طلب تجريبي', phone: '0550000000', address: 'حي الغدير', status: 'pending', terms_version: '1.0', terms_accepted_at: new Date().toISOString(), created_at: new Date().toISOString() }] : { success: false, message: 'غير مصرح' },
    manager_close_ghadeer_join_request: a => mgr(a) ? { success: true, message: 'تم إغلاق الطلب.' } : { success: false, message: 'غير مصرح' },
    supervisor_close_ghadeer_join_request: a => auth(a) && a.p_member_id === 2 ? { success: true, message: 'تم إغلاق الطلب.' } : { success: false, message: 'غير مصرح' },
    manager_set_member_active: a => mgr(a) ? { success: true, message: a.p_active ? 'تمت إعادة العضو' : 'تم إيقاف العضو' } : { success: false },
    manager_list_content: a => mgr(a) ? { help: [{ id: 1, title: 'توصيل دواء', status: 'open', kind: 'request', member_name: 'سعيد' }], market: [], initiative: [], rental: [], event: [{ id: 81, title: 'تكريم المتفوقين', status: 'مخطط', event_date: plus(5) }] } : { success: false },
    manager_full_stats: a => mgr(a) ? { success: true, generated_at: new Date().toISOString(), members: { active: 23, suspended: 1, supervisors: 1, seen_7d: 5, seen_30d: 9, never_seen: 2, terms_accepted: 3, remembered_devices: 4, pin_reset_open: 1 }, coffee: { total: 22, upcoming: 19, apologies: 1 }, outings: { scheduled_total: 11, upcoming: 10, plans_voting: 1, plans_scheduled: 0, votes: 2, ratings: 0 }, events: { total: 1, upcoming: 1, cancelled: 0, participants: 2 }, communication: { group_messages: 3, group_messages_30d: 3, private_conversations: 1, private_messages: 2, reports: 0, announcements: 8, suggestions: 1 }, services: { help_open: 1, market_open: 1, lost_open: 1, initiatives: 0, rentals_open: 1, checks_open: 0, checks_total: 0 }, communities: { pending: 1, active: 1, suspended: 0, members: 3 }, services_paused: 0 } : { success: false, message: 'غير مصرح' },
    manager_usage_stats: a => mgr(a) ? { success: true, since: '2026-09-20', pages: [{ page: 'news', hits: 40, members: 9 }, { page: 'coffee', hits: 12, members: 5 }, { page: 'links/sports', hits: 7, members: 3 }], daily: [], members: [{ id: 1, name: 'عامر', active: true, last_seen_at: new Date().toISOString(), terms_at: new Date().toISOString(), devices: 1, pages_30d: 6, has_phone: true }, { id: 3, name: 'سعيد', active: true, last_seen_at: null, terms_at: null, devices: 0, pages_30d: 0, has_phone: false }] } : { success: false, message: 'غير مصرح' },
    manager_list_communities: a => mgr(a) ? [{ id: 4, name: 'مجتمع الورود', status: 'pending', owner_name: 'سعيد', members_count: 1, created_at: new Date().toISOString() }] : { success: false },
    manager_review_community: a => mgr(a) ? { success: true } : { success: false },
    community_request_create: a => auth(a) ? (window.__comm = true, { success: true, id: 5, message: 'تم إرسال طلب المجتمع للمراجعة' }) : deny,
    community_my_list: a => auth(a) ? (window.__comm ? [{ id: 5, name: 'جيران حي النخيل', status: 'active', my_role: 'owner', my_status: 'approved', owner_name: 'عامر', join_code: 'NKH123', members_count: 1, pending_count: 1 }] : []) : deny,
    community_members: a => auth(a) ? [{ member_id: 1, name: 'عامر', role: 'owner', status: 'approved' }, { member_id: 3, name: 'خالد', role: 'member', status: 'pending', created_at: new Date().toISOString() }] : deny,
    community_decide_member: a => auth(a) ? { success: true } : deny,
    community_join_by_code: a => auth(a) ? { success: true, message: 'تم إرسال طلب الانضمام' } : deny,
    manager_set_content_open: a => mgr(a) ? { success: true } : { success: false },
    accept_program_terms: a => { if (!(auth(a) && a.p_member_name && a.p_version === 'terms-1.0')) return deny; if (a.p_member_id === 3) window.__accepted3 = true; return { success: true }; },
    issue_member_device_token: a => auth(a) ? { success: true, token: 'tok-' + a.p_member_id } : deny,
    member_login_by_device_token: a => a.p_token?.startsWith('tok-') ? { success: true, member_id: Number(a.p_token.slice(4)), name: members.find(m => m.id === Number(a.p_token.slice(4))).name } : { success: false },
    get_schedule_settings: () => ({ coffee_interval_days: 14, coffee_order_mode: 'alphabetical' }),
    neighbor_get_my_settings: a => auth(a) ? { success: true, residency_type: 'tenant', in_app: true, whatsapp: true, phone: false } : deny,
    member_revoke_device_token: () => ({ success: true }),
    get_neighbor_profiles: () => [{ member_id: 3, residency_type: 'tenant' }],
    get_member_profiles: () => [{ member_id: 2, full_name: 'سعيد بن علي', occupation: 'مهندس', bio: 'جار قديم', phone_public: '0555', residency_type: 'owner' }],
    get_outing_plans: () => plans,
    get_outing_plan_vote: a => auth(a) ? { vote: null } : deny,
    vote_outing_plan: a => { if (!auth(a)) return deny; plans[0].my_vote = a.p_vote; return { success: true }; },
    member_apologize_coffee: a => auth(a) ? { success: true } : deny,
    create_outing_plan: a => { if (!auth(a)) return deny; plans.push({ id: 52, outing_type: a.p_outing_type, outing_place: a.p_outing_place, outing_date: a.p_date, status: 'voting', attending_count: 0, organizers: [] }); return { success: true }; },
    send_group_message: a => { if (!auth(a)) return deny; db.group_messages.push({ id: 99, sender_member_id: a.p_member_id, message: a.p_message, created_at: new Date().toISOString() }); return { success: true }; },
    neighbor_list_conversations: a => auth(a) ? convs : deny,
    neighbor_send_message: a => { if (!auth(a)) return deny; let c = convs.find(x => x.recipient_id === a.p_recipient_id); if (!c) { c = { id: 70 + convs.length, recipient_id: a.p_recipient_id, recipient_name: members.find(m => m.id === a.p_recipient_id).name }; convs.push(c); } msgs.push({ id: msgs.length + 1, conversation_id: c.id, sender_id: a.p_member_id, body: a.p_body, created_at: new Date().toISOString() }); c.last_message = a.p_body; return { success: true, conversation_id: c.id }; },
    neighbor_read_conversation: a => auth(a) ? msgs.filter(m => m.conversation_id === a.p_conversation_id) : deny,
    list_neighbor_services: () => ({ help: [{ title: 'توصيل دواء', kind: 'request', status: 'open', member_name: 'سعيد', created_at: new Date().toISOString() }], market: [{ title: 'مكتب', kind: 'للبيع', status: 'open', member_name: 'خالد' }, { title: 'مفاتيح', kind: 'مفقود', status: 'open', member_name: 'عامر' }], initiatives: [] }),
    create_neighbor_market: a => auth(a) && ['للبيع','للإهداء','مطلوب','مفقود','معثور عليه'].includes(a.p_kind) ? { success: true } : { success: false, message: 'نوع المشاركة غير صحيح' },
    create_neighbor_help: a => auth(a) ? { success: true } : deny,
    list_neighbor_rentals: () => [{ kind: 'offer', title: 'شقة 3 غرف', property_type: 'apartment', bedrooms: 3, monthly_price: 2000, district: 'الغدير' }],
    get_neighborhood_events: () => [{ id: 81, title: 'تكريم المتفوقين', event_type: 'تكريم', event_date: plus(5), total_budget: 500 }],
    get_event_details: () => ({ event: { title: 'تكريم المتفوقين', welcome_text: 'أهلًا' }, participants: [{ member_id: 1, member_name: 'عامر', role: 'منظم', amount_due: 50, amount_paid: 50 }], expenses: [] }),
    get_neighbor_checks: a => auth(a) ? [] : deny,
    create_neighbor_check: a => auth(a) ? { success: true } : deny,
    request_member_pin_reset: () => ({ success: true, message: 'تم تسجيل طلب استعادة الرقم السري للمراجعة.' }),
    manager_get_pin_reset_requests: a => mgr(a) ? [{ id: 1, full_name: 'خالد', phone: null, created_at: new Date().toISOString() }] : { success: false, message: 'غير مصرح' },
    manager_create_coffee: a => { if (!mgr(a)) return { success: false, message: 'غير مصرح' }; db.coffee_schedule.push({ id: 13, member_id: a.p_member_id, coffee_date: a.p_date }); return { success: true }; },
    manager_get_neighbor_checks: a => mgr(a) ? [] : { success: false },
    get_occasion_automation_rules: () => [{ rule_key: 'eid', title: 'عيد الفطر', occasion_type: 'دينية', calendar_type: 'hijri', enabled: true }],
    manager_export_backup: a => mgr(a) ? { success: true, tables: { members } } : { success: false, message: 'غير مصرح' },
    manager_activity_stats: a => mgr(a) ? { totals: { members: 3, messages: 1 } } : { success: false }
  };
  function rpc(name, args = {}) {
    calls.push({ name, args });
    const h = handlers[name];
    if (!h) return Promise.resolve({ data: { success: true, message: 'mock ok' }, error: null });
    return Promise.resolve({ data: JSON.parse(JSON.stringify(h(args))), error: null });
  }
  function from(t) {
    const q = { _t: t, select() { return q; }, order() { return q; }, limit() { return q; }, eq() { return q; },
      then(res, rej) { calls.push({ name: 'table:' + t }); const rows = db[t]; return Promise.resolve(rows ? { data: JSON.parse(JSON.stringify(rows)), error: null } : { data: null, error: { message: 'permission denied for table ' + t, code: '42501' } }).then(res, rej); } };
    return q;
  }
  window.supabase = { createClient: () => ({ rpc, from }) };
})();
