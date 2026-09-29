/* جيران الغدير — شريط الذكر المختصر */
(() => {
  const items=[
    'سبحان الله وبحمده',
    'سبحان الله العظيم',
    'لا إله إلا الله وحده لا شريك له',
    'اللهم صل وسلم على نبينا محمد',
    'أستغفر الله وأتوب إليه',
    'لا حول ولا قوة إلا بالله'
  ];
  const $=id=>document.getElementById(id);
  let index=Math.floor(Date.now()/60000)%items.length;
  function styles(){
    if($('dhikrTickerStyles'))return;
    const s=document.createElement('style');s.id='dhikrTickerStyles';
    s.textContent='.dhikr-ticker{display:flex;align-items:center;gap:9px;background:#f4faf6;border:1px solid #dcebe1;color:var(--g);border-radius:14px;padding:8px 11px;margin:0 0 12px;font-size:13px;overflow:hidden}.dhikr-ticker strong{white-space:nowrap}.dhikr-ticker-text{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:700}.dhikr-ticker-btn{border:0;background:transparent;color:var(--g);font-size:17px;padding:2px 4px}';
    document.head.appendChild(s);
  }
  function render(){
    const home=$('home');if(!home)return;styles();
    let box=$('dhikrTicker');
    if(!box){box=document.createElement('div');box.id='dhikrTicker';box.className='dhikr-ticker';const hero=home.querySelector('.hero');if(hero?.parentNode)hero.parentNode.insertBefore(box,hero);else home.prepend(box);}
    box.innerHTML='<strong>🤲 الذكر</strong><span class="dhikr-ticker-text" id="dhikrTickerText"></span><button class="dhikr-ticker-btn" id="dhikrTickerNext" aria-label="ذكر آخر">›</button>';
    $('dhikrTickerText').textContent=items[index%items.length];
    $('dhikrTickerNext').onclick=()=>{index=(index+1)%items.length;$('dhikrTickerText').textContent=items[index];};
  }
  function init(){render();setInterval(()=>{index=(index+1)%items.length;const t=$('dhikrTickerText');if(t)t.textContent=items[index];},20000);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,120));else setTimeout(init,120);
})();
