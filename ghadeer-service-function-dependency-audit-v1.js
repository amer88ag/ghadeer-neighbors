/* Ghadeer Service Function Dependency Audit v1 — conservative audit only.
 * Finds function-name references that appear to be shared across canonical service
 * metadata. It never rewires or deletes functions and treats uncertain matches as REVIEW.
 */
(()=>{'use strict';
function run(){
 const manifest=window.GhadeerServiceManifest;
 if(!manifest)return {ok:false,reason:'service-manifest-unavailable'};
 const source=(window.GhadeerServiceActionMap&&window.GhadeerServiceActionMap.rows)||[];
 const byFn=new Map();
 for(const row of source){for(const fn of (row.functions||row.actions||[])){const k=String(fn||'').trim();if(!k)continue;if(!byFn.has(k))byFn.set(k,[]);byFn.get(k).push(String(row.serviceKey||'').trim())}}
 const rows=[];
 for(const [fn,keys] of byFn){const unique=[...new Set(keys)].filter(Boolean);if(unique.length>1)rows.push(Object.freeze({functionName:fn,services:unique,status:'REVIEW'}));}
 const result=Object.freeze({ok:rows.length===0,total:rows.length,sharedFunctions:rows.length,rows,generatedAt:new Date().toISOString()});
 window.GhadeerServiceFunctionDependencyAudit=result;return result;
}
window.GhadeerBuildServiceFunctionDependencyAudit=run;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
})();
