/* Quran V2 Tajweed layer: educational metadata only; no alteration of Quran text. */
(function () {
  const state = { enabled: true, ayah: null, source: null };
  const api = Object.freeze({
    getState() { return { ...state }; },
    setEnabled(value) { state.enabled = Boolean(value); },
    setAyah(ayah) { state.ayah = ayah ?? null; },
    setSource(source) { state.source = source || null; },
  });
  window.GhadeerQuranTajweed = api;
})();
