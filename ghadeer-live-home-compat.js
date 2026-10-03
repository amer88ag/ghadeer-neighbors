/* Live Home compatibility/migration bridge: old home data hooks are hosted by the new live home, not by a second UI. */
(()=>{
'use strict';
function install(){
 const root=document.getElementById('ghLiveHome'); if(!root)return false;
 let bridge=root.querySelector('[data-legacy-home-bridge]');
 if(!bridge){bridge=document.createElement('div');bridge.hidden=true;bridge.setAttribute('data-legacy-home-bridge','true');root.appendChild(bridge)}
 const ids=['nextCoffee','nextOuting','latestAnnouncement','memberCount','messageCount'];
 for(const id of ids)if(!document.getElementById(id)){const e=document.createElement('span');e.id=id;bridge.appendChild(e)}
 if(!document.getElementById('refreshBtn')){const b=document.createElement('button');b.id='refreshBtn';b.hidden=true;bridge.appendChild(b)}
 if(!root.querySelector('[data-migrated-home-widgets]')){
  const card=document.createElement('div');card.setAttribute('data-migrated-home-widgets','true');card.className='lh5-card lh5-wide';card.style.marginTop='10px';
  card.innerHTML=`<h3>🕌 مواقيت الصلاة والطقس</h3><div class="lh5-muted" id="prayerLocationLabel">استخدم موقع جهازك للحصول على مواقيات موقعك الحالي. لا يتم حفظ الإحداثيات.</div><div id="prayerTimesToday" style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin:9px 0"><span>الفجر<br><b id="ptFajr">—</b></span><span>الظهر<br><b id="ptDhuhr">—</b></span><span>العصر<br><b id="ptAsr">—</b></span><span>المغرب<br><b id="ptMaghrib">—</b></span><span>العشاء<br><b id="ptIsha">—</b></span></div><div style="display:flex;gap:6px;flex-wrap:wrap"><button id="homePrayerBtn" class="lh5-btn" type="button">📍 استخدام موقعي</button><button id="prayerRefreshBtn" class="lh5-btn" type="button">🔄 تحديث</button><button id="homeWeatherBtn" class="lh5-btn" type="button">🌤️ الطقس</button><button id="logoutBtn" class="lh5-btn" type="button">🚪 خروج</button></div><div id="prayerStatus" class="lh5-muted" style="margin-top:7px"></div>`;
  const services=root.querySelector('#lhServices');services?.parentElement?.insertAdjacentElement('afterend',card);
 }
 return true;
}
function boot(){if(install())return;setTimeout(boot,50)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
