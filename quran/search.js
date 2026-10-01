/* Quran V2 Search layer: provider-independent query contract. */
(function () {
  const state = { query: '', results: [], source: null };
  const api = Object.freeze({
    getState() { return { ...state, results: [...state.results] }; },
    setSource(source) { state.source = source || null; },
    setQuery(query) { state.query = String(query || ''); },
    setResults(results) { state.results = Array.isArray(results) ? [...results] : []; },
    clear() { state.query = ''; state.results = []; },
  });
  window.GhadeerQuranSearch = api;
})();
