/* Quran V2 reader model: navigation only; content comes from the verified provider. */
(function () {
  const state = { page: 1, surah: 1, ayah: 1 };
  const api = Object.freeze({
    getState() { return { ...state }; },
    goPage(page) { state.page = Math.max(1, Number(page) || 1); },
    goSurah(surah) { state.surah = Math.max(1, Math.min(114, Number(surah) || 1)); state.ayah = 1; },
    goAyah(ayah) { state.ayah = Math.max(1, Number(ayah) || 1); }
  });
  window.GhadeerQuran2ReaderModel = api;
})();
