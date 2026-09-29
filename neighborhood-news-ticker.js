/* جيران الغدير — شريط أخبار الحي
 * يعتمد على state.announcements الموجودة أصلًا؛ لا ينشئ مصدر بيانات جديدًا.
 */
(() => {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const $ = id => document.getElementById(id);
  function getState(){
    try{
      if(typeof window.GHADEER_CTX==='function') return window.GHADEER_CTX()?.state || null;
    }catch(e){ console.error('[ghadeer news]',e); }
    return null;
  }

  function ensureStyles(){
    if ($('neighborhoodNewsTickerStyles')) return;
    const s=document.createElement('style');
    s.id='neighborhoodNewsTickerStyles';
    s.textContent=`
      .neighborhood-news{background:#fff;border:1px solid var(--line);border-radius:16px;margin:0 0 12px;overflow:hidden}
      .neighborhood-news-head{display:flex;align-items:center;gap:8px;padding:9px 12px;border-bottom:1px solid var(--line);font-weight:800;color:var(--g)}
      .neighborhood-news-track{display:flex;gap:24px;overflow-x:auto;scrollbar-width:none;padding:10px 12px;-webkit-overflow-scrolling:touch}
      .neighborhood-news-track::-webkit-scrollbar{display:none}
      .neighborhood-news-item{flex:0 0 auto;display:flex;align-items:center;gap:7px;max-width:min(78vw,520px);white-space:nowrap}
      .neighborhood-news-item b{overflow:hidden;text-overflow:ellipsis}
      .neighborhood-news-item span{color:var(--muted);font-size:12px;overflow:hidden;text-overflow:ellipsis}
      .neighborhood-news-empty{padding:10px 12px;color:var(--muted);font-size:13px}
    `;
    document.head.appendChild(s);
  }

  function render(){
    const home=$('home');
    if(!home) return;
    ensureStyles();
    let box=$('neighborhoodNewsTicker');
    if(!box){
      box=document.createElement('section');
      box.id='neighborhoodNewsTicker';
      box.className='neighborhood-news';
      const hero=home.querySelector('.hero');
      if(hero?.parentNode) hero.parentNode.insertBefore(box, hero.nextSibling);
      else home.prepend(box);
    }
    const state=getState();
    const rows=Array.isArray(state?.announcements)?state.announcements:[];
    const items=rows.filter(x=>x && !x.is_occasion).sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0)).slice(0,12);
    if(!items.length){
      box.innerHTML='<div class="neighborhood-news-head">📰 أخبار الحي</div><div class="neighborhood-news-empty">لا توجد أخبار أو إعلانات منشورة حاليًا.</div>';
      return;
    }
    box.innerHTML='<div class="neighborhood-news-head">📰 أخبار الحي <span class="muted">— أحدث الإعلانات</span></div><div class="neighborhood-news-track">'+items.map(x=>`<div class="neighborhood-news-item"><span>•</span><b>${esc(x.title||'إعلان')}</b><span>${esc(String(x.message||'').slice(0,120))}</span></div>`).join('')+'</div>';
  }

  function hook(){
    const original=window.renderHome;
    if(typeof original==='function' && !window.__ghadeerNewsHooked){
      window.renderHome=function(...args){ const r=original.apply(this,args); render(); return r; };
      window.__ghadeerNewsHooked=true;
    }
    render();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(hook,150));
  else setTimeout(hook,150);
  setInterval(()=>{ if(!window.__ghadeerNewsHooked) hook(); else render(); },3000);
})();
