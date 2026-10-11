# قاعدة البيانات

مشروع Supabase الخاص بالغدير: `xewjakfmdfkbhcnxglct` (اسمه في لوحة Supabase: Amer).

## ما طُبّق على القاعدة الحية (2026-10-11)

الترحيل `20261011090000_ghadeer_decouple_and_harden.sql` (اسمه في سجل Supabase: `ghadeer_decouple_and_harden`):

- استعادة الرقم السري صارت تستخدم جداول الغدير الخاصة `ghadeer_pin_reset_requests` و`ghadeer_security_log` بدل `account_support_requests` و`account_security_audit_log` التابعة للمشروع الآخر. توقيعات الدوال لم تتغير، والتحقق من رقم المدير يمر عبر `_manager_pin_ok` (فيها قفل المحاولات).
- دالة جديدة `manager_export_backup(p_manager_pin)` للنسخ الاحتياطي عبر الخادم، تستبعد `pin_hash` و`token_hash`.
- لم يُحذف أي جدول ولا أي بيانات.

## التحقق بعد التطبيق

| الفحص | النتيجة |
|---|---|
| `anon` يقرأ `ghadeer_pin_reset_requests` / `ghadeer_security_log` | ممنوع |
| `anon` يقرأ `members` مباشرة | ممنوع (كان ممنوعًا أصلًا) |
| دوال الاستعادة الثلاث تشير لجداول `account_*` | لا |
| مطابقة أسماء معاملات كل دوال RPC التي تستدعيها الواجهة الجديدة (84 استدعاء) مع القاعدة الحية | مطابقة |

## ملاحظات من فحص القاعدة الحية

- `accept_program_terms` لها نسختان: القديمة (4 معاملات) معطّلة وتعيد خطأ، والجديدة تتطلب `p_pin`. الواجهة الجديدة تستخدم الجديدة.
- تنبيه Supabase عن العرض `public_members` (SECURITY DEFINER) مقصود: يعرض `id, name, active` فقط.
- تنبيهات «دوال SECURITY DEFINER قابلة للتنفيذ من anon» متوقعة: التطبيق يعتمد على دوال تتحقق من الرقم السري داخلها.
- يوجد دوال للمشرف لم تكن الواجهة تستخدمها (`supervisor_update_coffee_assignment`، `supervisor_update_outing_assignment`، `supervisor_update_outing_time`، `supervisor_set_outing_cost_breakdown`، `supervisor_set_schedule_rules`…). يمكن إضافة صلاحيات المشرف عليها في مرحلة لاحقة.

## المشروع الآخر داخل قاعدة الغدير (قرار لك)

لديك مشروع Supabase مستقل باسم **Universal Communities** (`kmfjqpxcywlpqcjugrqb`). ومع ذلك ما زالت في قاعدة الغدير جداول تخصه، والواجهة الجديدة لا تستخدمها:

`communities`، `community_audit_log`، `community_draws`، `community_events`، `community_listings`، `community_memberships`، `community_messages`، `community_modules`، `community_notifications`، `community_requests`، `community_votes`، `community_vote_responses`، `account_consents`، `account_lifecycle`، `account_security_audit_log`، `account_support_messages`، `account_support_requests`، والدوال `create_account_support_request`، `log_account_security_event`، `record_consent_evidence`. (لا تحذف `is_app_admin` قبل مراجعة سياسات RLS على `members` و`coffee_schedule` و`outings_schedule` و`member_permissions` لأنها تستخدمها.)

بعد التأكد أن مشروع Universal Communities لا يقرأ من قاعدة الغدير، يمكن حذفها بترحيل منفصل بعد نسخة احتياطية. لم يُنفَّذ الحذف لأنه لا رجعة فيه.

## التراجع

```sql
drop function if exists public.manager_export_backup(text);
```
ثم أعد تطبيق `20260929_add_member_pin_recovery_workflow.sql` لإرجاع دوال الاستعادة القديمة. الجداول الجديدة يمكن إبقاؤها.
