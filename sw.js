/* عامل خدمة بسيط لتمكين تثبيت البرنامج. لا يخزّن شيئًا: كل الطلبات تذهب للشبكة مباشرة،
   فلا تظهر نسخ قديمة بعد التحديث. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin || req.mode !== 'navigate') return;
  e.respondWith(fetch(req).catch(() => new Response('<!doctype html><meta charset="utf-8"><body dir="rtl" style="font-family:sans-serif;padding:24px">لا يوجد اتصال بالإنترنت. أعد المحاولة لاحقًا.</body>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } })));
});
