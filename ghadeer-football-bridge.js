/* Bridge: ensure the football center is loaded and local Ghadeer League is explicitly under it. */
(()=>{'use strict';
function load(){if(document.querySelector('script[data-ghadeer-football-v1]'))return;const s=document.createElement('script');s.src='/ghadeer-football-v1.js?v=20260930.1';s.defer=true;s.dataset.ghadeerFootballV1='1';document.head.appendChild(s)}
function patch(){document.querySelectorAll('[data-gh4="ghFootball"]').forEach(b=>{b.onclick=()=>window.GhadeerFootballV1?.render('spl')});const hub=document.getElementById('ghServicesHub');if(hub&&!hub.dataset.footballPatched){hub.dataset.footballPatched='1';}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{load();setTimeout(patch,700)},{once:true});else{load();setTimeout(patch,700)}
})();