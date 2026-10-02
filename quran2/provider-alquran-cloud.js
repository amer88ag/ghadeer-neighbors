/* Quran V2 provider adapter: Al Quran Cloud public API/CDN. */
(function () {
  'use strict';
  const API='https://api.alquran.cloud/v1';
  const EDITION='quran-uthmani-quran-academy';
  const AUDIO='ar.alafasy';
  const DB='ghadeer-quran2-cache-v1';
  const STORE='quran';
  const openDb=()=>new Promise((resolve,reject)=>{if(!('indexedDB' in window))return resolve(null);const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE)};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
  async function read(key){try{const db=await openDb();if(!db)return null;return await new Promise((res,rej)=>{const t=db.transaction(STORE,'readonly');const q=t.objectStore(STORE).get(key);q.onsuccess=()=>res(q.result||null);q.onerror=()=>rej(q.error)})}catch(_){return null}}
  async function write(key,value){try{const db=await openDb();if(!db)return;await new Promise((res,rej)=>{const t=db.transaction(STORE,'readwrite');t.objectStore(STORE).put(value,key);t.oncomplete=res;t.onerror=()=>rej(t.error)})}catch(_){} }
  async function getJson(url){const cached=await read(url);if(navigator.onLine===false&&cached)return cached;try{const r=await fetch(url,{headers:{Accept:'application/json'}});if(!r.ok)throw new Error('Quran provider HTTP '+r.status);const j=await r.json();if(j.code!==200)throw new Error('Quran provider returned an invalid response');await write(url,j);return j}catch(e){if(cached)return cached;throw e}}
  function normalize(data){return (data?.ayahs||[]).map(a=>({number:a.number,numberInSurah:a.numberInSurah,text:a.text,surah:a.surah?.number||null,page:a.page,juz:a.juz,manzil:a.manzil,hizbQuarter:a.hizbQuarter,sajda:a.sajda}))}
  const verifySurahs=surahs=>Array.isArray(surahs)&&surahs.length===114&&surahs.every((s,i)=>Number(s.number)===i+1);
  const provider={id:'alquran-cloud',edition:EDITION,verified:false,surahMeta:[],getPage:async page=>{const j=await getJson(`${API}/page/${encodeURIComponent(page)}/${EDITION}`);return normalize(j.data)},getSurah:async surah=>{const key=`surah:${surah}:${EDITION}`;const cached=await read(key);if(cached?.data?.number)return {number:cached.data.number,name:cached.data.name,englishName:cached.data.englishName,numberOfAyahs:cached.data.numberOfAyahs,ayahs:normalize(cached.data)};const j=await getJson(`${API}/surah/${encodeURIComponent(surah)}/${EDITION}`);await write(key,j);return {number:j.data.number,name:j.data.name,englishName:j.data.englishName,numberOfAyahs:j.data.numberOfAyahs,ayahs:normalize(j.data)}},getAyah:async key=>{const j=await getJson(`${API}/ayah/${encodeURIComponent(key)}/${EDITION}`);return normalize({ayahs:[j.data]})[0]},search:async text=>{const j=await getJson(`${API}/search/${encodeURIComponent(text)}/all/ar`);return (j.data?.matches||[]).filter(x=>x.edition?.identifier===EDITION).map(x=>({key:`${x.surah?.number}:${x.numberInSurah}`,text:x.text,surah:x.surah?.name}))},audioUrl:ayahNumber=>`https://cdn.islamic.network/quran/audio/128/${AUDIO}/${encodeURIComponent(ayahNumber)}.mp3`,async verify(){
    let surahs=[];let source='surah-list';
    try{const j=await getJson(`${API}/surah`);surahs=(j.data||[]).filter(s=>s?.number&&s?.name);if(!verifySurahs(surahs))throw new Error('Quran surah list is incomplete');}
    catch(primaryError){
      const cached=await read(`${API}/quran/${EDITION}`);
      if(cached?.data?.surahs&&verifySurahs(cached.data.surahs))surahs=cached.data.surahs;
      else {const j=await getJson(`${API}/quran/${EDITION}`);surahs=j.data?.surahs||[];if(!verifySurahs(surahs))throw primaryError;source='quran';}
    }
    this.surahMeta=surahs.map(s=>({number:Number(s.number),name:s.name,englishName:s.englishName,numberOfAyahs:s.numberOfAyahs}));
    this.verified=true;
    return {verified:true,surahs:this.surahMeta.length,edition:EDITION,source,meta:this.surahMeta};
  }};
  window.GhadeerQuran2AlQuranCloud=Object.freeze(provider);
  if(window.GhadeerQuran2ContentProvider){Object.assign(window.GhadeerQuran2ContentProvider,provider);}
  if(window.GhadeerQuran2Search?.configure)window.GhadeerQuran2Search.configure(provider);
})();