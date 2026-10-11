/* Mock of window.supabase for browser tests — implements the RPC/table contract used by the app. */
(function () {
  const today = new Date(); const iso = d => d.toISOString().slice(0, 10);
  const plus = n => { const d = new Date(today); d.setDate(d.getDate() + n); return iso(d); };
  const members = [{ id: 1, name: 'عامر', active: true }, { id: 2, name: 'سعيد', active: true }, { id: 3, name: 'خالد', active: true }];
  const pins = { 1: '1234', 2: '5555', 3: '7777' };
  const db = {
    coffee_schedule: [{ id: 11, member_id: 1, coffee_date: plus(3), coffee_time: '20:00:00', status: 'مجدول' }, { id: 12, member_id: 2, coffee_date: plus(17), coffee_time: '20:00:00' }, { id: 10, member_id: 3, coffee_date: plus(-11), coffee_time: '20:00:00' }],
    outings_schedule: [{ id: 21, member1_id: 2, member2_id: 3, outing_date: plus(20), outing_time: '17:00:00', outing_type: 'عشاء', outing_place: 'السودة' }],
    announcements: [{ id: 31, title: 'اليوم الوطني', message: 'كل عام والوطن بخير', is_occasion: true, occasion_type: 'وطنية', created_at: new Date().toISOString() }, { id: 32, title: 'مستقبلي', message: 'لا يظهر', scheduled_at: new Date(Date.now() + 864e5 * 5).toISOString(), created_at: new Date().toISOString() }],
    group_messages: [{ id: 41, sender_member_id: 2, sender_name: 'سعيد', message: 'السلام عليكم', created_at: new Date().toISOString() }],
    member_permissions: [{ member_id: 2, role: 'supervisor', can_manage_coffee: true }]
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
    accept_program_terms: a => auth(a) && a.p_member_name ? { success: true } : deny,
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
    list_neighbor_services: () => ({ help: [{ title: 'توصيل دواء', status: 'طلب', member_name: 'سعيد' }], market: [], initiatives: [] }),
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
