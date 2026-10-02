/* Ghadeer layer conflict audit v1 — static prepublish guard; no runtime/data mutation. */
'use strict';
const fs=require('fs'),path=require('path');
const root=process.cwd();
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const errors=[];
const ui=read('ghadeer-ui-v5.js');
const nav=read('ghadeer-navigation-fix-v1.js');
const click=read('ghadeer-click-fix-v1.js');
const checks=[
 ['ui-install-idempotent',/let installed=false;/.test(ui)&&/if\(installed\)return;installed=true;/.test(ui)],
 ['ui-event-dedup',/dataset\.gh5Bound/.test(ui)],
 ['navigation-event-dedup',/dataset\.moreFix/.test(nav)&&/dataset\.actionsBound/.test(nav)],
 ['navigation-no-legacy-timers',!/\[500,1200,2500,4500\]/.test(nav)],
 ['click-fix-no-global-interceptor',!/document\.addEventListener\(['"]click['"]/.test(click)],
 ['click-fix-compatibility-api',/window\.GhadeerClickFix=\{go\}/.test(click)],
 ['canonical-ui-export',/window\.GhadeerUIv5=/.test(ui)],
];
for(const [name,ok] of checks)if(!ok)errors.push(name);
const scriptFiles=fs.readdirSync(root).filter(f=>/^ghadeer-.*\.js$/i.test(f));
const globalClickOwners=[];
for(const f of scriptFiles){const s=read(f);if(/document\.addEventListener\(['"]click['"]/.test(s))globalClickOwners.push(f)}
if(globalClickOwners.some(f=>f!=='ghadeer-ui-v5.js'&&f!=='ghadeer-navigation-fix-v1.js'))errors.push(`unexpected-global-click-owner:${globalClickOwners.filter(f=>!['ghadeer-ui-v5.js','ghadeer-navigation-fix-v1.js'].includes(f)).join(',')}`);
const result={ok:errors.length===0,deployPerformed:false,mutationExecuted:false,errors,globalClickOwners,canonicalOwners:{ui:'ghadeer-ui-v5.js',navigation:'ghadeer-navigation-fix-v1.js',compatibility:'ghadeer-click-fix-v1.js'}};
console.log(JSON.stringify(result,null,2));
if(!result.ok)process.exitCode=1;
