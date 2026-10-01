/* Quran V2 independent module entrypoint. Loads its own internal contracts without owning the app renderer/history. */
(function () {
  const state = Object.freeze({ serviceKey: 'svc_quran2', route: '/quran2', version: '2.0.0', lifecycle: 'draft' });
  const scripts = ['reader-contract.js','reader-model.js','reader-view.js','navigation.js','audio.js','bookmarks.js','content-schema.js','tafsir.js','tajweed.js','hifz.js','recitation.js','search.js','offline.js','settings.js'];
  function loadOne(name){return new Promise((resolve,reject)=>{if(document.querySelector(`script[data-quran2="${name}"]`))return resolve();const s=document.createElement('script');s.src=`/quran2/${name}`;s.dataset.quran2=name;s.onload=resolve;s.onerror=()=>reject(new Error('Failed to load Quran V2 module: '+name));document.head.appendChild(s);});}
  async function mount(){for(const name of scripts)await loadOne(name);return state;}
  window.GhadeerQuran2Module=Object.freeze({getState:()=>({...state}),mount});
})();
