/* Quran V2 Recitation layer: recording/analysis boundary. No automatic religious verdicts. */
(function () {
  const state = { recording: false, ayah: null, analysis: null };
  const api = Object.freeze({
    getState() { return { ...state }; },
    start(ayah) { state.ayah = ayah ?? state.ayah; state.recording = true; state.analysis = null; },
    stop() { state.recording = false; },
    setAnalysis(result) { state.analysis = result || null; },
  });
  window.GhadeerQuranRecitation = api;
})();
