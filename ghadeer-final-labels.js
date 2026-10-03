/* Ghadeer final labels — one canonical Quran entry named القرآن الكريم. */
(()=>{
 'use strict';
 function apply(){
  document.querySelectorAll('.gh4-tile,.gh-v3-tile,.q5-card').forEach(el=>{
   const text=(el.textContent||'').trim();
   if(text.includes('القرآن والأذكار')||text==='القرآن'||text.includes('القرآن')||el.dataset.ghadeerWardi==='1'){
    const b=el.querySelector('b'); if(b)b.textContent='القرآن الكريم';
    const small=el.querySelector('small'); if(small)small.textContent='المصحف • التلاوة • التجويد • الحفظ';
    el.dataset.ghadeerQuran='1';
    delete el.dataset.ghadeerWardi;
   }
  });
  const page=document.getElementById('dhikr');
  if(page){const h=page.querySelector('h2');if(h&&(/القرآن|وردي/.test(h.textContent)))h.textContent='📖 القرآن الكريم';}
 }
 function boot(){apply();[300,900,1800,3500,6000].forEach(x=>setTimeout(apply,x))}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
