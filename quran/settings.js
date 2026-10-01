/* Quran V2 Settings layer: accessibility and reading preferences. */
(function () {
  const state = { zoom: 1, theme: 'light', readingMode: 'standard', contrast: false, fontScale: 1 };
  const api = Object.freeze({
    getState() { return { ...state }; },
    setZoom(value) { state.zoom = Math.max(0.75, Math.min(3, Number(value) || 1)); },
    setTheme(value) { state.theme = ['light', 'dark', 'sepia'].includes(value) ? value : 'light'; },
    setReadingMode(value) { state.readingMode = ['standard', 'senior', 'highContrast'].includes(value) ? value : 'standard'; },
    setContrast(value) { state.contrast = Boolean(value); },
    setFontScale(value) { state.fontScale = Math.max(0.8, Math.min(2, Number(value) || 1)); },
  });
  window.GhadeerQuranSettings = api;
})();
