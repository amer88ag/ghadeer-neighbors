/* Quran V2 Reader layer: presentation-independent controller contract. */
(function () {
  const state = {
    surah: null,
    ayah: null,
    page: null,
    zoom: 1,
    readingMode: 'standard',
  };

  const api = Object.freeze({
    getState() { return { ...state }; },
    setZoom(value) { state.zoom = Math.max(0.75, Math.min(3, Number(value) || 1)); return state.zoom; },
    setReadingMode(mode) { state.readingMode = ['standard', 'senior', 'highContrast'].includes(mode) ? mode : 'standard'; return state.readingMode; },
    setPosition(position) { Object.assign(state, position || {}); return { ...state }; },
  });

  window.GhadeerQuranReader = api;
})();
