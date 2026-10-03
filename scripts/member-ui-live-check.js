#!/usr/bin/env node
/* Static release gate: confirms the canonical member UX contracts exist. */
'use strict';
const fs=require('fs');
const checks=[
 ['member preferences contract','scripts/member-preferences-contract.js'],
 ['member media contract','scripts/member-media-contract.js'],
 ['member home','ghadeer-member-home-v1.js'],
 ['home customizer','ghadeer-home-customizer-v1.js'],
 ['icon route registry','ghadeer-icon-route-registry-v1.js']
];
const missing=checks.filter(([,p])=>!fs.existsSync(p));
if(missing.length){console.error('MEMBER_UI_GATE_FAIL');missing.forEach(x=>console.error(x[1]));process.exit(1)}
console.log('MEMBER_UI_GATE_PASS');
