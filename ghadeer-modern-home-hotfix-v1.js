/* Modern home runtime wiring: keeps the new shell independent from legacy widgets. */
(()=>{'use strict';
function wire(){
 document.body.classList.add('gh-modern');
 const home=document.getElementById('gh5Home');
 if(!home||home.dataset.modernRuntime==='1')return;
 home.dataset.modernRuntime='1';
 const weather=home.querySelector('[data-weather]');
 const root=home.querySelector('.ghm-weather-prayer');
 if(weather&&window.GhadeerHomeWidgets?.loadWeather)window.GhadeerHomeWidgets.loadWeather(weather);
 if(root&&window.GhadeerHomeWidgets?.loadPrayer)window.GhadeerHomeWidgets.loadPrayer(root);
 const dh=home.querySelector('[data-dhikr-text]'), next=home.querySelector('[data-dhikr-next]');
 const items=['سبحان الله وبحمده','سبحان الله العظيم','لا إله إلا الله وحده لا شريك له','اللهم صل وسلم على نبينا محمد','أستغفر الله وأتوب إليه','لا حول ولا قوة إلا بالله'];
 let i=0;if(dh)dh.textContent=items[0];if(next)next.addEventListener('click',e=>{e.preventDefault();i=(i+1)%items.length;if(dh)dh.textContent=items[i]},{passive:false});
}
function boot(){wire();new MutationObserver(wire).observe(document.body,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
