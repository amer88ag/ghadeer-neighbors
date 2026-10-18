import { esc, toast, $ } from '../lib/dom.js';
import { state } from '../lib/session.js';
import { showJoinRequest } from '../lib/join.js';
import { appStatus } from '../lib/data.js';

/*
 * دعوة الجيران غير المسجلين: العضو يرسل دعوة شخصية باسمه، ومن يفتحها يرى صفحة ترحيب
 * تعرّفه بالبرنامج وتتيح له طلب الانضمام مباشرة.
 */
const FEATURES = [
  ['💬', 'تواصل الجيران', 'مجموعة للحي ورسائل خاصة، وتعارف بين الجيران.'],
  ['📢', 'أخبار الحي', 'إعلانات الحي ومواعيده وتهاني المناسبات في مكان واحد.'],
  ['❤️', 'تفقد الجار', 'نطمئن على المريض والمحتاج ونقف مع بعض.'],
  ['🤝', 'تعاون وخدمات', 'سوق الحي، المفقودات، المبادرات، وخدمات متبادلة.'],
  ['🎉', 'مناسبات الحي', 'نشارك أفراحنا ونواسي بعضنا.'],
  ['☕', 'لقاءات اختيارية', 'قهوة وطلعات لمن يرغب، والمشاركة فيها ليست شرطًا.']
];

export const inviteLink = name => `${location.origin}${location.pathname}#/invite/${encodeURIComponent(name || '')}`;
export const inviteText = (name, link, intro = '') => `السلام عليكم ورحمة الله 🌿

${intro || 'يسعدني دعوتك للانضمام إلى «جيران حي الغدير بالمحالة»، مجتمع يجمع أهل الحي على التواصل والتعاون: أخبار الحي، والتعارف بين الجيران، وتفقد المريض والمحتاج، والتعاون في الخدمات والمناسبات. وفيه لقاءات اختيارية لمن يرغب.'}

${name ? `الداعي: ${name}\n` : ''}للتعرّف على البرنامج وطلب الانضمام:
${link}

حيّاك الله بين جيرانك 🤝`;

function landing(el, inviter) {
  el.innerHTML = `
    <section class="invite-hero">
      <img src="icons/icon-192.png" alt="" width="84" height="84">
      <p class="invite-kicker">${inviter ? `دعوة خاصة من جارك <b>${esc(inviter)}</b>` : 'دعوة للانضمام'}</p>
      <h2>حيّاك الله بين جيرانك</h2>
      <p>«جيران حي الغدير بالمحالة» مجتمع خاص بأهل الحي: نتواصل ونتعاون ونطمئن على بعض.</p>
      <button class="btn gold block" data-join>🌟 أرغب بالانضمام</button>
    </section>
    <section class="invite-features">${FEATURES.map(([i, t, d]) => `<div class="feat"><span>${i}</span><b>${t}</b><small>${d}</small></div>`).join('')}</section>
    <section class="card invite-steps"><h3>كيف أنضم؟</h3><ol class="steps"><li>اضغط «أرغب بالانضمام» واكتب بياناتك.</li><li>تراجع إدارة الحي طلبك وتتحقق منه.</li><li>يصلك اسم الدخول والرقم السري، وتبدأ مع جيرانك.</li></ol>
      <p class="muted small">بياناتك تُستخدم للتحقق فقط ولا تظهر لأحد دون إذنك. المشاركة في القهوة والطلعات اختيارية تمامًا.</p></section>
    <div class="actions center"><button class="btn primary" data-join>🌟 طلب الانضمام</button><a class="btn secondary" href="#/home">👀 تصفح الواجهة</a></div>`;
  el.querySelectorAll('[data-join]').forEach(b => b.onclick = () => showJoinRequest());
}

export async function render(el, [inviter = '']) {
  inviter = decodeURIComponent(inviter || '').slice(0, 60);
  const member = state.user && state.termsOk && !state.manager;
  if (!member && !state.manager) return landing(el, inviter);
  if (inviter) return landing(el, inviter);

  const name = state.manager ? 'إدارة جيران الغدير' : state.user.name;
  const link = inviteLink(state.manager ? '' : name.split(' ').slice(0, 2).join(' '));
  el.innerHTML = `
    <section class="card invite-compose"><h3>💌 ادعُ جارك للانضمام</h3>
      <p class="muted">أرسل دعوة شخصية باسمك. عند فتحها يرى جارك صفحة ترحيب تعرّفه بالبرنامج، ويرسل طلب الانضمام بنفسه، ثم تراجعه الإدارة.</p>
      <label>نص الدعوة (يمكنك تعديله)</label><textarea name="msg" rows="9">${esc(inviteText(name, link, (await appStatus().catch(() => ({}))).invite_intro || ''))}</textarea>
      <div class="actions"><a class="btn wa" data-wa target="_blank" rel="noopener">💬 إرسال عبر واتساب</a><button class="btn primary" data-share>📤 مشاركة</button><button class="btn secondary" data-copy>📋 نسخ</button></div>
    </section>
    <section class="card"><h3>👁️ ماذا سيرى جارك؟</h3><p class="muted">صفحة ترحيب باسمك تعرض مزايا البرنامج وزر طلب الانضمام.</p><a class="btn secondary block" href="${esc(link.slice(link.indexOf('#')))}">معاينة صفحة الدعوة</a></section>
    <section class="card"><h3>📲 نشر البرنامج وتثبيته</h3><p class="muted">رابط البرنامج العام وخطوات تثبيته على الجوال كتطبيق.</p><a class="btn secondary block" href="#/install">📲 النشر والتثبيت</a></section>`;
  const msg = $('[name=msg]', el), wa = $('[data-wa]', el);
  const sync = () => { wa.href = 'https://wa.me/?text=' + encodeURIComponent(msg.value); };
  msg.oninput = sync; sync();
  $('[data-copy]', el).onclick = async () => { try { await navigator.clipboard.writeText(msg.value); toast('تم نسخ الدعوة.'); } catch { msg.select(); toast('انسخ النص المحدد.', false); } };
  $('[data-share]', el).onclick = async () => {
    if (navigator.share) { try { await navigator.share({ title: 'دعوة جيران حي الغدير', text: msg.value }); } catch { /* أُلغيت */ } }
    else wa.click();
  };
}
