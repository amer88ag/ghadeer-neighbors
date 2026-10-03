/* Modern home action hotfix v1 — keeps modern quick actions on canonical navigation. */
(()=>{'use strict';
function wire(){
  const ui=window.GhadeerUIv5;
  if(!ui)return;
  if(!ui.more)ui.more=()=>{
    const b=document.querySelector('.gh5-nav [data-gh5="more"]');
    if(b){b.click();return true;}
    return window.openPage?.('more');
  };
}
function boot(){wire();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
new MutationObserver(wire).observe(document.documentElement,{childList:true,subtree:true});
})();
