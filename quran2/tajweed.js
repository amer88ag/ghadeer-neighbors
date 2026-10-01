/* Quran V2 Tajweed contract. Rule data must come from a verified source. */
(function () {
  const state = { source: null, verified: false };
  const api = Object.freeze({
    getState() { return { ...state }; },
    configure(source) { state.source = source || null; state.verified = false; },
    markVerified(value) { state.verified = Boolean(value); },
    async getRulesForAyah() { if (!state.verified) throw new Error('Verified Tajweed source is not configured'); throw new Error('Tajweed provider adapter is not configured'); }
  });
  window.GhadeerQuran2Tajweed = api;
})();
