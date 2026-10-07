# المرحلة الأولى (Phase 1) — جدول القرارات

Repository: `amer88ag/ghadeer-neighbors`  
Branch: `cleanup-phase1-critical-fixes`  
Base: `main`  
Production: **paused**

هذه الوثيقة تفصل **المرحلة الأولى الأمنية الحالية** عن **P1** اللاحقة الخاصة بإعادة بناء واجهة المستخدم.

## تغييرات الفرع وقرارها

| الملف | القرار | السبب |
|---|---|---|
| `app.js` | KEEP | إصلاح انهيار التهيئة بسبب عناصر اختيارية، إضافة bindings محمية، تعريف `GHADEER_CTX`، وتصحيح اختيار العضو الحالي. |
| `enhancements.js` | KEEP | إزالة loader لملف غير موجود وحماية `servicesHtml`. |
| `quran-enhancement.js` | KEEP WITH REVIEW | حماية عناصر Quran القديمة التي قد لا تكون موجودة في البناء النهائي. |
| `production-bridge.js` | KEEP WITH REVIEW | استخدام `public_members` الحقيقي بدل مصدر أعضاء غير موجود. |
| `runtime-fix.js` | KEEP WITH REVIEW | نفس تصحيح مصدر الأعضاء؛ يحتاج مراجعة ترتيب التحميل لاحقًا. |
| `service-pages.js` | KEEP WITH REVIEW | استخدام `public_members`. |
| `services-enhancement.js` | KEEP WITH REVIEW | استخدام `public_members`. |
| `scripts/sql/phase1-isolation-check.sql` | KEEP | فحص تشخيصي فقط. |
| `docs/PHASE1_TEST_PLAN.md` | KEEP | خطة الاختبار الآمن. |
| `vercel.json` | KEEP TEMPORARILY | يمنع Production ويسمح بـ Preview فقط بعد إغلاق بوابة المرحلة الأولى. |

## نتائج قاعدة البيانات

- `public_members` **view** وليست table، وتعرض `id,name,active` للأعضاء النشطين.
- لا توجد توسعة لصلاحيات القراءة العامة.
- `login_attempt_limits` مفعلة مع RLS ولا توجد لها صلاحيات مباشرة للعميل.
- نقاط الدخول المركزية:
  - `member_login(bigint,text)`
  - `manager_pin_login(text)`
- تم الإبقاء عمدًا على EXECUTE لـ `anon, authenticated` على نقطتي الدخول المركزيتين؛ إخفاؤهما يكسر تسجيل الدخول الحي. الحماية تتم داخل الدالة مع throttling وعدم رمي استثناء في مسار فشل المصادقة.

## حماية PIN للمدير — قرار المرحلة الأولى

تم إنشاء الحارس الداخلي:

`public._manager_pin_ok(text)`

وتم إلغاء EXECUTE عنه من `PUBLIC`, `anon`, و`authenticated`.

### Manager-only

تمت إضافة الحارس إلى مجموعة المدير فقط، مع الحفاظ على التواقيع والصلاحيات الحالية وعدم تغيير واجهة RPC.

ومن ضمنها:
- `manager_add_member` (4 args)
- `manager_remove_supervisor`
- `manager_restore_backup`
- `manager_set_member_permissions`
- `manager_update_member_name`
- وبقية دوال المدير التي تم تصنيفها كـ manager-only.

### دوال المدير الحساسة المتاحة للعميل

تمت إضافة الحارس أيضًا إلى:
- `manager_set_manager_pin`
- `manager_set_neighbor_profiles_enabled`

وهما كانتا نقطتي تغيير فعليتين متاحتين للـ anon وتتحققان من PIN مباشرة.

### الدوال المختلطة — لا تُحوّل آليًا

الدوال العشر التالية **مختلطة manager/supervisor** ولذلك لا يدخلها حارس المدير:

1. `manager_add_member` (5 args)
2. `manager_delete_member`
3. `manager_randomize_outing_plan`
4. `manager_randomize_outings`
5. `manager_set_member_pin`
6. `manager_swap_coffee_dates`
7. `manager_swap_outing_dates`
8. `manager_update_coffee_assignment`
9. `manager_update_member_profile`
10. `manager_update_outing_assignment`

السبب: بعض مسارات الواجهة المشرفة ترسل PIN المشرف في `p_manager_pin`. إدخال حارس المدير في هذه الدوال كان سيحسب PIN المشرف كمحاولة مدير فاشلة وقد يقفل مدير النظام الحقيقي.

**القرار:** تأجيل هذه المجموعة إلى P1، مع تصميم حارس مختلط مستقل، ويفضل أن ترسل الواجهة `member_id` للمشرف حتى يصبح throttling مرتبطًا بالمستخدم بدل عداد عام.

## العضو والمشرف

لم تُجرَ إعادة مركزية شاملة لكل دوال PIN الخاصة بالعضو والمشرف في هذه المرحلة.

**القرار:** تأجيلها إلى P1 بعد تحديد مسارات الاستدعاء الفعلية، وعدم تغيير دوال حية بصورة عمياء.

## الدوال الحساسة غير المتاحة للعميل

تمت مراجعة:
- `manager_delete_all_program_data`
- `manager_restore_baseline`
- `manager_set_program_pause`

ولا يوجد لها مسار تنفيذ مباشر من `anon/authenticated` في الفحص الحالي. لذلك لا تحتاج تغييرًا تشغيليًا في هذه المرحلة؛ تبقى ضمن المراجعة المستقبلية.

## الاختبار الأخير المؤجل

باقي الاختبار الحاسم هو **اختبار القفل الحقيقي للمدير**:

1. 8 محاولات PIN خاطئة.
2. التأكد من ظهور قفل 15 دقيقة.
3. تجربة PIN المدير الصحيح من الموقع الحي أثناء القفل — يجب أن يُرفض.
4. بعد انتهاء 15 دقيقة — يجب أن يُقبل.
5. حذف صف عداد المدير فقط بعد الاختبار.
6. اختبار دخول عضو وخروجه.

هذا الاختبار مؤجل إلى نافذة زمنية يختارها المستخدم لأنه يؤثر فعليًا على دخول المدير لمدة القفل.

## قرار الإغلاق

**المرحلة الأولى (Phase 1): OPEN — بانتظار اختبار القفل الحقيقي فقط.**

بعد نجاح الاختبار:
- تُسجل نتيجة الاختبار هنا.
- تُغلق المرحلة الأولى رسميًا.
- تبقى قائمة المختلطة العشر والمجموعة العضو/المشرف مؤجلة إلى P1.
- تُجرى بوابة المصدر والبناء النهائية.
- بعدها فقط يُفتح Preview.

**Production remains paused.**  
لا Merge إلى `main` ولا نشر Production قبل اجتياز الاختبارات النهائية.
