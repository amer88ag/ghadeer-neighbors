/* Ghadeer final canonical UI fixes — Quran, back navigation, duplicate controls. */
(()=>{
 'use strict';
 const apply=()=>{
  document.querySelectorAll('.gh4-tile,.gh-v3-tile,.q5-card,.lh5-tile,[data-service]').forEach(el=>{
   const key=el.dataset?.service||el.dataset?.gh5||el.dataset?.route||'';
   const text=(el.textContent||'').trim();
   if(key==='wardi'||key==='quran'||/وردي/.test(text)||/القرآن والأذكار/.test(text)||text==='القرآن'){
    const label=el.querySelector('.lh5-label,b,small');
    if(label && el.classList.contains('lh5-tile')) label.textContent='القرآن';
    else if(label && /وردي|القرآن/.test(label.textContent||'')) label.textContent='القرآن';
    const icon=el.querySelector('.lh5-icon');if(icon)icon.textContent='📖';
    el.dataset.service='quran';el.dataset.gh5='quran';el.dataset.quranCanonical='1';
   }
  });
  const page=document.getElementById('dhikr');
  if(page){const h=page.querySelector('h2');if(h&&/وردي|القرآن/.test(h.textContent||''))h.textContent='📖 القرآن الكريم';}
  // Prayer progress was decorative and misleading; prayer times remain static data.
  document.querySelectorAll('.lh5-progress').forEach(el=>el.remove());
  // Keep exactly one bottom navigation.
  document.querySelectorAll('#ghLiveHome .lh5-bottom').forEach(el=>el.remove());
 };
 const wireBack=()=>{
  document.querySelectorAll('button,a,[role="button"]').forEach(el=>{
   if(el.dataset.ghBackWired==='1')return;
   const text=(el.textContent||'').trim();
   if(/^↩?\s*رجوع$|^عودة$|^رجوع$/.test(text)){
    el.dataset.ghBackWired='1';el.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();try{window.GHADEER_ICON_ROUTES?.open?.('live-home')||window.GhadeerLiveHome?.open?.()}catch(_){window.openPage?.('home')}},true);
   }
  });
 };
 const boot=()=>{apply();wireBack();[100,400,1000,2000,4000,7000].forEach(x=>setTimeout(()=>{apply();wireBack()},x));};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
