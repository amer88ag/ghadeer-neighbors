/* Quran V2 local progress contract. Persistence adapter is intentionally replaceable. */
(function () {
  const state = { lastLocation: null, bookmarks: [] };
  const api = Object.freeze({
    getState() { return { lastLocation: state.lastLocation, bookmarks: [...state.bookmarks] }; },
    setLastLocation(location) { state.lastLocation = location && typeof location === 'object' ? { ...location } : null; },
    addBookmark(location) { if (!location || typeof location !== 'object') return; state.bookmarks.push({ ...location }); },
    removeBookmark(index) { if (Number.isInteger(index) && index >= 0) state.bookmarks.splice(index, 1); }
  });
  window.GhadeerQuran2Bookmarks = api;
})();
