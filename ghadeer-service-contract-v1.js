/* Ghadeer Service Contract v1 — structural audit only. It never mutates production data. */
(()=>{'use strict';
const norm=v=>String(v??'').normalize('NFKC').replace(/[\sـ]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').toLowerCase();
const slug=v=>norm(v).replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-+|-+$/g,'').slice(0,70)||'service';
function audit(){
 const R=window.GhadeerServiceRegistry,C=window.GhadeerServicesV6?.catalog;
 const errors=[],warnings=[],keys=new Map(),routes=new Map(),names=new Map(),icons=new Map();
 if(!R||!Array.isArray(C)){errors.push('service registry/catalog unavailable');return window.GhadeerServiceContractAudit={ok:false,errors,warnings}}
 for(const x of C){
  const name=String(x?.name??'').trim(),role=R.normalizeRole(x?.role??x?.category??x?.cat),key=String(x?.serviceKey||'').trim()||('svc_'+Array.from(norm(name)).map(c=>c.codePointAt(0).toString(16)).join('_'));
  const route=`/services/${slug(role)}/${slug(name)}`;
  if(!name)errors.push('service without name');
  if(keys.has(key))errors.push(`duplicate serviceKey: ${key} (${keys.get(key)} / ${name})`); else keys.set(key,name);
  if(routes.has(route))errors.push(`duplicate service route: ${route}`); else routes.set(route,key);
  const nk=norm(name);if(names.has(nk))warnings.push(`duplicate normalized service name: ${names.get(nk)} / ${name}`);else names.set(nk,name);
  const icon=String(x?.icon??'').trim();if(icon){if(icons.has(icon))warnings.push(`shared icon used by multiple services: ${icons.get(icon)} / ${name}`);else icons.set(icon,name)}
  if(!x?.desc)warnings.push(`${name}: missing description`);
 }
 const result={ok:errors.length===0,errors,warnings,counts:{catalog:C.length,keys:keys.size,routes:routes.size}};
 window.GhadeerServiceContractAudit=result;
 console.info('[Ghadeer] service contract audit',result);
 return result;
}
window.GhadeerRunServiceContractAudit=audit;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(audit,0),{once:true});else setTimeout(audit,0);
})();
