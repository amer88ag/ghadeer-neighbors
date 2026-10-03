/* Ghadeer Service Registry v3 — canonical identity, six-category taxonomy and ownership layer. */
(()=>{'use strict';
const registry=new Map();
const ROLE_ALIASES=Object.freeze({
 'core':'community','basic':'community','primary':'community','أساسي':'community','خدمات الحي الأساسية':'community','community':'community','society':'community','المجتمع':'community','خدمات المجتمع':'community',
 'quran':'digital','faith':'digital','quran2':'digital','القرآن':'digital','القران':'digital','وردِي':'digital','وردي':'digital','العبادات':'digital',
 'home':'daily','house':'daily','maintenance':'daily','منزل':'daily','المنزل والصيانة':'daily','daily':'daily','life':'daily','الحياة اليومية':'daily',
 'car':'daily','cars':'daily','سيارات':'daily','السيارات والنقل':'daily','transport':'daily','النقل':'daily','family':'daily','education':'daily','family_education':'daily','الأسرة':'daily','التعليم':'daily','الأسرة والتعليم':'daily','agri':'daily','agriculture':'daily','farm':'daily','المزارع':'daily','الحدائق':'daily','المزارع والحدائق':'daily','pets':'daily','animals':'daily','الحيوانات':'daily','safety':'daily','emergency':'daily','help':'daily','السلامة':'daily','المساعدة':'daily','السلامة والمساعدة':'daily',
 'shopping':'commerce','food':'commerce','market':'commerce','التسوق':'commerce','الطعام':'commerce','التسوق والطعام':'commerce','commerce':'commerce','التجارة':'commerce','التجارة والتسوق':'commerce',
 'professional':'business','business':'business','real_estate':'business','pro':'business','المهنية':'business','العقارية':'business','الخدمات المهنية والعقارية':'business','jobs':'business','work':'business','الأعمال والمهن':'business',
 'events':'entertainment','hospitality':'entertainment','المناسبات':'entertainment','الضيافة':'entertainment','المناسبات والضيافة':'entertainment','entertainment':'entertainment','الترفيه':'entertainment','الترفيه والأنشطة':'entertainment','sports':'entertainment','football':'entertainment','كرة القدم':'entertainment',
 'tech':'digital','digital':'digital','technology':'digital','التقنية':'digital','الخدمات الرقمية':'digital','التقنية والخدمات الرقمية':'digital','tools':'digital','الأدوات':'digital','الأدوات والخدمات الرقمية':'digital'
});
const CATEGORIES=Object.freeze([
 {id:'community',name:'المجتمع',icon:'🏘️'},
 {id:'daily',name:'الحياة اليومية',icon:'🏠'},
 {id:'commerce',name:'التجارة والتسوق',icon:'🛒'},
 {id:'business',name:'الأعمال والمهن',icon:'💼'},
 {id:'entertainment',name:'الترفيه والأنشطة',icon:'🎉'},
 {id:'digital',name:'الأدوات والخدمات الرقمية',icon:'🧰'}
]);
function normalizeRole(value){const raw=String(value??'').trim();if(!raw)return 'digital';const key=raw.toLowerCase().replace(/[\sـ]+/g,'_');return ROLE_ALIASES[key]||ROLE_ALIASES[raw]||'digital'}
function keyOf(x){return String(x?.serviceKey||'').trim()}
function register(def){const k=keyOf(def);if(!k)throw new Error('serviceKey is required');if(registry.has(k))throw new Error('Duplicate serviceKey: '+k);const role=normalizeRole(def.role??def.category??def.cat);const canonical={...def,role,category:role};registry.set(k,Object.freeze(canonical));return registry.get(k)}
function get(k){return registry.get(String(k||''))||null}function list(){return [...registry.values()]}function byRole(role){const canonical=normalizeRole(role);return list().filter(x=>x.role===canonical)}
function categories(){return CATEGORIES.slice()}
function validate(){const errors=[],keys=new Set(),routes=new Map(),entries=new Map();for(const d of registry.values()){const k=keyOf(d);if(keys.has(k))errors.push(`${k}: duplicate serviceKey`);else keys.add(k);for(const field of ['name','role','category','route','entry','ownerPage','lifecycle'])if(!String(d[field]??'').trim())errors.push(`${k}: missing ${field}`);if(!CATEGORIES.some(c=>c.id===d.role))errors.push(`${k}: invalid canonical category ${d.role}`);if(!['draft','ui','connected','tested','verified'].includes(d.lifecycle))errors.push(`${k}: invalid lifecycle`);if(d.route){const prior=routes.get(d.route);if(prior&&prior!==k)errors.push(`${k}: duplicate route ${d.route} also used by ${prior}`);else routes.set(d.route,k)}if(d.entry){const prior=entries.get(d.entry);if(prior&&prior!==k)errors.push(`${k}: duplicate entry ${d.entry} also used by ${prior}`);else entries.set(d.entry,k)}}return {ok:errors.length===0,errors}}
window.GhadeerServiceRegistry={register,get,list,byRole,normalizeRole,categories,roles:ROLE_ALIASES,validate,CATEGORIES};
})();