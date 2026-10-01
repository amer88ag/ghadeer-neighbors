/* Ghadeer Service File Dependency Audit v1 — conservative audit only.
 * Maps loaded script filenames to services when explicit metadata is available.
 * It does not infer ownership from naming alone and never mutates code.
 */
(()=>{'use strict';
function run(){
 const manifest=window.GhadeerServiceManifest;
 const ownership=window.GhadeerServiceOwnership;
 if(!manifest||!ownership)return {ok:false,reason:'manifest-or-ownership-unavailable'};
 const services=manifest.services||[];
 const files=[...document.scripts].map(s=>String(s.src||'').split('/').pop()).filter(Boolean);
 const rows=services.map(s=>{
   const entry=String(s.entry||'').trim();
   const entryFile=entry.split('/').pop();
   const loaded=entryFile?files.includes(entryFile):false;
   const owner=ownership.ownership.find(o=>o.serviceKey===s.serviceKey);
   return Object.freeze({serviceKey:s.serviceKey,entry,entryLoaded:loaded,owner:owner?.canonicalOwner||'',status:entry&&!loaded?'REVIEW':(entry?'EVIDENCE':'REVIEW')});
 });
 const review=rows.filter(r=>r.status==='REVIEW');
 const result=Object.freeze({ok:review.length===0,total:rows.length,evidence:rows.length-review.length,review:review.length,rows,generatedAt:new Date().toISOString()});
 window.GhadeerServiceFileDependencyAudit=result;return result;
}
window.GhadeerBuildServiceFileDependencyAudit=run;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
})();
