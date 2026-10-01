/* Quran V2 persistent progress contract. */
(function () {
  'use strict';
  const KEY = 'ghadeer.quran2.progress.v1';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{"lastLocation":null,"bookmarks":[]}'); } catch (_) { return { lastLocation:null, bookmarks:[] }; } };
  const save = state => localStorage.setItem(KEY, JSON.stringify(state));
  const api = Object.freeze({
    getState() { const s=load(); return { lastLocation:s.lastLocation, bookmarks:[...(s.bookmarks||[])] }; },
    setLastLocation(location) { const s=load(); s.lastLocation=location&&typeof location==='object'?{...location}:null; save(s); },
    addBookmark(location) { if(!location||typeof location!=='object') return; const s=load(); const item={...location,createdAt:new Date().toISOString()}; if(!s.bookmarks.some(x=>x.surah===item.surah&&x.ayah===item.ayah)) s.bookmarks.push(item); save(s); },
    removeBookmark(index) { const s=load(); if(Number.isInteger(index)&&index>=0&&index<s.bookmarks.length){s.bookmarks.splice(index,1);save(s);} },
    clear() { localStorage.removeItem(KEY); }
  });
  window.GhadeerQuran2Bookmarks=api;
})();
