/* Ghadeer Service Registry v2 — canonical identity, role dictionary and ownership layer. */
(()=>{'use strict';
const registry=new Map();
const ROLE_ALIASES=Object.freeze({
 'core':'core','basic':'core','primary':'core','أساسي':'core','خدمات الحي الأساسية':'core',
 'quran':'faith','faith':'faith','quran2':'faith','القرآن':'faith','القران':'faith','وردِي':'faith','وردي':'faith','العبادات':'faith',
 'home':'home','house':'home','maintenance':'home','منزل':'home','المنزل والصيانة':'home',
 'car':'transport','cars':'transport','سيارات':'transport','السيارات والنقل':'transport','transport':'transport','النقل':'transport',
 'family':'family','education':'family','family_education':'family','الأسرة':'family','التعليم':'family','الأسرة والتعليم':'family',
 'shopping':'shopping','food':'shopping','market':'shopping','التسوق':'shopping','الطعام':'shopping','التسوق والطعام':'shopping',
 'agri':'agri','agriculture':'agri','farm':'agri','المزارع':'agri','الحدائق':'agri','المزارع والحدائق':'agri',
 'tech':'tech','digital':'tech','technology':'tech','التقنية':'tech','الخدمات الرقمية':'tech','التقنية والخدمات الرقمية':'tech',
 'events':'events','hospitality':'events','المناسبات':'events','الضيافة':'events','المناسبات والضيافة':'events',
 'pets':'pets','animals':'pets','الحيوانات':'pets',
 'professional':'professional','business':'professional','real_estate':'professional','pro':'professional','المهنية':'professional','العقارية':'professional','الخدمات المهنية والعقارية':'professional',
 'safety':'safety','emergency':'safety','help':'safety','السلامة':'safety','المساعدة':'safety','السلامة والمساعدة':'safety'
});
function normalizeRole(value){const raw=String(value??'').trim();if(!raw)return 'other';const key=raw.toLowerCase().replace(/[\sـ]+/g,'_');return ROLE_ALIASES[key]||ROLE_ALIASES[raw]||'other'}
function keyOf(x){return String(x?.serviceKey||'').trim()}
function register(def){const k=keyOf(def);if(!k)throw new Error('serviceKey is required');if(registry.has(k))throw new Error('Duplicate serviceKey: '+k);const role=normalizeRole(def.role??def.category??def.cat);const canonical={...def,role,category:role};registry.set(k,Object.freeze(canonical));return registry.get(k)}
function get(k){return registry.get(String(k||''))||null}function list(){return [...registry.values()]}function byRole(role){const canonical=normalizeRole(role);return list().filter(x=>x.role===canonical)}
function validate(){const errors=[],keys=new Set(),routes=new Map();for(const d of registry.values()){const k=keyOf(d);if(keys.has(k))errors.push(`${k}: duplicate serviceKey`);else keys.add(k);for(const field of ['name','role','category','route','entry','ownerPage','lifecycle'])if(!String(d[field]??'').trim())errors.push(`${k}: missing ${field}`);if(d.role==='other')errors.push(`${k}: missing canonical role`);if(!['draft','ui','connected','tested','verified'].includes(d.lifecycle))errors.push(`${k}: invalid lifecycle`);if(d.route){const prior=routes.get(d.route);if(prior&&prior!==k)errors.push(`${k}: duplicate route ${d.route} also used by ${prior}`);else routes.set(d.route,k)}}return {ok:errors.length===0,errors}}
window.GhadeerServiceRegistry={register,get,list,byRole,normalizeRole,roles:ROLE_ALIASES,validate};
})();
