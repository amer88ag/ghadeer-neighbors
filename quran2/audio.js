/* Quran V2 audio contract. No unverified audio source is hard-coded. */
(function () {
  const state = { source: null, playing: false, rate: 1, repeat: 0 };
  const api = Object.freeze({
    getState() { return { ...state }; },
    setSource(source) { state.source = source || null; },
    setPlaying(value) { state.playing = Boolean(value); },
    setRate(value) { state.rate = Math.max(0.5, Math.min(2, Number(value) || 1)); },
    setRepeat(value) { state.repeat = Math.max(0, Number(value) || 0); }
  });
  window.GhadeerQuran2Audio = api;
})();
