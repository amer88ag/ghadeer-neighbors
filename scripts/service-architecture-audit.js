/* Static architecture gate: one canonical taxonomy, no legacy Quran label. */
'use strict';
const fs=require('fs');const path=require('path');const root=process.cwd();
const registryPath=path.join(root,'ghadeer-service-registry-v1.js');
const routePath=path.join(root,'ghadeer-service-route-map-v1.js');
if(!fs.existsSync(registryPath))throw new Error('Missing canonical service registry');
if(!fs.existsSync(routePath))throw new Error('Missing canonical service route map');
const registry=fs.readFileSync(registryPath,'utf8');const route=fs.readFileSync(routePath,'utf8');
for(const id of ['community','daily','commerce','business','entertainment','digital'])if(!new RegExp("id:'"+id+"'").test(registry))throw new Error('Missing canonical category: '+id);
if(/['\"]وردي['\"]/.test(registry))throw new Error('Legacy Quran label still present in canonical registry');
if(!/function\s+normalizeRole\s*\(/.test(registry))throw new Error('Missing category normalization');
if(!/function\s+register\s*\(/.test(registry))throw new Error('Missing central service registration');
if(!/Duplicate serviceKey/.test(registry))throw new Error('Missing duplicate serviceKey guard');
if(!/duplicate route/.test(registry))throw new Error('Missing duplicate route guard');
if(!/duplicate entry/.test(registry))throw new Error('Missing duplicate entry guard');
if(!/normalizeRole\(/.test(route))throw new Error('Route map is not using canonical category normalization');
console.log('SERVICE ARCHITECTURE AUDIT PASS: 3-layer target, 6 categories, central registry/route guards, Quran label normalized.');
