/* فحص المشروع قبل البناء: الصياغة، الاستيرادات، والقيود المعمارية والأمنية. */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const errors = [];
const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const files = walk('src').filter(f => f.endsWith('.js'));

for (const f of files) {
  try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); }
  catch (e) { errors.push(`صياغة: ${f}\n${e.stderr}`); }
  const src = readFileSync(f, 'utf8');
  for (const m of src.matchAll(/^\s*import\s[^'"]*['"](\.[^'"]+)['"]/gm)) {
    if (!existsSync(resolve(dirname(f), m[1]))) errors.push(`استيراد مفقود في ${f}: ${m[1]}`);
  }
  // قيود: لا وصول لقاعدة البيانات خارج طبقة api، ولا تخزين للأرقام السرية، ولا ارتباط بمشاريع أخرى.
  if (f !== join('src', 'lib', 'api.js') && /createClient\(|\.from\(['"]/.test(src)) errors.push(`وصول مباشر لقاعدة البيانات خارج api.js: ${f}`);
  if (/localStorage\.setItem\([^)]*pin/i.test(src) || /sessionStorage/.test(src)) errors.push(`تخزين محظور للرقم السري: ${f}`);
  if (/quran|mutqin|madrasati|communit(y|ies)_|account_support/i.test(src)) errors.push(`ارتباط بمشروع آخر: ${f}`);
  if (/\balert\(|\bprompt\(|\bconfirm\(/.test(src.replace(/\/\*[\s\S]*?\*\//g, ''))) errors.push(`استخدم نوافذ التطبيق بدل alert/prompt/confirm: ${f}`);
}

for (const f of readdirSync('src/pages')) {
  const src = readFileSync(join('src/pages', f), 'utf8');
  if (!/export async function render\(/.test(src)) errors.push(`الصفحة ${f} لا تصدّر render`);
}

const html = readFileSync('index.html', 'utf8');
for (const m of html.matchAll(/(?:src|href)="([^"#:]+)"/g)) if (!existsSync(m[1])) errors.push(`ملف مفقود في index.html: ${m[1]}`);
if ((html.match(/<script/g) || []).length !== 2) errors.push('index.html يجب أن يحمّل مكتبة Supabase و src/app.js فقط');

if (errors.length) { console.error('CHECK FAILED\n- ' + errors.join('\n- ')); process.exit(1); }
console.log(`CHECK OK — ${files.length} ملف JS`);
