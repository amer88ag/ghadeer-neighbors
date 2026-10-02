/* Ghadeer UI Integrity Audit v1 — pre-release, non-mutating.
 * Checks canonical icon/action routing, duplicate service actions, duplicate DOM ids,
 * and whether every data-gh5 action has a known canonical route.
 */
(()=>{'use strict';
const known=new Set(['home','services','services:help','services:market','realEstate','messages','jobs','neighborhoodEvents','news','neighborCheck','lost','coffee','outings','members','manager','developer','settings','aboutProject','announcements','football','spl','uel','world','king','super','ghadeer','wardi','read','recite','tajweed','tafsir','adhkar','hifz','marks','download','more','logout']);
function run(){
 const nodes=[...document.querySelectorAll('[data-gh5]')];
 const actions=nodes.map(x=>x.getAttribute('data-gh5')).filter(Boolean);
 const unknown=[...new Set(actions.filter(x=>!known.has(x)))];
 const duplicates=[...new Set(actions.filter((x,i,a)=>a.indexOf(x)!==i))];
 const ids=[...document.querySelectorAll('[id]')].map(x=>x.id).filter(Boolean);
 const duplicateIds=[...new Set(ids.filter((x,i,a)=>a.indexOf(x)!==i))];
 const catalogRoutes=(()=>{try{return Object.values(window.GhadeerUIv5Catalog||{}).flat().map(x=>x?.[3]).filter(Boolean)}catch{return[]}})();
 const result=Object.freeze({ok:unknown.length===0&&duplicateIds.length===0,checks:{dataGh5Count:nodes.length,unknownActions:unknown,duplicateActionBindings:duplicates,duplicateIds,missingCatalogRoutes:catalogRoutes.filter(x=>!known.has(x))},mutationExecuted:false,generatedAt:new Date().toISOString()});
 window.GhadeerUIIntegrityAudit=result;return result;
}
window.GhadeerRunUIIntegrityAudit=run;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,100),{once:true});else setTimeout(run,100);
})();
