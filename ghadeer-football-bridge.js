/* Bridge: keep the football center in-app and route the main football tile to the canonical v2 center. */
(()=>{'use strict';
function load(){if(window.GhadeerFootballV2)return;if(document.querySelector('script[data-ghadeer-football-v2]'))return;const s=document.createElement('script');s.src='/ghadeer-football-v2.js?v=20260930.2';s.defer=true;s.dataset.ghadeerFootballV2='1';document.head.appendChild(s)}
function patch(){document.querySelectorAll('[data-gh4="ghFootball"]').forEach(b=>{b.onclick=()=>window.GhadeerFootballV2?.renderLeague?.('spl')});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{load();setTimeout(patch,700)},{once:true});else{load();setTimeout(patch,700)}
})();
