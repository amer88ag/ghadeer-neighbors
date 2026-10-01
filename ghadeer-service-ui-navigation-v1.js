/* Ghadeer Service UI Navigation v1 — read-only wiring layer.
 * It only intercepts elements already marked by the migration audit.
 * It does not remove legacy handlers; if canonical navigation fails, the legacy action remains untouched.
 */
(()=>{'use strict';
function wire(root=document){
 const nav=window.GhadeerServiceNavigation;
 if(!nav||typeof nav.open!=='function')return {ok:false,wired:0,errors:['navigation-unavailable']};
 let wired=0;const errors=[];
 for(const node of root.querySelectorAll('[data-service-key][data-service-navigation="canonical"]')){
   if(node.dataset.serviceNavigationWired==='1')continue;
   const key=String(node.dataset.serviceKey||'').trim();if(!key){errors.push('empty-service-key');continue;}
   node.dataset.serviceNavigationWired='1';
   node.addEventListener('click',event=>{
     try{event.preventDefault();event.stopPropagation();nav.open(key)}catch(error){console.error('[Ghadeer] canonical service navigation failed',key,error)}
   });
   wired++;
 }
 return {ok:errors.length===0,wired,errors};
}
function run(){const result=wire(document);window.GhadeerServiceUINavigationResult=Object.freeze(result);return result}
window.GhadeerWireServiceUINavigation=run;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
})();
