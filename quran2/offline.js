/* Quran V2 offline storage. Downloads and verifies all 114 surahs before marking Offline available. */
(function () {
  'use strict';
  const DB = 'ghadeer-quran2-offline-v1';
  const STORE = 'surahs';
  const state = { available: false, version: null, downloadedAt: null, progress: 0, downloading: false };
  const openDb = () => new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return resolve(null);
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(STORE)) r.result.createObjectStore(STORE); };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  const put = async (key, value) => { const db = await openDb(); if (!db) throw new Error('IndexedDB unavailable'); return new Promise((res, rej) => { const t=db.transaction(STORE,'readwrite'); t.objectStore(STORE).put(value,key); t.oncomplete=res; t.onerror=()=>rej(t.error); }); };
  const get = async key => { const db=await openDb(); if(!db)return null; return new Promise((res,rej)=>{const t=db.transaction(STORE,'readonly');const q=t.objectStore(STORE).get(key);q.onsuccess=()=>res(q.result||null);q.onerror=()=>rej(q.error);}); };
  const count = async () => { const db=await openDb(); if(!db)return 0; return new Promise((res,rej)=>{const t=db.transaction(STORE,'readonly');const q=t.objectStore(STORE).count();q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);}); };
  async function downloadAll(provider, version='uthmani-v1') {
    if (!provider || typeof provider.getSurah !== 'function') throw new Error('Quran provider unavailable');
    if (state.downloading) return false;
    state.downloading=true; state.progress=0;
    try {
      for (let n=1;n<=114;n++) {
        const surah=await provider.getSurah(n);
        if (!surah || !Array.isArray(surah.ayahs) || !surah.ayahs.length) throw new Error('Invalid surah '+n);
        await put(String(n), { version, surah });
        state.progress=n/114;
      }
      if (await count() !== 114) throw new Error('Offline verification failed');
      state.available=true; state.version=version; state.downloadedAt=new Date().toISOString();
      return true;
    } finally { state.downloading=false; }
  }
  async function getSurah(number) { const item=await get(String(number)); return item?.surah||null; }
  async function clear() { const db=await openDb(); if(db) await new Promise((res,rej)=>{const t=db.transaction(STORE,'readwrite');t.objectStore(STORE).clear();t.oncomplete=res;t.onerror=()=>rej(t.error);}); state.available=false;state.version=null;state.downloadedAt=null;state.progress=0; }
  window.GhadeerQuran2Offline=Object.freeze({getState:()=>({...state}),downloadAll,getSurah,clear});
})();
