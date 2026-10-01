/* Ghadeer Service UI Migration Audit v1 — read-only audit before converting legacy service cards to canonical navigation. */
(()=>{'use strict';
const norm=v=>String(v??'').normalize('NFKC').replace(/[\sـ]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').toLowerCase();
const stableKey=x=>{const explicit=String(x?.serviceKey||'').trim();if(explicit)return explicit;const raw=norm(x?.name);return 'svc_'+Array.from(raw).map(c=>c.codePointAt(0).toString(16)).join('_')};
function run(){
 const C=window.GhadeerServicesV6?.catalog,R=window.GhadeerServiceRegistry,N=window.GhadeerServiceNavigation;
 if(!Array.isArray(C)||!R||!N)return null;
 const byName=new Map(),ambiguous=[],catalogKeys=new Set(C.map(stableKey));
 for(const x of C){const n=norm(x?.name);const list=byName.get(n)||[];list.push(x);byName.set(n,list)}
 const candidates=[...document.querySelectorAll('button,a,[role="button"]')];
 const mapped=[],unmapped=[],duplicates=[];
 const seen=new Map();
 for(const node of candidates){const text=String(node.textContent||'').replace(/\s+/g,' ').trim();if(!text)continue;const hits=byName.get(norm(text))||[];if(hits.length===1){const key=stableKey(hits[0]);node.setAttribute('data-service-key',key);node.setAttribute('data-service-navigation','canonical');mapped.push({key,text,node});const list=seen.get(key)||[];list.push(node);seen.set(key,list)}else if(hits.length>1){ambiguous.push({text,count:hits.length})}}
 for(const [key,list] of seen)if(list.length>1)duplicates.push({key,count:list.length});
 const serviceNames=new Set([...byName.keys()]);
 const report={ok:ambiguous.length===0&&duplicates.length===0,mapped:mapped.length,ambiguous,duplicates,catalog:C.length,catalogKeys:catalogKeys.size,candidates:candidates.length,unmappedCatalog:[...serviceNames].filter(n=>!mapped.some(m=>norm(m.text)===n))};
 window.GhadeerServiceUIMigrationAudit=Object.freeze(report);console.info('[Ghadeer] UI service migration audit',report);return report;
}
window.GhadeerRunServiceUIMigrationAudit=run;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
})();
