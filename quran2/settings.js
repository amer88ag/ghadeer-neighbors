/* Quran V2 settings model. UI adapters may persist these values later. */
(function () {
  const state = { fontScale: 1, theme: 'system', contrast: false, autoplay: false, repeatCount: 0 };
  const api = Object.freeze({
    getState() { return { ...state }; },
    set(key, value) { if (Object.prototype.hasOwnProperty.call(state, key)) state[key] = value; },
    reset() { state.fontScale = 1; state.theme = 'system'; state.contrast = false; state.autoplay = false; state.repeatCount = 0; }
  });
  window.GhadeerQuran2Settings = api;
})();
