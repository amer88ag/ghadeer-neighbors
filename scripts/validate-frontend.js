const fs = require('fs');
const html = fs.readFileSync('index.html','utf8');
const jsFiles = ['app.js','enhancements.js','neighbor-connect.js','quran-enhancement.js','rental-enhancement.js','runtime-fix.js','services-enhancement.js'];
const js = jsFiles.map(f => fs.readFileSync(f,'utf8')).join('\n');
const errors = [];

function count(re,s){ return (s.match(re)||[]).length; }

// Duplicate HTML ids are a common cause of dead buttons and wrong-page navigation.
const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]);
const seen = new Map();
for (const id of ids) seen.set(id,(seen.get(id)||0)+1);
for (const [id,n] of seen) if(n>1) errors.push(`duplicate id: ${id} (${n})`);

// Every static button should have an explicit onclick, an id wired in JS, or be a submit button.
const buttonRe = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
let m;
while((m=buttonRe.exec(html))){
  const attrs=m[1];
  const text=m[2].replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,60);
  const id=(attrs.match(/\bid=["']([^"']+)["']/i)||[])[1];
  const onclick=/\bonclick=["']/i.test(attrs);
  const type=(attrs.match(/\btype=["']([^"']+)["']/i)||[])[1]||'';
  if(!onclick && !id && type!=='submit') errors.push(`button without id/onclick: ${text||'(empty)'}`);
  if(id && !onclick){
    const wired = new RegExp(`(?:getElementById\\(["']${id}["']\\)|\\$\\(["']${id}["']\\)|querySelector\\(["']#[${id}]["']\\)|["']${id}["']\\s*\\])`).test(js)
      || new RegExp(`(?:^|[\\s;])${id}\\s*:`).test(js);
    if(!wired) errors.push(`button id appears unwired: ${id}`);
  }
}

// Verify the build entry exists and all enhancement files referenced by build.js exist.
const build = fs.readFileSync('build.js','utf8');
for (const f of jsFiles) if(!build.includes(f)) errors.push(`build.js does not reference ${f}`);

// Basic JavaScript syntax validation using Node itself.
for (const f of jsFiles.concat(['build.js'])) {
  const {spawnSync}=require('child_process');
  const r=spawnSync(process.execPath,['--check',f],{encoding:'utf8'});
  if(r.status!==0) errors.push(`syntax error in ${f}: ${(r.stderr||'').trim().slice(0,300)}`);
}

console.log(`Frontend audit: ${errors.length ? errors.length+' issue(s)' : 'PASS'}`);
if(errors.length){ for(const e of errors) console.error(' - '+e); process.exit(1); }
console.log(`Static buttons checked: ${count(/<button\b/gi,html)}`);
console.log(`HTML ids checked: ${ids.length}`);
console.log('JavaScript syntax: PASS');
console.log('Build references: PASS');
