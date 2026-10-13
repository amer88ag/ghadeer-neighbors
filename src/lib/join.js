import { openModal, esc, toast, busy } from './dom.js';
import { call } from './api.js';
import { termsHtml } from './terms.js';

const TERMS_VERSION = '1.0';

export function showJoinRequest() {
  openModal({
    title: '✨ الانضمام إلى جيران حي الغدير',
    body: `<div class="join-intro"><div class="join-mark">🏡</div><h3>يا مرحبًا بك بين جيرانك</h3><p class="muted">يسعدنا انضمامك إلى مجتمع يجمع أهل الحي على التواصل والتعاون والتعارف وخدمة الجيران.</p></div>
      <form data-join-request>
        <label for="join-full-name">الاسم الكامل</label><input id="join-full-name" name="full_name" autocomplete="name" maxlength="120" required placeholder="اكتب اسمك الكامل">
        <label for="join-phone">رقم الجوال</label><input id="join-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="20" required placeholder="05xxxxxxxx">
        <label for="join-address">الحي أو العنوان</label><input id="join-address" name="address" maxlength="240" required placeholder="الحي والشارع أو وصف العنوان">
        <label for="join-occupation">العمل (اختياري)</label><input id="join-occupation" name="occupation" maxlength="120" placeholder="اختياري">
        <label for="join-note">رسالة للإدارة (اختياري)</label><textarea id="join-note" name="note" rows="2" maxlength="500" placeholder="أي معلومة تساعد الإدارة في التحقق من طلبك"></textarea>
        <div class="join-terms"><label class="check"><input type="checkbox" name="terms" required> أوافق على الأنظمة والشروط وأقر بالتزامي بها.</label><button class="link-btn" type="button" data-join-terms>قراءة الإقرارات والشروط كاملة</button></div>
        <p class="muted small">إرسال الطلب لا ينشئ عضوية مباشرة. ستراجع الإدارة طلبك، وبعد إضافتك إلى قائمة الأعضاء يمكنك الدخول باستخدام بيانات الدخول التي توفرها الإدارة.</p>
        <div class="status" data-join-status aria-live="polite"></div>
        <div class="actions"><button class="btn primary" type="submit">إرسال طلب الانضمام</button><button class="btn secondary" type="button" data-close>إلغاء</button></div>
      </form>`,
    onMount(card, close) {
      const form = card.querySelector('[data-join-request]');
      const status = card.querySelector('[data-join-status]');
      card.querySelector('[data-join-terms]')?.addEventListener('click', () => openModal({
        title: '📜 الأنظمة والشروط والإقرارات',
        body: termsHtml(),
        wide: true
      }));
      form.onsubmit = async event => {
        event.preventDefault();
        if (!form.elements.terms.checked) {
          status.textContent = 'يلزم الموافقة على الأنظمة والشروط لإرسال الطلب.';
          status.className = 'status bad';
          return;
        }
        await busy(form.querySelector('[type=submit]'), async () => {
          status.textContent = 'جارٍ إرسال طلبك بأمان…';
          status.className = 'status';
          const r = await call('submit_ghadeer_join_request', {
            p_full_name: form.elements.full_name.value.trim(),
            p_phone: form.elements.phone.value.trim(),
            p_address: form.elements.address.value.trim(),
            p_occupation: form.elements.occupation.value.trim(),
            p_note: form.elements.note.value.trim(),
            p_terms_version: TERMS_VERSION
          });
          if (!r.ok || r.data?.success !== true) {
            status.textContent = r.message || r.data?.message || 'تعذر إرسال الطلب. حاول مرة أخرى.';
            status.className = 'status bad';
            return;
          }
          close();
          setTimeout(() => openModal({
            title: '🌟 يا مرحبًا بك في جيران حي الغدير',
            body: `<div class="join-welcome"><div class="join-welcome-icon">🤝</div><h3>وصلنا طلبك، وننتظر لقاءك بين جيرانك!</h3><p>شكرًا لثقتك ورغبتك في الانضمام إلى مجتمع الحي. نؤمن أن التواصل الطيب والتعاون بين الجيران يصنعان حيًا أكثر ألفةً وتراحمًا.</p><div class="join-next"><b>ما الخطوة التالية؟</b><p>طلبك الآن لدى إدارة الحي للمراجعة. بعد اعتماد الطلب وإضافتك إلى قائمة الأعضاء، ستتمكن من الدخول والاستفادة من خدمات البرنامج.</p></div><p class="muted small">نرحب بك، ونسأل الله أن يديم الألفة والخير بين الجيران.</p><div class="actions"><button class="btn primary" type="button" data-close>شكرًا لكم</button></div></div>`
          }), 120);
        });
      };
    }
  });
}


/** رسالة الزائر عند اختيار خدمة قبل التسجيل. */
export function showGuestWelcome(serviceName = 'خدمات الحي') {
  openModal({
    title: '🏡 أهلًا بك في جيران حي الغدير',
    body: `<div class="guest-welcome"><div class="join-welcome-icon">🤝</div><h3>الجيرة الطيبة تبدأ بالتواصل</h3><p>جيران حي الغدير مساحة تجمع أهل الحي للتعارف والتعاون وتبادل الأخبار والمناسبات وتنظيم اللقاءات ومساندة المحتاج، في أجواء يسودها الاحترام والتراحم.</p><div class="join-next"><b>✨ ما الذي ينتظرك؟</b><p>جدول القهوة والطلعات، مناسبات الحي، دليل الجيران، الرسائل، أخبار الحي، والخدمات والمبادرات المجتمعية.</p></div><p class="muted">اختر الانضمام لتصبح من أهل المجتمع وتستفيد من الخدمات التفاعلية. يمكنك مواصلة تصفح الواجهة دون تسجيل.</p><div class="actions"><button class="btn primary" type="button" data-guest-join>🌟 طلب الانضمام</button><button class="btn secondary" type="button" data-guest-login>🔐 دخول الأعضاء</button><button class="btn ghost" type="button" data-close>متابعة التصفح</button></div></div>`,
    onMount(card) {
      card.querySelector('[data-guest-join]')?.addEventListener('click', showJoinRequest);
      card.querySelector('[data-guest-login]')?.addEventListener('click', async () => {
        const { showLogin } = await import('./session.js');
        showLogin();
      });
    }
  });
}
