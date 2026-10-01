/* Quran V2 independent module entrypoint. */
(function () {
  const state = Object.freeze({
    serviceKey: 'svc_quran2',
    route: '/quran2',
    version: '2.0.0',
    lifecycle: 'draft'
  });
  window.GhadeerQuran2Module = Object.freeze({ getState: () => ({ ...state }) });
})();
