/* جيران الغدير — جلسة جهاز آمنة بدون حفظ الرقم السري */
(() => {
  const KEY = 'ghadeer_member_device_token';
  const cfg = window.GHADEER_SUPABASE_CONFIG;
  if (!cfg || !window.supabase?.createClient) return;
  const client = window.supabase.createClient(cfg.url, cfg.key);

  const getState = () => {
    try { return state; } catch (_) { return window.state || null; }
  };
  const getEl = id => document.getElementById(id);

  async function issueDeviceToken() {
    const s = getState();
    if (!s?.member || !s?.pin) return;
    try {
      const { data, error } = await client.rpc('issue_member_device_token', {
        p_member_id: s.member.id,
        p_pin: s.pin,
        p_device_label: `${navigator.platform || 'device'} / ${navigator.userAgent.slice(0,80)}`
      });
      if (!error && data?.success && data?.token) {
        localStorage.setItem(KEY, data.token);
      }
    } catch (_) {}
  }

  async function restoreDeviceSession() {
    const token = localStorage.getItem(KEY);
    const s = getState();
    if (!token || !s || s.member) return false;
    try {
      const { data, error } = await client.rpc('member_login_by_device_token', { p_token: token });
      if (error || !data?.success) {
        localStorage.removeItem(KEY);
        return false;
      }
      const id = Number(data.member_id);
      s.member = Array.isArray(s.members) ? (s.members.find(m => Number(m.id) === id) || { id, name: data.name || 'العضو' }) : { id, name: data.name || 'العضو' };
      s.pin = null; // لا نحفظ الرقم السري في المتصفح.
      s.manager = false;
      s.supervisor = false;
      const who = getEl('whoami');
      if (who) who.textContent = `— ${s.member.name}`;
      const nav = getEl('managerNav');
      if (nav) nav.classList.add('hidden');
      return true;
    } catch (_) {
      return false;
    }
  }

  function wrapLogin() {
    if (window.__ghadeerSessionWrapped || typeof window.authenticateMemberFromModal !== 'function') return false;
    const original = window.authenticateMemberFromModal;
    window.authenticateMemberFromModal = async function(...args) {
      const ok = await original.apply(this, args);
      if (ok) await issueDeviceToken();
      return ok;
    };
    const originalLogout = window.logout;
    if (typeof originalLogout === 'function') {
      window.logout = function(...args) {
        localStorage.removeItem(KEY);
        return originalLogout.apply(this, args);
      };
    }
    window.__ghadeerSessionWrapped = true;
    return true;
  }

  async function init() {
    wrapLogin();
    const restore = async () => {
      wrapLogin();
      const s = getState();
      if (!s) return;
      if (Array.isArray(s.members) && s.members.length) await restoreDeviceSession();
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', restore, { once: true });
    else setTimeout(restore, 250);
    const timer = setInterval(() => {
      wrapLogin();
      const s = getState();
      if (s?.member || (Array.isArray(s?.members) && s.members.length)) {
        restoreDeviceSession();
        clearInterval(timer);
      }
    }, 500);
    setTimeout(() => clearInterval(timer), 15000);
  }

  init();
})();
