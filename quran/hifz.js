/* Quran V2 Hifz layer: memorization plans and review state. */
(function () {
  const state = { plan: null, currentAyah: null, reviewMode: 'guided' };
  const api = Object.freeze({
    getState() { return { ...state }; },
    setPlan(plan) { state.plan = plan || null; },
    setAyah(ayah) { state.currentAyah = ayah ?? null; },
    setReviewMode(mode) { state.reviewMode = ['guided', 'test', 'repeat'].includes(mode) ? mode : 'guided'; },
  });
  window.GhadeerQuranHifz = api;
})();
