/* Ghadeer UI Interaction Matrix v1 — audit only.
 * Builds a runtime inventory of interactive controls and their declared/observed targets.
 * Does not navigate, mutate data, or publish anything.
 */
(()=>{'use strict';
function targetOf(el){return {id:el.id||'',tag:el.tagName.toLowerCase(),text:(el.textContent||'').trim().replace(/\s+/g,' ').slice(0,120),onclick:el.getAttribute('onclick')||'',dataPage:el.getAttribute('data-page')||'',dataService:el.getAttribute('data-service')||'',aria:el.getAttribute('aria-label')||''};}
function run(){
 const els=[...document.querySelectorAll('button,a,[role="button"],[data-action]')];
 const rows=els.map((el,i)=>{const t=targetOf(el);const target=t.dataPage||t.dataService||t.onclick||el.getAttribute('href')||'';return Object.freeze({index:i,...t,target,disabled:el.disabled===true,hidden:el.offsetParent===null});});
 const duplicates=new Map();rows.forEach(r=>{if(r.target){const a=duplicates.get(r.target)||[];a.push(r.index);duplicates.set(r.target,a)}});
 const duplicateTargets=[...duplicates.entries()].filter(([,v])=>v.length>1).map(([target,indexes])=>({target,indexes}));
 const result=Object.freeze({ok:true,totalInteractive:rows.length,rows,duplicateTargets,mutationExecuted:false,generatedAt:new Date().toISOString()});
 window.GhadeerUIInteractionMatrix=result;return result;
}
window.GhadeerBuildUIInteractionMatrix=run;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
})();
