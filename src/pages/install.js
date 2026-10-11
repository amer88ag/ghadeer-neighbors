import { esc, toast, $ } from '../lib/dom.js';

/* النشر والتثبيت: مشاركة رابط البرنامج وتثبيته على الشاشة الرئيسية. */
let deferred = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; });

const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

export async function render(el) {
  const url = location.origin + location.pathname;
  el.innerHTML = `
    <section class="card center"><img src="icons/icon-192.png" alt="أيقونة جيران حي الغدير" width="112" height="112" class="install-icon">
      <h3>جيران حي الغدير</h3><p class="muted">ثبّت البرنامج على شاشتك الرئيسية ليفتح كتطبيق، وشارك الرابط مع جيرانك.</p>
      ${standalone() ? '<p class="status ok">✅ البرنامج مثبت على هذا الجهاز.</p>' : '<button class="btn primary block" data-install hidden>📲 تثبيت البرنامج الآن</button>'}</section>
    <section class="card"><h3>📤 نشر البرنامج</h3><p class="muted">أرسل الرابط لجيرانك. الدخول يكون بالاسم والرقم السري الذي تصدره إدارة الحي.</p>
      <div class="copy-box"><code data-url>${esc(url)}</code></div>
      <div class="actions"><button class="btn primary" data-share>📤 مشاركة</button><button class="btn secondary" data-copy>📋 نسخ الرابط</button>
      <a class="btn secondary" href="https://wa.me/?text=${encodeURIComponent('برنامج جيران حي الغدير: ' + url)}" target="_blank" rel="noopener">واتساب</a></div></section>
    <section class="card" ${isIOS() ? 'open' : ''}><h3>🍎 التثبيت على iPhone و iPad</h3><ol class="steps">
      <li>افتح الرابط في متصفح <b>Safari</b>.</li><li>اضغط زر <b>المشاركة</b> ⬆️ أسفل الشاشة.</li>
      <li>اختر <b>«إضافة إلى الشاشة الرئيسية»</b>.</li><li>اضغط <b>«إضافة»</b>، وستظهر أيقونة «جيران الغدير».</li></ol></section>
    <section class="card"><h3>🤖 التثبيت على Android</h3><ol class="steps">
      <li>افتح الرابط في متصفح <b>Chrome</b>.</li><li>اضغط زر <b>«تثبيت البرنامج الآن»</b> أعلاه إن ظهر،</li>
      <li>أو من القائمة <b>⋮</b> اختر <b>«تثبيت التطبيق»</b> أو <b>«إضافة إلى الشاشة الرئيسية»</b>.</li></ol></section>
    <section class="card"><h3>💻 على الكمبيوتر</h3><p>في Chrome أو Edge اضغط أيقونة التثبيت في شريط العنوان، أو أضف الرابط للمفضلة.</p></section>`;

  const btn = $('[data-install]', el);
  if (btn && deferred) btn.hidden = false;
  btn?.addEventListener('click', async () => {
    if (!deferred) return toast('استخدم خطوات التثبيت أدناه حسب جهازك.');
    deferred.prompt(); const r = await deferred.userChoice; deferred = null; btn.hidden = true;
    toast(r.outcome === 'accepted' ? 'تم تثبيت البرنامج.' : 'لم يتم التثبيت.', r.outcome === 'accepted');
  });
  const copy = async () => { try { await navigator.clipboard.writeText(url); toast('تم نسخ الرابط.'); } catch { toast('انسخ الرابط يدويًا من المربع.', false); } };
  $('[data-copy]', el).onclick = copy;
  $('[data-share]', el).onclick = async () => {
    if (navigator.share) { try { await navigator.share({ title: 'جيران حي الغدير', text: 'برنامج جيران حي الغدير بالمحالة', url }); } catch { /* أُلغيت المشاركة */ } }
    else copy();
  };
}
