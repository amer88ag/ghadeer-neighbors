/* Quran V2 memorization model. It records learning state only; no claim of recitation correctness is made here. */
(function () {
  const state = { range: null, mode: 'listen', attempts: 0, completed: false };
  const api = Object.freeze({
    getState() { return { ...state }; },
    start(range, mode) { state.range = range && typeof range === 'object' ? { ...range } : null; state.mode = mode || 'listen'; state.attempts = 0; state.completed = false; },
    recordAttempt() { state.attempts += 1; },
    complete() { state.completed = true; }
  });
  window.GhadeerQuran2Hifz = api;
})();
