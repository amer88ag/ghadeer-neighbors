/* Quran V2 manifest: single identity for the independent module. */
(function () {
  const manifest = Object.freeze({
    serviceKey: 'svc_quran',
    route: '/quran',
    entry: 'quran/index.js',
    ownerPage: 'quran',
    role: 'quran',
    category: 'faith',
    lifecycle: 'draft',
    version: '2.0.0',
    capabilities: Object.freeze([
      'reader',
      'audio',
      'tafsir',
      'tajweed',
      'hifz',
      'recitation',
      'search',
      'offline',
      'settings'
    ])
  });

  window.GhadeerQuranManifest = manifest;
})();
