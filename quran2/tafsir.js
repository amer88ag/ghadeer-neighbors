/* Quran V2 Tafsir provider contract. Sources must be explicitly identified and verified before display. */
(function () {
  const state = { source: null, level: 'brief', verified: false };
  const api = Object.freeze({
    getState() { return { ...state }; },
    configure(source, level) { state.source = source || null; state.level = level || 'brief'; state.verified = false; },
    markVerified(value) { state.verified = Boolean(value); },
    async getForAyah() { if (!state.verified) throw new Error('Verified Tafsir source is not configured'); throw new Error('Tafsir provider adapter is not configured'); }
  });
  window.GhadeerQuran2Tafsir = api;
})();
