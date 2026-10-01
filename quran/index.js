/* Quran V2 module entrypoint. UI and content layers are intentionally separated. */
(function () {
  const moduleState = {
    serviceKey: 'svc_quran',
    route: '/quran',
    version: '2.0.0',
    lifecycle: 'draft',
  };

  function getState() {
    return { ...moduleState };
  }

  window.GhadeerQuranModule = Object.freeze({ getState });
})();
