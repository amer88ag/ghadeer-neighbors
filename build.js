/* بناء نسخة النشر: يتحقق من المشروع ثم ينسخ الملفات الثابتة إلى dist/. */
import { cpSync, rmSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

execFileSync(process.execPath, ['scripts/check.js'], { stdio: 'inherit' });

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist');
for (const f of ['index.html', 'manifest.webmanifest', 'icon.svg']) copyFileSync(f, 'dist/' + f);
cpSync('src', 'dist/src', { recursive: true });
if (!existsSync('dist/src/app.js')) throw new Error('build output incomplete');
console.log('BUILD OK → dist/');
