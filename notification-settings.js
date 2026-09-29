/* Ghadeer notification controls.
   Local sound is available now. Remote Push remains disabled until a server-side VAPID sender is configured. */
(function(){
  const KEY='ghadeer_notification_settings_v1';
  const defaults={sound:true,announcements:true,coffee:true,outings:true,messages:true,dhikr:true,push:false};
  const labels={announcements:'📢 أخبار الحي',coffee:'☕ القهوة',outings:'🚐 الطلعات',messages:'💬 الرسائل',dhikr:'🌿 الذكر'};
  function get(){try{return {...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return {...defaults}}}
  function save(v){localStorage.setItem(KEY,JSON.stringify(v));return v}
  async function requestPushPermission(){if(!('Notification'in window))return 'unsupported';return await Notification.requestPermission()}
  function play(){const s=get();if(!s.sound)return false;try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return false;const c=new C(),o=c.createOscillator(),g=c.createGain();o.frequency.value=880;g.gain.setValueAtTime(.0001,c.currentTime);g.gain.exponentialRampToValueAtTime(.08,c.currentTime+.02);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.18);o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+.2);return true}catch{return false}}
  function notify(title,body,type='announcements'){const s=get();if(!s[type])return false;play();if(s.push&&'Notification'in window&&Notification.permission==='granted'){new Notification(title,{body,tag:'ghadeer-'+type})}return true}
  function openSettings(){
    let m=document.getElementById('notificationSettingsModal');
    if(!m){m=document.createElement('div');m.id='notificationSettingsModal';m.className='modal hidden';m.innerHTML='<div class="modal-card"><h2>🔔 إعدادات الإشعارات</h2><p class="muted">اختر التنبيهات التي تريدها. الصوت اختياري ولن يعمل إلا بعد تفاعل المستخدم مع الجهاز.</p><div id="notificationSettingsBody"></div><div class="top-actions"><button id="notificationTestSound" class="btn secondary">🔊 اختبار الصوت</button><button id="notificationClose" class="btn primary">حفظ وإغلاق</button></div><div id="notificationStatus" class="status"></div></div>';document.body.appendChild(m);document.getElementById('notificationClose').onclick=()=>{m.classList.add('hidden');};document.getElementById('notificationTestSound').onclick=()=>{play();const s=document.getElementById('notificationStatus');s.textContent='تم اختبار الصوت.';s.className='status ok'};}
    const s=get(),body=document.getElementById('notificationSettingsBody');
    body.innerHTML='<label class="check"><input type="checkbox" id="notif_sound"> 🔊 صوت التنبيه</label>'+Object.entries(labels).map(([k,v])=>`<label class="check"><input type="checkbox" data-notif="${k}"> ${v}</label>`).join('')+'<label class="check"><input type="checkbox" id="notif_push"> 🔔 إشعارات الجهاز</label>';
    document.getElementById('notif_sound').checked=!!s.sound;document.querySelectorAll('[data-notif]').forEach(x=>x.checked=!!s[x.dataset.notif]);document.getElementById('notif_push').checked=!!s.push;
    document.getElementById('notif_push').onchange=async e=>{if(e.target.checked){const p=await requestPushPermission();if(p!=='granted'){e.target.checked=false;document.getElementById('notificationStatus').textContent='لم يتم منح إذن إشعارات الجهاز.';document.getElementById('notificationStatus').className='status bad'}}};
    document.getElementById('notificationClose').onclick=()=>{const n={...get(),sound:document.getElementById('notif_sound').checked,push:document.getElementById('notif_push').checked};document.querySelectorAll('[data-notif]').forEach(x=>n[x.dataset.notif]=x.checked);save(n);m.classList.add('hidden');};
    m.classList.remove('hidden');
  }
  function installButton(){if(document.getElementById('notificationSettingsBtn'))return;const host=document.querySelector('.appbar-head');if(!host)return;const b=document.createElement('button');b.id='notificationSettingsBtn';b.className='btn top-login';b.textContent='🔔 الإشعارات';b.onclick=openSettings;host.appendChild(b)}
  function init(){installButton();new MutationObserver(installButton).observe(document.body,{childList:true,subtree:true});}
  window.GhadeerNotifications={get,save,requestPushPermission,play,notify,openSettings};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
