/* Quran V2 navigation contract: keeps navigation local to the module. */
(function () {
  const state = { stack: [] };
  const api = Object.freeze({
    open(view) { if (view) state.stack.push(String(view)); },
    back() { return state.stack.pop() || null; },
    current() { return state.stack[state.stack.length - 1] || null; },
    reset() { state.stack.length = 0; }
  });
  window.GhadeerQuran2Navigation = api;
})();
