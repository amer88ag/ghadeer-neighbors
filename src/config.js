/* إعدادات جيران حي الغدير — المصدر الوحيد لثوابت المشروع. */
export const APP_NAME = 'جيران حي الغدير بالمحالة';

// مشروع Supabase الخاص بالغدير. المفتاح منشور (publishable) وليس سريًا؛
// الحماية الفعلية في RLS ودوال RPC التي تتحقق من الرقم السري.
export const SUPABASE_URL = 'https://xewjakfmdfkbhcnxglct.supabase.co';
export const SUPABASE_KEY = 'sb_publishable__i-E8Gi5hcdfNd7gZXa12Q_-ZPSXPUr';

export const TIMEZONE = 'Asia/Riyadh';
export const LOCATION = { lat: 18.2164, lon: 42.5053, city: 'Abha', country: 'Saudi Arabia', label: 'الغدير — المحالة، أبها' };

// إصدار الأنظمة والشروط المعتمد. تغييره يطلب من كل عضو الموافقة من جديد.
export const TERMS_VERSION = 'terms-1.0';
export const DEVICE_TOKEN_KEY = 'ghadeer_member_device_token';
export const PIN_PATTERN = /^\d{4,12}$/;

// دقائق الإقامة بعد الأذان (كما في نسخة البرنامج السابقة).
export const IQAMA = { Fajr: 25, Dhuhr: 20, Asr: 20, Maghrib: 10, Isha: 20 };
