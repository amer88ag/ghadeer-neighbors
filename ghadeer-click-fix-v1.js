/* Ghadeer click fix v1 — canonical delegated router. Kept as the existing filename to avoid breaking references. */
(()=>{'use strict';
const map={realEstate:'realEstate',messages:'messages',jobs:'jobs',neighborhoodEvents:'neighborhoodEvents',news:'news',neighborCheck:'neighborCheck',lost:'lost',coffee:'coffee',outings:'outings',members:'members',manager:'manager',developer:'developer',settings:'settings',aboutProject:'aboutProject'};
function go(key){
 if(key==='home') return window.GhadeerUIv5?.home?.();
 if(key==='services'||key==='services:help'||key==='services:market') return window.GhadeerUIv5?.services?.();
 if(key==='football'||['spl','uel','world','king','super','ghadeer'].includes(key)) return window.GhadeerFootballV2?.renderLeague?.(key==='football'?'spl':key);
 if(key==='wardi'||['read','recite','tajweed','tafsir','adhkar','hifz','marks','download'].includes(key)) {
   const module=window.GhadeerQuran2Module;
   if(!module?.mount) return window.openPage?.('quran2');
   return Promise.resolve(module.mount()).then(()=>{
     if(key==='wardi'||key==='read'||key==='recite') return;
     const ids={tajweed:'tajweed',tafsir:'tafsir',hifz:'hifz',marks:'bookmark',download:'offline'};
     const action=ids[key];
     const root=document.getElementById('quran2-root');
     if(!action||!root)return;
     const button=root.querySelector(`[data-q2="${action}"]`);
     if(button)button.click();
   });
 }
 if(key==='more') return window.openPage?.('more')||window.GhadeerUIv5?.install?.();
 if(key==='logout') return window.logout?.()||window.signOut?.();
 if(map[key]) return window.openPage?.(map[key]);
 return window.openPage?.(key);
}
function bind(){document.addEventListener('click',e=>{const b=e.target.closest?.('[data-gh5]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();go(b.dataset.gh5)},true)}
function ensureDialog(){
 if(document.getElementById('ghadeerDialog'))return document.getElementById('ghadeerDialog');
 const el=document.createElement('div');el.id='ghadeerDialog';el.className='modal hidden';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.innerHTML='<div class="modal-card" style="max-width:430px"><h2 id="ghadeerDialogTitle">تأكيد العملية</h2><p id="ghadeerDialogText" class="muted"></p><div class="top-actions"><button id="ghadeerDialogOk" class="btn danger">تأكيد</button><button id="ghadeerDialogCancel" class="btn secondary">إلغاء</button></div></div>';document.body.appendChild(el);return el;
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
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();window.GhadeerClickFix={go};
})();