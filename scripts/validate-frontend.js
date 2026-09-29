const fs = require('fs');
const { spawnSync } = require('child_process');
const html = fs.readFileSync('index.html','utf8');
const build = fs.readFileSync('build.js','utf8');
const errors = [];
const jsFiles = new Set(['app.js']);

// build.js owns the canonical production script list. Extract it from the scripts array
// instead of trying to infer it from arbitrary string literals in the build code.
const scriptsBlock = build.match(/const scripts = \[([\s\S]*?)\];/);
if (scriptsBlock) {
  for (const m of scriptsBlock[1].matchAll(/["']([^"']+\.js)(?:\?[^"']*)?["']/g)) {
    if (fs.existsSync(m[1])) jsFiles.add(m[1]);
  }
}
// Also include every JavaScript file directly referenced by index.html.
for (const m of html.matchAll(/(?:src|href)=["']([^"']+\.js)(?:\?[^"']*)?["']/gi)) {
  const f=m[1]; if(fs.existsSync(f)) jsFiles.add(f);
}
const jsList=[...jsFiles];
const js=jsList.map(f=>fs.readFileSync(f,'utf8')).join('\n');
function count(re,s){return(s.match(re)||[]).length;}
const ids=[...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]);
const seen=new Map(); for(const id of ids) seen.set(id,(seen.get(id)||0)+1);
for(const [id,n] of seen) if(n>1) errors.push(`duplicate id: ${id} (${n})`);
const runtimeReplacedIds=new Set(['homePrayerBtn','prayerRefreshBtn','startHifzBtn','startReadBtn','quranOpenBtn','quranPrevBtn','quranNextBtn','quranBookmarksBtn','checkHifzBtn','showHifzBtn','recordReadBtn','showReadTextBtn']);
const buttonRe=/<button\b([^>]*)>([\s\S]*?)<\/button>/gi; let m;
while((m=buttonRe.exec(html))){
 const attrs=m[1], text=m[2].replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,60);
 const id=(attrs.match(/\bid=["']([^"']+)["']/i)||[])[1]; if(id&&runtimeReplacedIds.has(id)) continue;
 const onclick=/\bonclick=["']/i.test(attrs), type=(attrs.match(/\btype=["']([^"']+)["']/i)||[])[1]||'';
 const localMarkup=onclick||/\bdata-page=["'][^"']+["']/i.test(attrs)||/\bdata-mtab=["'][^"']+["']/i.test(attrs)||/\bdata-(?:action|command|target)=["'][^"']+["']/i.test(attrs)||type==='submit';
 if(!localMarkup&&!id) errors.push(`button without wiring metadata: ${text||'(empty)'}`);
 if(id&&!localMarkup){
   // Event delegation and dynamically-created handlers are valid. For static analysis,
   // the strongest safe check is that the exact id is referenced somewhere in the
   // production JavaScript, rather than guessing a single DOM API pattern.
   const e=id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
   if(!new RegExp(`\\b${e}\\b`).test(js)) errors.push(`button id has no production-JS reference: ${id}`);
 }
}
for(const f of jsList.concat(['build.js'])){const r=spawnSync(process.execPath,['--check',f],{encoding:'utf8'});if(r.status!==0)errors.push(`syntax error in ${f}: ${(r.stderr||'').trim().slice(0,300)}`);}
console.log(`Frontend audit: ${errors.length?errors.length+' issue(s)':'PASS'}`); console.log(`Production JS files checked: ${jsList.length}`);
if(errors.length){for(const e of errors)console.error(' - '+e);process.exit(1);}
console.log(`Static buttons checked: ${count(/<button\b/gi,html)}`); console.log(`HTML ids checked: ${ids.length}`); console.log('JavaScript syntax: PASS'); console.log('Production build wiring: PASS');