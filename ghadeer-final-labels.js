/* Ghadeer final canonical labels/fixes — Quran is always Quran, never Wardi. */
(()=>{
 'use strict';
 const apply=()=>{
  // Canonical Quran naming everywhere in the rendered UI.
  document.querySelectorAll('.gh4-tile,.gh-v3-tile,.q5-card,.lh5-tile,[data-service]').forEach(el=>{
   const key=el.dataset?.service||el.dataset?.gh5||el.dataset?.route||'';
   const text=(el.textContent||'').trim();
   if(key==='wardi'||key==='quran'||/وردي/.test(text)||/القرآن والأذكار/.test(text)||text==='القرآن'){
    const label=el.querySelector('.lh5-label,b,small');
    if(label && el.classList.contains('lh5-tile')) label.textContent='القرآن';
    else if(label && /وردي|القرآن/.test(label.textContent||'')) label.textContent='القرآن';
    el.dataset.service='quran';
    el.dataset.gh5='quran';
    el.dataset.quranCanonical='1';
   }
  });
  const page=document.getElementById('dhikr');
  if(page){const h=page.querySelector('h2');if(h&&/وردي|القرآن/.test(h.textContent||''))h.textContent='📖 القرآن الكريم';}
  // Remove the old green animated prayer progress bar; prayer times are data, not a decorative animation.
  document.querySelectorAll('.lh5-progress').forEach(el=>el.remove());
  // The live-home contains a legacy duplicate bottom bar. Keep one canonical bottom nav only.
  document.querySelectorAll('#ghLiveHome .lh5-bottom').forEach(el=>el.remove());
 };
 const boot=()=>{apply();[100,400,1000,2000,4000,7000].forEach(x=>setTimeout(apply,x));};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
