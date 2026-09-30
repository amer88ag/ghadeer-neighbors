/* Ghadeer final labels — one canonical Quran entry named Wardi. */
(()=>{
 'use strict';
 function apply(){
  document.querySelectorAll('.gh4-tile,.gh-v3-tile,.q5-card').forEach(el=>{
   const text=(el.textContent||'').trim();
   if(text.includes('القرآن والأذكار')||text==='القرآن'||text.includes('القرآن')){
    const b=el.querySelector('b'); if(b)b.textContent='وردي';
    const small=el.querySelector('small'); if(small)small.textContent='المصحف وخدمات التلاوة والحفظ';
    el.dataset.ghadeerWardi='1';
   }
  });
  const page=document.getElementById('dhikr');
  if(page){const h=page.querySelector('h2');if(h&&/القرآن/.test(h.textContent))h.textContent='📖 وردي';}
 }
 function boot(){apply();[300,900,1800,3500,6000].forEach(x=>setTimeout(apply,x))}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
