/* Quran V2 runtime audio controller. */
(function () {
  'use strict';
  const state = { source: null, playing: false, rate: 1, repeat: 0, currentAyah: null };
  let attached = false;
  const api = {
    getState() { return { ...state }; },
    setSource(source) { state.source = source || null; },
    setPlaying(value) { state.playing = Boolean(value); },
    setRate(value) { state.rate = Math.max(0.5, Math.min(2, Number(value) || 1)); const a=document.querySelector('[data-q2="audio"]'); if(a)a.playbackRate=state.rate; },
    setRepeat(value) { state.repeat = Math.max(0, Math.floor(Number(value) || 0)); },
    attach(audio, root) {
      if (!audio || attached) return;
      attached = true;
      const highlight = () => { root?.querySelectorAll('.quran2-ayah.is-playing').forEach(x=>x.classList.remove('is-playing')); const n=audio.dataset.currentAyah; if(n) root?.querySelector(`.quran2-ayah[data-ayah-number="${CSS.escape(n)}"]`)?.classList.add('is-playing'); };
      audio.addEventListener('play',()=>{state.playing=true;highlight();});
      audio.addEventListener('pause',()=>{state.playing=false;});
      audio.addEventListener('ended',()=>{ if(state.repeat>0){ state.repeat-=1; audio.currentTime=0; audio.play().catch(()=>{}); } else { state.playing=false; root?.querySelectorAll('.quran2-ayah.is-playing').forEach(x=>x.classList.remove('is-playing')); }});
      audio.addEventListener('ratechange',()=>{state.rate=audio.playbackRate;});
      root?.addEventListener('click',e=>{const b=e.target.closest('.q2-ayah-menu');if(!b)return;const row=b.closest('.quran2-ayah');if(!row)return;const n=row.dataset.ayahNumber; if(n){state.currentAyah=n; audio.dataset.currentAyah=n; state.source=audio.src; highlight();}});
      let controls=root?.querySelector('.quran2-player');
      if(controls && !controls.querySelector('[data-q2="repeat"]')){const wrap=document.createElement('label');wrap.textContent=' تكرار ';const sel=document.createElement('select');sel.dataset.q2='repeat';['0','1','2','3','5'].forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v==='0'?'بدون':v;sel.appendChild(o)});sel.addEventListener('change',()=>api.setRepeat(sel.value));wrap.appendChild(sel);controls.appendChild(wrap);}
    }
  };
  window.GhadeerQuran2Audio=Object.freeze(api);
  const tryAttach=()=>{const audio=document.querySelector('[data-q2="audio"]');const root=audio?.closest('.quran2-shell');if(audio&&root)api.attach(audio,root);};
  new MutationObserver(tryAttach).observe(document.documentElement,{childList:true,subtree:true});
  tryAttach();
})();
