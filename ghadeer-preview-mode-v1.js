/* Ghadeer Neighbors — Open Preview Mode
   Development-only UX gate: expose the application for browsing without granting
   database permissions. Sensitive actions must still pass their existing auth/RPC checks. */
(() => {
  'use strict';
  const PREVIEW = true;

  function showAppForPreview() {
    if (!PREVIEW) return;
    const entry = document.getElementById('entryScreen');
    const app = document.getElementById('app');
    if (entry) entry.classList.add('hidden');
    if (app) app.classList.remove('hidden');

    const login = document.getElementById('topMemberAccessBtn');
    if (login) {
      login.textContent = '🔐 دخول الأعضاء والمشرفين';
      login.title = 'تسجيل الدخول مطلوب فقط للعمليات التي تحتاج عضوية أو صلاحية';
    }

    let banner = document.getElementById('ghadeerPreviewBanner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'ghadeerPreviewBanner';
      banner.setAttribute('role', 'status');
      banner.style.cssText = 'position:sticky;top:0;z-index:70;background:#fff8df;border-bottom:1px solid #ead9a4;color:#6b5418;padding:7px 12px;text-align:center;font-size:12px;font-weight:700';
      banner.textContent = 'وضع التطوير المفتوح — التصفح متاح، والعمليات الحساسة تبقى محمية.';
      document.body.prepend(banner);
    }

    try { if (typeof window.loadMembers === 'function') window.loadMembers(); } catch (e) { console.error('[Ghadeer Preview] loadMembers', e); }
    try { if (typeof window.loadData === 'function') window.loadData(); } catch (e) { console.error('[Ghadeer Preview] loadData', e); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(showAppForPreview, 150), { once: true });
  } else {
    setTimeout(showAppForPreview, 150);
  }
})();
