/* Ghadeer optional local sound notifications.
   Remote Push is intentionally not enabled until a VAPID sender is configured server-side. */
(function(){
  const KEY='ghadeer_notification_settings_v1';
  const defaults={sound:true,announcements:true,coffee:true,outings:true,messages:true,dhikr:true,push:false};
  function get(){try{return {...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return {...defaults}}}
  function save(v){localStorage.setItem(KEY,JSON.stringify(v));return v}
  async function requestPushPermission(){if(!('Notification'in window))return 'unsupported';return await Notification.requestPermission()}
  function play(){const s=get();if(!s.sound)return false;try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return false;const c=new C(),o=c.createOscillator(),g=c.createGain();o.frequency.value=880;g.gain.setValueAtTime(.0001,c.currentTime);g.gain.exponentialRampToValueAtTime(.08,c.currentTime+.02);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.18);o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+.2);return true}catch{return false}}
  function notify(title,body,type='announcements'){const s=get();if(!s[type])return false;play();if(s.push&&'Notification'in window&&Notification.permission==='granted'){new Notification(title,{body,tag:'ghadeer-'+type})}return true}
  window.GhadeerNotifications={get,save,requestPushPermission,play,notify};
})();
