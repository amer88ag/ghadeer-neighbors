/* Quran V2 Reader foundation. Content provider is injected; no Quran text is embedded here. */
(function () {
  const state = { surah: null, ayah: null, page: null, zoom: 1, playing: false };
  const api = Object.freeze({
    getState() { return { ...state }; },
    setLocation(location) {
      if (!location || typeof location !== 'object') return;
      state.surah = location.surah ?? state.surah;
      state.ayah = location.ayah ?? state.ayah;
      state.page = location.page ?? state.page;
    },
    setZoom(value) { state.zoom = Math.max(0.75, Math.min(3, Number(value) || 1)); },
    setPlaying(value) { state.playing = Boolean(value); }
  });
  window.GhadeerQuran2Reader = api;
})();
