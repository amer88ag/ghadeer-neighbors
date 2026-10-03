/* Live Home compatibility bridge: preserves data hooks used by the existing app logic without restoring the legacy UI. */
(()=>{
'use strict';
function install(){
 const root=document.getElementById('ghLiveHome'); if(!root)return false;
 const ids=['nextCoffee','nextOuting','latestAnnouncement','memberCount','messageCount'];
 let bridge=root.querySelector('[data-legacy-home-bridge]');
 if(!bridge){bridge=document.createElement('div');bridge.hidden=true;bridge.setAttribute('data-legacy-home-bridge','true');root.appendChild(bridge)}
 for(const id of ids)if(!document.getElementById(id)){const e=document.createElement('span');e.id=id;bridge.appendChild(e)}
 if(!document.getElementById('refreshBtn')){const b=document.createElement('button');b.id='refreshBtn';b.hidden=true;bridge.appendChild(b);b.addEventListener('click',()=>{window.GhadeerLiveHome?.refresh?.()})}
 return true;
}
function boot(){if(install())return;setTimeout(boot,50)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
