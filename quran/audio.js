/* Quran V2 Audio layer: provider-independent playback contract. */
(function () {
  const state = { playing: false, repeat: 1, speed: 1, ayah: null, provider: null };
  const api = Object.freeze({
    getState() { return { ...state }; },
    play(ayah) { state.ayah = ayah ?? state.ayah; state.playing = true; },
    pause() { state.playing = false; },
    setRepeat(value) { state.repeat = Math.max(1, Number(value) || 1); return state.repeat; },
    setSpeed(value) { state.speed = Math.max(0.5, Math.min(2, Number(value) || 1)); return state.speed; },
    setProvider(provider) { state.provider = provider || null; },
  });
  window.GhadeerQuranAudio = api;
})();
