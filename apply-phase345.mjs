#!/usr/bin/env node
/* DADASHMODE v5 · installs phases 3, 4, 5 into the v4 app. Adds only; removes nothing. Safe to run twice.
   usage (in the app folder):  node tools/apply-phase345.mjs        → all three phases
                               node tools/apply-phase345.mjs 3 5    → only the phases you list */
import fs from 'node:fs';
const want=process.argv.slice(2).length?process.argv.slice(2):['3','4','5'];
const files=['js/p345-core.js',...(want.includes('3')?['js/p3-director.js']:[]),...(want.includes('4')?['js/p4-voicecapture.js']:[]),...(want.includes('5')?['js/p5-cinema.js']:[])];
for(const f of [...files,...(want.includes('5')?['js/p5-three.js']:[])])if(!fs.existsSync(f)){console.error('✕ پیدا نشد: '+f+' — بسته را داخل پوشهٔ اپ باز کنید');process.exit(1)}
if(!fs.existsSync('index.html')){console.error('✕ index.html پیدا نشد؛ این دستور را داخل پوشهٔ اپ اجرا کنید');process.exit(1)}
let html=fs.readFileSync('index.html','utf8');const stamp=new Date().toISOString().replace(/[:.]/g,'-');
fs.writeFileSync(`index.html.bak-phase345-${stamp}`,html);
const todo=files.filter(f=>!html.includes(`src="${f}"`));
if(todo.length){const re=/<script\b[^>]*\bsrc=["'][^"']*js\/[^"']+["'][^>]*>\s*<\/script>/gi;let last=null,m;while((m=re.exec(html)))last=m;
 const defer=last&&/\bdefer\b/i.test(last[0])?' defer':'';const tags='\n<!-- DADASHMODE v5 · phases 3-5 (added, nothing removed) -->\n'+todo.map(f=>`<script src="${f}"${defer}></script>`).join('\n')+'\n';
 if(last){const at=last.index+last[0].length;html=html.slice(0,at)+tags+html.slice(at)}else html=html.replace(/<\/body>/i,tags+'</body>');
 fs.writeFileSync('index.html',html);console.log('✓ index.html: '+todo.join(', '))}else console.log('✓ index.html قبلاً به‌روز بوده');
if(fs.existsSync('sw.js')){let sw=fs.readFileSync('sw.js','utf8');fs.writeFileSync(`sw.js.bak-phase345-${stamp}`,sw);const all=[...files,...(want.includes('5')?['js/p5-three.js']:[])].filter(f=>!sw.includes(`'${f}'`));
 if(all.length){sw=sw.replace(/(const CORE=\[)/,`$1${all.map(f=>`'${f}',`).join('')}`);sw=sw.replace(/const VERSION='([^']+)'/,(a,v)=>`const VERSION='${v.replace(/-p345.*$/,'')}-p345-${Date.now().toString(36)}'`);fs.writeFileSync('sw.js',sw);console.log('✓ sw.js: فایل‌ها برای کار بدون اینترنت اضافه شدند')}}
console.log('\nتمام. اپ را یک بار با Ctrl+Shift+R باز کنید. سمت چپ صفحه دکمه‌های «کارگردان»، «صدای جمنای» و «سبک و خروجی» را می‌بینید.');
