/* Ghadeer Service Execution Readiness v1 — planning gate only.
 * Selects candidates from the existing execution map. It does not mutate runtime code.
 */
(()=>{'use strict';
function run(){
 const map=window.GhadeerServiceExecutionMap;
 if(!map)return {ok:false,reason:'execution-map-unavailable'};
 const rows=(map.rows||[]).map(x=>Object.freeze({serviceKey:x.serviceKey,ready:Boolean(x.ready),risk:x.risk,route:x.route,owner:x.owner,actionCount:(x.actions||[]).length,backendCount:(x.backend||[]).length,decision:x.ready?'CANDIDATE':'HOLD'}));
 const result=Object.freeze({ok:true,candidates:rows.filter(x=>x.ready).length,holds:rows.filter(x=>!x.ready).length,rows,generatedAt:new Date().toISOString()});
 window.GhadeerServiceExecutionReadiness=result;return result;
}
window.GhadeerBuildServiceExecutionReadiness=run;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
})();
