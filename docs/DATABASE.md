# قاعدة البيانات — خطوات التطبيق

المشروع: `xewjakfmdfkbhcnxglct` (Supabase).

## ترتيب التطبيق

1. انشر الواجهة الجديدة على **Preview** أولًا.
2. طبّق `20261011090000_ghadeer_decouple_and_harden.sql`. الواجهة الجديدة تعمل قبله وبعده: إن لم يُطبَّق تعود تلقائيًا لدالة الشروط القديمة، ويعتذر النسخ الاحتياطي برسالة.
3. اختبر على Preview: الدخول، الإقرار بالشروط لعضو جديد، طلب استعادة رقم وتعيينه من لوحة المدير، تنزيل نسخة احتياطية.
4. شغّل استعلام التحقق المكتوب في رأس `20261011090100_lock_members_direct_read.sql`، ثم طبّقه.
5. أعد الاختبار، ثم احذف `ignoreCommand` من `vercel.json` لتفعيل Production.

## اختبار العزل والصلاحيات بعد التطبيق

نفّذ هذه الاستعلامات بدور `anon` (من SQL Editor: `set role anon;`). يجب أن تفشل جميعها بـ permission denied:

```sql
select * from public.members limit 1;
select * from public.ghadeer_pin_reset_requests limit 1;
select public.accept_program_terms(1,'x','1','u');
```

ويجب أن تنجح هذه:

```sql
select * from public.public_members limit 1;
select public.member_accept_terms(1,'0000','1.0','test'); -- تعيد success:false
```

## فصل المشروع الآخر عن قاعدة الغدير (قرار لك)

الجداول التالية لا تخص جيران الغدير، والواجهة الجديدة لا تستخدمها إطلاقًا:

`communities`، `community_audit_log`، `community_draws`، `community_events`، `community_listings`، `community_messages`، `community_notifications`، `community_requests`، `community_votes`، `community_vote_responses`، `account_consents`، `account_support_requests`، `account_security_audit_log`، والدالة `is_app_admin()` وسياسات RLS المبنية عليها (`ghadeer admin * coffee/members/outings`).

الخيار الموصى به: انقل المشروع الآخر إلى مشروع Supabase مستقل (pg_dump لهذه الجداول ثم الاستعادة في مشروعه)، ثم احذفها من هنا. لم يُكتب ترحيل حذف لأن الحذف لا رجعة فيه ويحتاج نسخة احتياطية وتأكيدك أولًا.
