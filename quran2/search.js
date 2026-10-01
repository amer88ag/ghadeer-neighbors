/* Quran V2 search contract. Search results must come from the verified Quran content index. */
(function () {
  let provider = null;
  const api = Object.freeze({
    configure(searchProvider) { provider = searchProvider || null; },
    async query(text) {
      const q = String(text || '').trim();
      if (!q) return [];
      if (!provider || typeof provider.search !== 'function') throw new Error('Verified Quran search provider is not configured');
      return provider.search(q);
    }
  });
  window.GhadeerQuran2Search = api;
})();
