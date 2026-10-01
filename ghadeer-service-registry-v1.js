/* Ghadeer Service Registry v2 — canonical identity, role dictionary and ownership layer. */
(()=>{'use strict';
const registry=new Map();
const ROLE_ALIASES=Object.freeze({
 'core':'core','basic':'core','primary':'core','أساسي':'core','خدمات الحي الأساسية':'core',
 'home':'home','house':'home','maintenance':'home','منزل':'home','المنزل والصيانة':'home',
 'car':'car','cars':'car','transport':'transport','سيارات':'car','النقل':'transport','السيارات والنقل':'car',
 'family':'family','education':'family','family_education':'family','الأسرة':'family','التعليم':'family','الأسرة والتعليم':'family',
 'shopping':'shopping','food':'shopping','market':'shopping','التسوق':'shopping','الطعام':'shopping','التسوق والطعام':'shopping',
 'agri':'agri','agriculture':'agri','farm':'agri','المزارع':'agri','الحدائق':'agri','المزارع والحدائق':'agri',
 'tech':'tech','digital':'tech','technology':'tech','التقنية':'tech','الخدمات الرقمية':'tech','التقنية والخدمات الرقمية':'tech',
 'events':'events','hospitality':'events','المناسبات':'events','الضيافة':'events','المناسبات والضيافة':'events',
 'pets':'pets','animals':'pets','الحيوانات':'pets',
 'professional':'professional','business':'professional','real_estate':'professional','المهنية':'professional','العقارية':'professional','الخدمات المهنية والعقارية':'professional',
 'safety':'safety','emergency':'safety','السلامة':'safety','المساعدة':'safety','السلامة والمساعدة':'safety'
});
function normalizeRole(value){const raw=String(value??'').trim();if(!raw)return 'other';const key=raw.toLowerCase().replace(/[\sـ]+/g,'_');return ROLE_ALIASES[key]||ROLE_ALIASES[raw]||'other'}
function keyOf(x){return String(x?.serviceKey||'').trim()}
function register(def){const k=keyOf(def);if(!k)throw new Error('serviceKey is required');if(registry.has(k))throw new Error('Duplicate serviceKey: '+k);const role=normalizeRole(def.role??def.category??def.cat);const canonical={...def,role,category:role};registry.set(k,Object.freeze(canonical));return registry.get(k)}
function get(k){return registry.get(String(k||''))||null}
function list(){return [...registry.values()]}
function byRole(role){const canonical=normalizeRole(role);return list().filter(x=>x.role===canonical)}
function validate(){const errors=[];for(const d of registry.values()){if(!d.entry||!d.ownerPage)errors.push(`${d.serviceKey}: missing entry/ownerPage`);if(!d.lifecycle||!['draft','ui','connected','tested','verified'].includes(d.lifecycle))errors.push(`${d.serviceKey}: invalid lifecycle`);if(!d.role||d.role==='other')errors.push(`${d.serviceKey}: missing canonical role`)}return {ok:errors.length===0,errors}}
window.GhadeerServiceRegistry={register,get,list,byRole,normalizeRole,roles:ROLE_ALIASES,validate};
})();
