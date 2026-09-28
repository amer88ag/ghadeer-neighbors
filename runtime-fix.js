(()=>{
  function bind(){
    const p=window.loadPrayerByMemberLocation;
    const btns=['homePrayerBtn','prayerRefreshBtn'];
    btns.forEach(id=>{const b=document.getElementById(id);if(b&&typeof p==='function')b.onclick=p;});
    const w=document.getElementById('homeWeatherBtn');
    if(w){w.onclick=()=>{const box=document.getElementById('ghWeatherBox');if(box&&typeof box.onclick==='function')box.onclick();};}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
