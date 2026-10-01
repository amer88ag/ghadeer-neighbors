/* Quran V2 recitation-analysis contract. Audio analysis must be provided by a verified speech/recitation engine. */
(function () {
  const state = { recording: false, result: null, verified: false };
  const api = Object.freeze({
    getState() { return { ...state }; },
    start() { state.recording = true; state.result = null; },
    stop() { state.recording = false; },
    setResult(result) { state.result = result && typeof result === 'object' ? { ...result } : null; },
    markEngineVerified(value) { state.verified = Boolean(value); },
    async analyze() { if (!state.verified) throw new Error('Verified recitation engine is not configured'); throw new Error('Recitation engine adapter is not configured'); }
  });
  window.GhadeerQuran2Recitation = api;
})();
