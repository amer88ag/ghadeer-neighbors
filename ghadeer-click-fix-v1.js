/* Ghadeer click fix v2 — compatibility layer only.
   Routing authority is GHADEER_ICON_ROUTES; this file keeps dialogs and
   legacy references working without maintaining a second route map. */
(()=>{'use strict';
function go(key){
  const canonical=window.GHADEER_ICON_ROUTES;
  if(canonical?.open){
    try{return canonical.open(key)}catch(err){console.error('[Ghadeer] canonical route failed',key,err)}
  }
  if(key==='home') return window.GhadeerUIv5?.home?.();
  if(key==='services'||key==='services:help'||key==='services:market') return window.GhadeerUIv5?.services?.();
  if(key==='football'||['spl','uel','world','king','super','ghadeer'].includes(key)) return window.GhadeerFootballV2?.renderLeague?.(key==='football'?'spl':key);
  if(key==='wardi'||['read','recite','tajweed','tafsir','adhkar','hifz','marks','download'].includes(key)) return window.GhadeerUIv5?.wardi?.();
  if(key==='more') return window.GhadeerUIv5?.more?.();
  if(key==='logout') return window.logout?.()||window.signOut?.();
  return window.openPage?.(key);
}
function bind(){
  if(document.documentElement.dataset.ghClickFixV2==='1')return;
  document.documentElement.dataset.ghClickFixV2='1';
  document.addEventListener('click',e=>{
    const b=e.target.closest?.('[data-gh5]');
    if(!b||document.body.classList.contains('gh5-editing'))return;
    e.preventDefault();
    e.stopImmediatePropagation();
    Promise.resolve(go(b.dataset.gh5)).catch(err=>console.error('[Ghadeer] click route error',b.dataset.gh5,err));
  },true);
}
function ensureDialog(){
 if(document.getElementById('ghadeerDialog'))return document.getElementById('ghadeerDialog');
 const el=document.createElement('div');el.id='ghadeerDialog';el.className='modal hidden';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.innerHTML='<div class="modal-card" style="max-width:430px"><h2 id="ghadeerDialogTitle">تأكيد العملية</h2><p id="ghadeerDialogText" class="muted"></p><div class="top-actions"><button id="ghadeerDialogOk" class="btn danger">تأكيد</button><button id="ghadeerDialogCancel" class="btn secondary">إلغاء</button></div></div></div>';document.body.appendChild(el);return el;
}
function dialogConfirm(text,title='تأكيد العملية'){
 return new Promise(resolve=>{const el=ensureDialog(),ok=el.querySelector('#ghadeerDialogOk'),cancel=el.querySelector('#ghadeerDialogCancel'),heading=el.querySelector('#ghadeerDialogTitle'),body=el.querySelector('#ghadeerDialogText');heading.textContent=title;body.textContent=text;el.classList.remove('hidden');const close=v=>{el.classList.add('hidden');ok.onclick=null;cancel.onclick=null;document.removeEventListener('keydown',onKey);resolve(v)};const onKey=e=>{if(e.key==='Escape')close(false)};ok.onclick=()=>close(true);cancel.onclick=()=>close(false);document.addEventListener('keydown',onKey);ok.focus()})}
window.GhadeerDialog={confirm:dialogConfirm};
if(typeof window.managerDeleteNeighborCheck==='function'){
 const original=window.managerDeleteNeighborCheck;
 window.managerDeleteNeighborCheck=async function(id){
   if(!(await dialogConfirm('سيتم حذف حالة التفقد نهائيًا. هل تريد المتابعة؟','حذف حالة التفقد')))return;
   return original.call(this,id);
 };
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
window.GhadeerClickFix={go};
})();
