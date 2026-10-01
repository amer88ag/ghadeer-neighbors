/* Ghadeer Service Candidate Selection v1 — deterministic, non-mutating.
 * Selects the first safe, complete candidate from the execution/preflight evidence.
 * It does not modify runtime services or choose by name.
 */
(()=>{'use strict';
function run(){
 const pre=window.GhadeerServicePreflight;
 const map=window.GhadeerServiceExecutionMap;
 const manifest=window.GhadeerServiceManifest;
 if(!pre||!map||!manifest)return {ok:false,reason:'candidate-input-unavailable'};
 const manifestKeys=new Set((manifest.services||[]).map(x=>x.serviceKey));
 const candidates=(pre.rows||[]).filter(x=>x.decision==='ALLOW_REFACTOR_REVIEW'&&manifestKeys.has(x.serviceKey)).map(x=>{const m=(map.rows||[]).find(y=>y.serviceKey===x.serviceKey);return Object.freeze({serviceKey:x.serviceKey,route:x.route||m?.route||'',owner:x.owner||m?.owner||'',risk:x.risk,actionCount:x.actionCount,backendCount:x.backendCount});});
 candidates.sort((a,b)=>String(a.serviceKey).localeCompare(String(b.serviceKey)));
 const selected=candidates[0]||null;
 const result=Object.freeze({ok:true,totalCandidates:candidates.length,selected:selected?.serviceKey||null,selection:selected,candidates,selectionPolicy:'first SAFE complete candidate by canonical serviceKey; no manual preference',mutationExecuted:false,generatedAt:new Date().toISOString()});
 window.GhadeerServiceCandidateSelection=result;return result;
}
window.GhadeerBuildServiceCandidateSelection=run;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
})();
