# عقد مسارات خدمات جيران حي الغدير

كل خدمة يجب أن تملك معرّف مسار واحدًا، ولا يسمح العقد بالتسجيل المكرر.

المسار المستقل لا يعني نسخ الخدمات المشتركة؛ المصادقة، الإشعارات، النوافذ والتنقل أدوات مشتركة فقط.

## الخدمات

home, services, coffee, outings, neighbors, messages, neighbor-check, housing, market, jobs, occasions, lost, announcements, news, hadith, prayer, weather, quran, developer, more.

## قاعدة عدم التداخل

لا يجوز أن يعيد launcher خدمة إلى صفحة خدمة أخرى كبديل صامت. إذا لم توجد الصفحة/handler الخاص بالخدمة يفشل المسار صراحة بدل فتح خدمة مختلفة.

## معيار الإغلاق

UI → route → handler → RPC/API → DB → RLS/permission → result → error → back.

لا يعتبر المسار مكتملًا بمجرد وجود اسم route؛ يجب إثبات endpoint/handler الفعلي والبيانات والصلاحية والرجوع.
