/* Quran V2 Offline layer: local content lifecycle contract. */
(function () {
  const state = { ready: false, downloaded: [], pending: [] };
  const api = Object.freeze({
    getState() { return { ...state, downloaded: [...state.downloaded], pending: [...state.pending] }; },
    setReady(value) { state.ready = Boolean(value); },
    markDownloaded(contentKey) { if (contentKey && !state.downloaded.includes(contentKey)) state.downloaded.push(contentKey); },
    markPending(contentKey) { if (contentKey && !state.pending.includes(contentKey)) state.pending.push(contentKey); },
  });
  window.GhadeerQuranOffline = api;
})();
