/* Ghadeer Service Action Classifier v1 — audit only.
 * Classifies audited UI actions without changing behavior.
 */
(()=>{'use strict';
function classify(row){
 const text=String(row.text||'').toLowerCase();
 const action=String(row.onclick||'').toLowerCase();
 const href=String(row.href||'').toLowerCase();
 if(row.serviceKey&&row.route)return 'service';
 if(/logout|signout|login|register|auth/.test(action+' '+text))return 'account';
 if(/back|close|cancel|next|previous|menu/.test(action+' '+text))return 'navigation';
 if(/edit|update|save|delete|remove|create|add|submit/.test(action+' '+text))return 'mutation';
 if(/\/|http|#/.test(href))return 'navigation';
 return 'unclassified';
}
function run(){
 const source=window.GhadeerServiceActionMap;
 if(!source)return {ok:false,reason:'action-map-unavailable'};
 const rows=source.rows.map(row=>({...row,category:classify(row)}));
 const counts={};for(const row of rows)counts[row.category]=(counts[row.category]||0)+1;
 const result=Object.freeze({ok:true,total:rows.length,counts,rows,generatedAt:new Date().toISOString()});
 window.GhadeerServiceActionClassification=result;return result;
}
window.GhadeerClassifyServiceActions=run;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
})();
