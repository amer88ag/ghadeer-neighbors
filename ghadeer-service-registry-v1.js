/* Ghadeer Service Registry v1 — canonical identity/ownership layer. */
(()=>{'use strict';
const registry=new Map();
function keyOf(x){return String(x?.serviceKey||'').trim()}
function register(def){const k=keyOf(def);if(!k)throw new Error('serviceKey is required');if(registry.has(k))throw new Error('Duplicate serviceKey: '+k);registry.set(k,Object.freeze({...def}));return registry.get(k)}
function get(k){return registry.get(String(k||''))||null}
function list(){return [...registry.values()]}
function validate(){const errors=[];for(const d of registry.values()){if(!d.entry||!d.ownerPage)errors.push(`${d.serviceKey}: missing entry/ownerPage`);if(!d.lifecycle||!['draft','ui','connected','tested','verified'].includes(d.lifecycle))errors.push(`${d.serviceKey}: invalid lifecycle`)}return {ok:errors.length===0,errors}}
window.GhadeerServiceRegistry={register,get,list,validate};
})();
