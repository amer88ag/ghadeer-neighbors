/* Quran V2 offline contract. Only verified downloaded content may be marked available. */
(function () {
  const state = { available: false, version: null, downloadedAt: null };
  const api = Object.freeze({
    getState() { return { ...state }; },
    markDownloaded(version) { if (!version) return; state.available = true; state.version = String(version); state.downloadedAt = new Date().toISOString(); },
    clear() { state.available = false; state.version = null; state.downloadedAt = null; }
  });
  window.GhadeerQuran2Offline = api;
})();
