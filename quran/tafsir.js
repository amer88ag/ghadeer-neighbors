/* Quran V2 Tafsir layer: source/provider independent contract. */
(function () {
  const state = { source: null, ayah: null };
  const api = Object.freeze({
    getState() { return { ...state }; },
    setSource(source) { state.source = source || null; },
    setAyah(ayah) { state.ayah = ayah ?? null; },
  });
  window.GhadeerQuranTafsir = api;
})();
