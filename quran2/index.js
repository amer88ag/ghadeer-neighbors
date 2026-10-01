/* Quran V2 independent module entrypoint. Owns only its host; never replaces the app renderer/history. */
(function () {
  'use strict';

  const state = {
    serviceKey: 'svc_quran2',
    route: '/quran2',
    version: '2.3.1',
    lifecycle: 'ui',
    provider: 'alquran-cloud'
  };

  const scripts = [
    'reader-contract.js', 'reader-model.js', 'reader-view.js', 'reader.js',
    'navigation.js', 'audio.js', 'bookmarks.js', 'content-schema.js',
    'tafsir.js', 'tajweed.js', 'hifz.js', 'recitation.js', 'search.js',
    'offline.js', 'settings.js', 'provider-alquran-cloud.js'
  ];

  function loadOne(name) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[data-quran2="${name}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = `/quran2/${name}`;
      script.dataset.quran2 = name;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load Quran V2 module: ${name}`));
      document.head.appendChild(script);
    });
  }

  function ensureCss() {
    if (document.querySelector('link[data-quran2-css]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/quran2/reader.css';
    link.dataset.quran2Css = '1';
    document.head.appendChild(link);
  }

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));

  function hostFor(host) {
    if (host) return host;
    let root = document.getElementById('quran2-root');
    if (root) return root;
    const app = document.getElementById('app');
    if (!app) return null;
    root = document.createElement('section');
    root.id = 'quran2-root';
    root.className = 'page active';
    root.dataset.service = 'quran2';
    (app.querySelector('main.wrap') || app).appendChild(root);
    return root;
  }

  async function mount(host) {
    ensureCss();
    for (const name of scripts) await loadOne(name);

    const root = hostFor(host);
    if (!root) throw new Error('Quran V2 host could not be created');

    if (root.dataset.quran2Mounted === '1') {
      root.classList.add('active');
      root.scrollIntoView({ behavior: 'smooth' });
      return true;
    }

    root.dataset.quran2Mounted = '1';
    root.innerHTML = `
      <div class="quran2-shell" dir="rtl">
        <div class="quran2-head">
          <div>
            <h2>📖 القرآن الكريم</h2>
            <div class="quran2-sub">مصحف عثماني • قراءة • تلاوة • حفظ • بحث</div>
          </div>
          <button type="button" class="q2-btn" data-q2="close">✕</button>
        </div>
        <div class="quran2-tools">
          <label class="q2-field">السورة<select data-q2="surah" aria-label="اختر السورة"></select></label>
          <label class="q2-field">بحث<input data-q2="search" type="search" placeholder="ابحث في القرآن"></label>
          <button type="button" class="q2-btn" data-q2="zoom-out">A−</button>
          <button type="button" class="q2-btn" data-q2="zoom-in">A+</button>
          <button type="button" class="q2-btn" data-q2="bookmark">🔖 حفظ الموضع</button>
        </div>
        <div class="quran2-status" data-q2="status" role="status" aria-live="polite">جارٍ تحميل المصحف…</div>
        <div class="quran2-results" data-q2="results"></div>
        <div class="quran2-page" data-q2="page" role="document"></div>
        <div class="quran2-player">
          <audio data-q2="audio" controls preload="none"></audio>
          <label>سرعة <select data-q2="rate"><option>.75</option><option selected>1</option><option>1.25</option><option>1.5</option></select></label>
        </div>
        <div class="quran2-extra">
          <button class="q2-btn" data-q2="record">🎙️ تلاوتي</button>
          <button class="q2-btn" data-q2="tafsir">التفسير</button>
          <button class="q2-btn" data-q2="tajweed">التجويد</button>
          <button class="q2-btn" data-q2="hifz">الحفظ</button>
          <button class="q2-btn" data-q2="offline">⬇️ تنزيل المصحف</button>
        </div>
        <div class="quran2-note">لا نعرض ميزة على أنها محققة حتى يكون مصدرها أو محركها موثوقًا ومختبرًا.</div>
      </div>`;

    const provider = window.GhadeerQuran2AlQuranCloud;
    const offline = window.GhadeerQuran2Offline;
    const bookmarks = window.GhadeerQuran2Bookmarks;
    const select = root.querySelector('[data-q2="surah"]');
    const status = root.querySelector('[data-q2="status"]');
    const page = root.querySelector('[data-q2="page"]');
    const audio = root.querySelector('[data-q2="audio"]');

    const setStatus = (message, bad = false) => {
      status.textContent = message;
      status.className = `quran2-status${bad ? ' bad' : ''}`;
    };

    const setZoom = (zoom) => {
      const value = Math.max(0.8, Math.min(2.5, zoom));
      page.style.fontSize = `${value * 1.35}rem`;
      localStorage.setItem('ghadeer.quran2.zoom', String(value));
    };

    const renderSurah = async (number, targetAyah = 1) => {
      setStatus('جارٍ تحميل السورة…');
      page.replaceChildren();
      try {
        let surah = offline?.getState().available ? await offline.getSurah(number) : null;
        surah = surah || await provider.getSurah(number);
        if (!surah) throw new Error('Surah unavailable');

        select.value = String(number);
        surah.ayahs.forEach((ayah) => {
          const element = document.createElement('article');
          element.className = 'quran2-ayah';
          element.dataset.ayahNumber = ayah.number;
          element.dataset.ayahInSurah = ayah.numberInSurah;
          element.innerHTML = `
            <button class="q2-ayah-menu" type="button" aria-label="استماع">🔊</button>
            <span>${esc(ayah.text)}</span>
            <span class="q2-ayah-no">﴿${ayah.numberInSurah}﴾</span>`;
          element.querySelector('button').addEventListener('click', () => {
            audio.src = provider.audioUrl(ayah.number);
            audio.dataset.currentAyah = String(ayah.number);
            bookmarks?.setLastLocation({ surah: number, ayah: ayah.numberInSurah });
            localStorage.setItem('ghadeer.quran2.last', String(number));
            audio.play().catch(() => {});
          });
          page.appendChild(element);
        });

        const ayahNumber = Math.max(1, Number(targetAyah) || 1);
        bookmarks?.setLastLocation({ surah: number, ayah: ayahNumber });
        localStorage.setItem('ghadeer.quran2.last', String(number));
        requestAnimationFrame(() => {
          const target = page.querySelector(`[data-ayah-in-surah="${ayahNumber}"]`);
          if (target) target.scrollIntoView({ block: 'center', behavior: 'instant' });
        });
        setStatus(`${surah.name} • ${surah.numberOfAyahs} آية${offline?.getState().available ? ' • Offline' : ''}`);
      } catch (error) {
        setStatus('تعذر تحميل السورة حاليًا. تحقق من الاتصال ثم أعد المحاولة.', true);
        console.error(error);
      }
    };

    try {
      const check = await provider.verify();
      if (!check.verified) throw new Error('114-surah verification failed');
      const response = await fetch('https://api.alquran.cloud/v1/surah');
      const meta = await response.json();
      (meta.data || []).forEach((surah) => {
        const option = document.createElement('option');
        option.value = surah.number;
        option.textContent = `${surah.number}. ${surah.name}`;
        select.appendChild(option);
      });
      const saved = bookmarks?.getState().lastLocation || {
        surah: Number(localStorage.getItem('ghadeer.quran2.last') || 1),
        ayah: 1
      };
      await renderSurah(Number(saved.surah || 1), Number(saved.ayah || 1));
    } catch (error) {
      setStatus('لم يكتمل التحقق من مصدر المصحف؛ لم يتم إعلان VERIFIED.', true);
      console.error(error);
    }

    root.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-q2]');
      if (!button) return;
      const action = button.dataset.q2;

      if (action === 'zoom-in') setZoom(Number(localStorage.getItem('ghadeer.quran2.zoom') || 1) + 0.1);
      if (action === 'zoom-out') setZoom(Number(localStorage.getItem('ghadeer.quran2.zoom') || 1) - 0.1);
      if (action === 'bookmark') {
        const current = bookmarks?.getState();
        bookmarks?.addBookmark(current?.lastLocation || { surah: Number(select.value), ayah: 1 });
        setStatus('تم حفظ موضع القراءة');
      }
      if (action === 'close') root.classList.remove('active');
      if (action === 'record') setStatus('التسجيل متاح، لكن التصحيح الآلي محجوب حتى ربط محرك موثوق.', true);
      if (action === 'tafsir') setStatus('التفسير محجوب حتى ربط مصدر موثوق والتحقق منه.', true);
      if (action === 'tajweed') setStatus('التجويد محجوب حتى ربط مصدر موثوق والتحقق منه.', true);
      if (action === 'hifz') setStatus('الحفظ والمراجعة قيد الاختبار.', true);

      if (action === 'offline') {
        if (offline?.getState().available) {
          setStatus('المصحف متاح Offline');
          return;
        }
        setStatus('بدء تنزيل السور الـ114…');
        try {
          await offline.downloadAll(provider, 'uthmani-v1');
          setStatus('تم تنزيل والتحقق من السور الـ114. المصحف متاح Offline.');
          const saved = bookmarks?.getState().lastLocation || {
            surah: Number(localStorage.getItem('ghadeer.quran2.last') || 1),
            ayah: 1
          };
          await renderSurah(Number(saved.surah || 1), Number(saved.ayah || 1));
        } catch (error) {
          setStatus('فشل تنزيل المصحف بالكامل؛ لم يتم تفعيل Offline.', true);
          console.error(error);
        }
      }
    });

    select.addEventListener('change', () => renderSurah(Number(select.value), 1));
    root.querySelector('[data-q2="rate"]').addEventListener('change', (event) => {
      audio.playbackRate = Number(event.target.value);
      window.GhadeerQuran2Audio?.setRate(Number(event.target.value));
    });
    root.querySelector('[data-q2="search"]').addEventListener('change', async (event) => {
      const query = event.target.value.trim();
      if (!query) return;
      try {
        const results = await provider.search(query);
        root.querySelector('[data-q2="results"]').innerHTML = results.slice(0, 30).map((item) => {
          const [surah, ayah = 1] = String(item.key).split(':');
          return `<button class="q2-result" data-surah="${surah}" data-ayah="${ayah}">${esc(item.surah || '')} — ${esc(item.key)}<br>${esc(item.text)}</button>`;
        }).join('') || 'لا توجد نتائج';
      } catch (_) {
        setStatus('تعذر البحث حاليًا.', true);
      }
    });
    root.querySelector('[data-q2="results"]').addEventListener('click', (event) => {
      const button = event.target.closest('[data-surah]');
      if (button) renderSurah(Number(button.dataset.surah), Number(button.dataset.ayah || 1));
    });

    setZoom(Number(localStorage.getItem('ghadeer.quran2.zoom') || 1));
    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return true;
  }

  window.GhadeerQuran2Module = Object.freeze({
    getState: () => ({ ...state }),
    mount
  });
})();
