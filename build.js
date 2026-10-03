const fs=require('fs');
const path=require('path');
const {execFileSync}=require('child_process');
const root=process.cwd();
for(const audit of ['scripts/layer-audit.js','scripts/icon-route-audit.js','scripts/live-home-migration-audit.js','scripts/service-architecture-audit.js']){const p=path.join(root,audit);if(fs.existsSync(p))execFileSync(process.execPath,[p],{stdio:'inherit',cwd:root})}
