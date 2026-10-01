/* Canonical service entry map — unique entry identity without duplicating service implementations. */
(()=>{'use strict';
const PREFIX='GhadeerServicesV6:';
const entries=Object.create(null);
function key(serviceKey){return PREFIX+String(serviceKey||'').trim()}
function register(serviceKey){const k=String(serviceKey||'').trim();if(!k)throw new Error('serviceKey is required');const entry=key(k);if(!entries[entry])entries[entry]=Object.freeze({entry,serviceKey,host:'GhadeerServicesV6',ownerPage:'services'});return entries[entry]}
function get(entry){return entries[String(entry||'')]||null}
function list(){return Object.values(entries)}
window.GhadeerServiceEntries=Object.freeze({PREFIX,key,register,get,list});
})();
