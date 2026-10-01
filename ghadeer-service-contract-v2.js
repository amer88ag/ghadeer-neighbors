/* Ghadeer Service Contract v2 — canonical identity, route ownership, and duplicate-task audit. Read-only. */
(()=>{'use strict';
const norm=v=>String(v??'').normalize('NFKC').replace(/[\sـ]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').toLowerCase();
const slug=v=>norm(v).replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-+|-+$/g,'').slice(0,70)||'service';
function audit(){
 const R=window.GhadeerServiceRegistry,C=window.GhadeerServicesV6?.catalog,routes=window.GhadeerServiceRoutes;
 const errors=[],warnings=[],keys=new Map(),paths=new Map(),tasks=new Map();
 if(!R||!Array.isArray(C)){errors.push('registry/catalog unavailable');return window.GhadeerServiceContractAudit={ok:false,errors,warnings}}
 if(!routes||typeof routes!=='object')errors.push('canonical route registry unavailable');
 for(const x of C){
  const name=String(x?.name??'').trim(),role=R.normalizeRole(x?.role??x?.category??x?.cat),key=String(x?.serviceKey||'').trim()||('svc_'+Array.from(norm(name)).map(c=>c.codePointAt(0).toString(16)).join('_'));
  const route=`/services/${slug(role)}/${slug(name)}`;
  if(!name)errors.push('service without name');
  if(keys.has(key))errors.push(`duplicate serviceKey: ${key}`);else keys.set(key,name);
  if(paths.has(route))errors.push(`duplicate route: ${route}`);else paths.set(route,key);
  const task=norm(`${name}|${x?.desc||''}`);if(tasks.has(task))warnings.push(`duplicate task signature: ${tasks.get(task)} / ${name}`);else tasks.set(task,name);
  const r=routes?.[key];if(!r)errors.push(`missing canonical route entry: ${key}`);else{if(r.route!==route)errors.push(`route mismatch: ${name}`);if(r.entry!=='GhadeerServicesV6')warnings.push(`non-canonical entry: ${name}`);if(r.ownerPage!=='services')warnings.push(`unexpected ownerPage: ${name}`)}
 }
 const result={ok:errors.length===0,errors,warnings,counts:{catalog:C.length,keys:keys.size,routes:paths.size,taskSignatures:tasks.size}};
 window.GhadeerServiceContractAudit=result;console.info('[Ghadeer] service contract v2',result);return result;
}
window.GhadeerRunServiceContractAudit=audit;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(audit,0),{once:true});else setTimeout(audit,0);
})();
