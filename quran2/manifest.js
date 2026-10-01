/* Quran V2 manifest: isolated while the legacy Quran path is retired. */
(function () {
  const manifest = Object.freeze({
    serviceKey: 'svc_quran2',
    route: '/quran2',
    entry: 'quran2/index.js',
    ownerPage: 'quran2',
    role: 'quran',
    category: 'faith',
    lifecycle: 'draft',
    version: '2.0.0',
    capabilities: Object.freeze(['reader','audio','tafsir','tajweed','hifz','recitation','search','offline','settings'])
  });
  window.GhadeerQuran2Manifest = manifest;
})();
