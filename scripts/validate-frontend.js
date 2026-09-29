const fs = require('fs');
const { spawnSync } = require('child_process');
const html = fs.readFileSync('index.html','utf8');
const build = fs.readFileSync('build.js','utf8');
const errors = [];
const jsFiles = new Set();
for (const m of build.matchAll(/["']([^"']+\.js)["']/g)) { if (fs.existsSync(m[1])) jsFiles.add(m[1]); }
for (const m of html.matchAll(/(?:src|href)=["']([^"']+\.js)["']/gi)) { const f=m[1].split('?')[0]; if(fs.existsSync(f)) jsFiles.add(f); }
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
 if(id&&!localMarkup){const e=id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); const wired=new RegExp(`getElementById\\(["']${e}["']\\)`).test(js)||new RegExp(`["']${e}["']\\s*:`).test(js)||new RegExp(`(?:^|[\\s;])${e}\\s*=`).test(js); if(!wired) errors.push(`button id appears unwired: ${id}`);}
}
for(const f of jsList.concat(['build.js'])){const r=spawnSync(process.execPath,['--check',f],{encoding:'utf8'});if(r.status!==0)errors.push(`syntax error in ${f}: ${(r.stderr||'').trim().slice(0,300)}`);}
console.log(`Frontend audit: ${errors.length?errors.length+' issue(s)':'PASS'}`); console.log(`Production JS files checked: ${jsList.length}`);
if(errors.length){for(const e of errors)console.error(' - '+e);process.exit(1);}
console.log(`Static buttons checked: ${count(/<button\b/gi,html)}`); console.log(`HTML ids checked: ${ids.length}`); console.log('JavaScript syntax: PASS'); console.log('Production build wiring: PASS');