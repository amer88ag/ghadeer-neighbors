/* Ghadeer UI Service Contract v1 — one UI entry per service key. */
(()=>{'use strict';
function normalize(value){return String(value??'').trim()}
function scan(root=document){
 const nodes=[...root.querySelectorAll('[data-service-key]')];
 const seen=new Map(); const errors=[];
 for(const node of nodes){
  const key=normalize(node.getAttribute('data-service-key'));
  if(!key){errors.push('UI service entry has empty data-service-key');continue}
  const list=seen.get(key)||[]; list.push(node); seen.set(key,list);
 }
 for(const [key,list] of seen){if(list.length>1)errors.push(`Duplicate UI entry for serviceKey: ${key} (${list.length})`)}
 return {ok:errors.length===0,errors,count:nodes.length,serviceKeys:[...seen.keys()]};
}
function assert(root=document){const result=scan(root);if(!result.ok)throw new Error(result.errors.join(' | '));return result}
window.GhadeerUIServiceContract=Object.freeze({scan,assert});
})();
