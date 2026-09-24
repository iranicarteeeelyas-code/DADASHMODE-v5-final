/* DADASHMODE v5 · Phase 1 · Persistent memory & recovery layer
   Additive module: nothing from v4 is removed or rewritten. Load AFTER control4.js.
   What it adds:
   1) Asks the browser for persistent storage (so voices/projects are not evicted).
   2) Instant flush on close/hide/Ctrl+S + emergency copy -> nothing lost in the last seconds.
   3) Rolling snapshots of every episode (recent + one per day) with one-click restore.
   4) Settings mirror in IndexedDB (survives a cleared localStorage).
   5) Full backup file (projects, voices, SFX bank, sources, settings, optional recorded takes) + safe import (never overwrites newer data).
   6) Automatic light backup into a chosen folder (e.g. a Google Drive synced folder).
   7) Integrity check of stored episodes + warning when the app is open in two tabs. */
'use strict';
(function(){
const PV={schema:5,snapRecent:25,snapDaily:14,emKey:'dm5-emergency',tab:Math.random().toString(36).slice(2),lastSnap:'',lastSet:'',lastSave:0,lastFolder:0,folderMsg:'',others:new Set(),bc:null,dirty:false};
const hasP=()=>{try{return typeof P!=='undefined'&&P&&P.id}catch(e){return false}};
const dbReady=()=>typeof DB!=='undefined'&&DB.db;
const waitFor=(f,ms=150)=>new Promise(r=>{const t=()=>f()?r():setTimeout(t,ms);t()});
const T=t=>t?new Date(t).toLocaleString('fa-IR'):'—';
const say=(m,ms)=>{try{toast(m,ms)}catch(e){console.log(m)}};

/* ---------- 1. persistent storage ---------- */
async function isPersisted(){try{return !!(navigator.storage&&navigator.storage.persisted&&await navigator.storage.persisted())}catch(e){return false}}
async function askPersist(){try{if(!navigator.storage||!navigator.storage.persist)return false;if(await isPersisted())return true;return await navigator.storage.persist()}catch(e){return false}}

/* ---------- 2. flush + emergency copy ---------- */
function emergencyWrite(){if(!hasP()||!dbReady())return;try{P.updated=Date.now();const data=JSON.stringify(P);
  if(data.length<4.5e6)localStorage.setItem(PV.emKey,JSON.stringify({id:P.id,updated:P.updated,tab:PV.tab,data}));
  DB.put('projects',P.id,P).then(()=>{PV.lastSave=Date.now()}).catch(()=>{})}catch(e){}
 mirrorSettings(true)}
async function flushNow(){if(!hasP())return false;P.updated=Date.now();await DB.put('projects',P.id,P);PV.lastSave=Date.now();try{localStorage.setItem('dm3-last',P.id)}catch(e){}await snapshot('ذخیرهٔ دستی',true);bcPost({type:'saved',id:P.id,updated:P.updated});return true}
async function recoverEmergency(){let em=null;try{em=JSON.parse(localStorage.getItem(PV.emKey)||'null')}catch(e){}if(!em||!em.data)return;
 let data;try{data=JSON.parse(em.data)}catch(e){localStorage.removeItem(PV.emKey);return}
 const stored=await DB.get('projects',em.id).catch(()=>null);const storedT=stored&&stored.updated||0;
 if(em.updated>storedT+1000){
  if(stored)await pushSnap(em.id,JSON.stringify(stored),'قبل از بازیابی اضطراری');
  await DB.put('projects',em.id,data);
  if(hasP()&&P.id===em.id){replaceP(data);say('آخرین تغییرات جلسهٔ قبل که ذخیره نشده بود بازیابی شد ✓',6000)}}
 localStorage.removeItem(PV.emKey)}
function replaceP(obj){Object.keys(P).forEach(k=>delete P[k]);Object.assign(P,obj);
 try{if(typeof migrate==='function')migrate(P)}catch(e){}
 try{if(typeof histReset==='function')histReset()}catch(e){}
 try{renderControl()}catch(e){}}

/* ---------- 3. snapshots ---------- */
const snapKey=id=>'snaps:'+id;
async function getSnaps(id){return (await DB.get('kv',snapKey(id)).catch(()=>null))||[]}
function prune(list){list.sort((a,b)=>b.t-a.t);const keep=list.slice(0,PV.snapRecent);const days=new Set(keep.map(s=>new Date(s.t).toDateString()));
 for(const s of list.slice(PV.snapRecent)){const d=new Date(s.t).toDateString();if(!days.has(d)&&days.size<PV.snapRecent+PV.snapDaily){days.add(d);keep.push(s)}}return keep}
async function pushSnap(id,json,reason){const list=await getSnaps(id);if(list[0]&&list[0].data===json)return false;list.unshift({t:Date.now(),reason,size:json.length,data:json});await DB.put('kv',snapKey(id),prune(list));return true}
async function snapshot(reason='خودکار',force=false){if(!hasP())return;const json=JSON.stringify(P);if(!force&&json===PV.lastSnap)return;try{if(await pushSnap(P.id,json,reason))PV.lastSnap=json}catch(e){console.warn('snapshot failed',e)}}
async function restoreSnap(i){const list=await getSnaps(P.id);const s=list[i];if(!s)return;
 let obj;try{obj=JSON.parse(s.data)}catch(e){say('این نسخه خراب است و بازیابی نشد');return}
 await snapshot('قبل از بازیابی نسخه',true);obj.updated=Date.now();replaceP(obj);await DB.put('projects',P.id,P);PV.lastSnap=JSON.stringify(P);say('نسخهٔ '+T(s.t)+' بازیابی شد. نسخهٔ قبلی هم نگه داشته شد.',6000);renderPanel()}

/* ---------- 4. settings mirror ---------- */
function mirrorSettings(force){if(typeof S==='undefined'||!dbReady())return;const j=JSON.stringify(S);if(!force&&j===PV.lastSet)return;PV.lastSet=j;DB.put('kv','settings-mirror',{t:Date.now(),s:JSON.parse(j)}).catch(()=>{})}
async function restoreSettings(){if(typeof S==='undefined')return;const m=await DB.get('kv','settings-mirror').catch(()=>null);const ls=localStorage.getItem('dm3-settings');
 if(m&&m.s&&!ls){Object.assign(S,m.s);try{localStorage.setItem('dm3-settings',JSON.stringify(S))}catch(e){}say('تنظیمات (کلیدها، کیفیت، صدا) از حافظهٔ پشتیبان برگردانده شد ✓',6000)}}

/* ---------- 5. full backup ---------- */
const isHandle=v=>typeof FileSystemHandle!=='undefined'&&v instanceof FileSystemHandle;
async function enc(v){if(v==null)return v;if(v instanceof Blob)return {__blob:await blobToData(v),type:v.type};
 if(v instanceof ArrayBuffer)return {__ab:await blobToData(new Blob([v]))};if(ArrayBuffer.isView(v))return {__ab:await blobToData(new Blob([v]))};
 if(isHandle(v))return undefined;if(Array.isArray(v)){const o=[];for(const x of v)o.push(await enc(x));return o}
 if(typeof v==='object'){if(v.constructor&&v.constructor!==Object)return undefined;const o={};for(const k of Object.keys(v)){const e=await enc(v[k]);if(e!==undefined)o[k]=e}return o}return v}
async function dec(v){if(v==null||typeof v!=='object')return v;if(Array.isArray(v)){const o=[];for(const x of v)o.push(await dec(x));return o}
 if(typeof v.__blob==='string'){const b=await dataToBlob(v.__blob);return v.type?new Blob([b],{type:v.type}):b}
 if(typeof v.__ab==='string')return (await dataToBlob(v.__ab)).arrayBuffer();const o={};for(const k of Object.keys(v))o[k]=await dec(v[k]);return o}
async function dumpStore(name,skip){const out=[];const keys=await DB.keys(name);for(const k of keys){if(skip&&skip(k))continue;const v=await DB.get(name,k);const e=await enc(v);if(e!==undefined)out.push([k,e])}return out}
const SECRET=['geminiKey','openaiKey','fbGemini'];
function cleanSettings(withKeys){const s=JSON.parse(JSON.stringify(S));if(!withKeys)SECRET.forEach(k=>{if(k in s)s[k]=''});return s}
async function buildBackup({audio=true,takes=false,keys=false,light=false}={}){if(hasP())await DB.put('projects',P.id,P);
 const out={format:'dadashmode-backup/5',schema:PV.schema,created:Date.now(),light,settings:cleanSettings(keys),
  projects:await dumpStore('projects'),
  kv:await dumpStore('kv',k=>k==='folder'||k==='backupFolder'||(light&&String(k).startsWith('sfx:'))),
  audio:light||!audio?[]:await dumpStore('audio'),takes:light||!takes?[]:await dumpStore('takes')};
 return new Blob([JSON.stringify(out)],{type:'application/json'})}
async function exportBackup(opts){const b=await buildBackup(opts);const d=new Date();const name=`DADASHMODE-backup-${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}.dmbackup.json`;download(b,name);return b.size}
async function importBackup(file){let j;try{j=JSON.parse(await file.text())}catch(e){throw new Error('فایل پشتیبان خوانده نشد (خراب یا ناقص است)')}
 if(!j||!/^dadashmode-backup\//.test(j.format||''))throw new Error('این فایل پشتیبان داداش‌مود نیست');
 const r={proj:0,projSkip:0,audio:0,kv:0,takes:0};
 for(const [k,v] of j.projects||[]){const cur=await DB.get('projects',k).catch(()=>null);const inc=await dec(v);
  if(cur&&(cur.updated||0)>=(inc.updated||0)){r.projSkip++;continue}
  if(cur)await pushSnap(k,JSON.stringify(cur),'قبل از ورود پشتیبان');await DB.put('projects',k,inc);r.proj++}
 for(const [store,key] of [['audio','audio'],['kv','kv'],['takes','takes']])for(const [k,v] of j[key]||[]){const cur=await DB.get(store,k).catch(()=>null);
  if(String(k).startsWith('snaps:')&&cur){const merged=prune([...cur,...(await dec(v))].filter((s,i,a)=>a.findIndex(x=>x.t===s.t)===i));await DB.put(store,k,merged);r.kv++;continue}
  if(cur==null){await DB.put(store,k,await dec(v));r[store==='kv'?'kv':store]++}}
 if(j.settings&&typeof S!=='undefined'){for(const [k,v] of Object.entries(j.settings)){if(S[k]===undefined||S[k]===''||S[k]===null)S[k]=v}try{localStorage.setItem('dm3-settings',JSON.stringify(S))}catch(e){}mirrorSettings(true)}
 return r}

/* ---------- 6. automatic folder backup (light: no audio blobs, no API keys) ---------- */
async function folderHandle(){return (await DB.get('kv','backupFolder').catch(()=>null))||(await DB.get('kv','folder').catch(()=>null))}
async function folderBackup(prompt=false){try{const h=await folderHandle();if(!h||!h.queryPermission){PV.folderMsg='پوشه‌ای انتخاب نشده';return false}
 let perm=await h.queryPermission({mode:'readwrite'});if(perm!=='granted'&&prompt)perm=await h.requestPermission({mode:'readwrite'});if(perm!=='granted'){PV.folderMsg='اجازهٔ نوشتن در پوشه لازم است';return false}
 const dir=await h.getDirectoryHandle('DADASHMODE-backup',{create:true});const blob=await buildBackup({light:true});const d=new Date().toISOString().slice(0,10);
 for(const n of ['latest.dmbackup.json',`day-${d}.dmbackup.json`]){const fh=await dir.getFileHandle(n,{create:true});const w=await fh.createWritable();await w.write(blob);await w.close()}
 PV.lastFolder=Date.now();PV.folderMsg='آخرین پشتیبان در پوشه: '+T(PV.lastFolder);return true}catch(e){PV.folderMsg='خطا در نوشتن پوشه: '+e.message;return false}}
async function pickFolder(){if(!window.showDirectoryPicker){say('این مرورگر انتخاب پوشه ندارد (کروم یا اج روی کامپیوتر)');return}try{const h=await window.showDirectoryPicker({mode:'readwrite'});await DB.put('kv','backupFolder',h);await folderBackup(true);say('پشتیبان خودکار در این پوشه فعال شد ✓');renderPanel()}catch(e){}}

/* ---------- 7. integrity + multi-tab ---------- */
async function integrity(){const out=[];const ps=await DB.all('projects').catch(()=>[]);for(const p of ps){const bad=[];if(!p||typeof p!=='object'){out.push({name:'؟',bad:['رکورد خراب']});continue}
 if(!Array.isArray(p.segments))bad.push('مراحل ندارد');if(!Array.isArray(p.players)||!p.players.length)bad.push('بازیکن ندارد');if(!Array.isArray(p.speakers)||!p.speakers.length)bad.push('گوینده ندارد');
 if(Array.isArray(p.segments)&&p.segments.some(s=>!s||!Array.isArray(s.lines)))bad.push('بعضی مراحل ناقص‌اند');out.push({id:p.id,name:p.name||'بی‌نام',bad,updated:p.updated})}return out}
function bcPost(m){try{PV.bc&&PV.bc.postMessage(Object.assign({tab:PV.tab},m))}catch(e){}}
function bcInit(){if(!('BroadcastChannel' in window))return;PV.bc=new BroadcastChannel('dadashmode-v5');PV.bc.onmessage=e=>{const m=e.data||{};if(m.tab===PV.tab)return;
 if(m.type==='hello'){PV.others.add(m.tab);bcPost({type:'here'});tabWarn()}else if(m.type==='here'){PV.others.add(m.tab);tabWarn()}else if(m.type==='bye'){PV.others.delete(m.tab);tabWarn()}
 else if(m.type==='saved'&&hasP()&&m.id===P.id&&m.updated>(P.updated||0)){say('⚠ همین قسمت در تب دیگری تغییر کرد. برای جلوگیری از بازنویسی، فقط در یک تب کار کنید.',8000)}};bcPost({type:'hello'})}
function tabWarn(){const b=document.getElementById('dm5Dot');if(b)b.title=PV.others.size?'اپ در تب دیگری هم باز است':'';renderDot()}

/* ---------- hooks ---------- */
function hookSave(){if(typeof save!=='function'||save.__dm5)return;const prev=save;const w=function(){const r=prev.apply(this,arguments);PV.dirty=true;clearTimeout(PV.snT);PV.snT=setTimeout(()=>{snapshot();PV.dirty=false;PV.lastSave=Date.now();if(hasP())bcPost({type:'saved',id:P.id,updated:Date.now()})},4000);return r};w.__dm5=true;save=w}
addEventListener('pagehide',()=>{emergencyWrite();bcPost({type:'bye'})});
addEventListener('beforeunload',emergencyWrite);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')emergencyWrite()});
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();flushNow().then(ok=>ok&&say('ذخیره شد ✓'))}});
document.addEventListener('pointerdown',function once(){document.removeEventListener('pointerdown',once,true);askPersist().then(renderDot)},true);

/* ---------- UI: floating memory button + panel ---------- */
const css=`#dm5Btn{position:fixed;left:14px;bottom:14px;z-index:9998;display:flex;align-items:center;gap:8px;padding:9px 14px;border-radius:999px;border:1px solid #ffffff2a;background:#141821ee;color:#fff;font:600 13px Vazirmatn,Tahoma,sans-serif;cursor:pointer;box-shadow:0 6px 24px #0008;backdrop-filter:blur(8px)}
#dm5Dot{width:10px;height:10px;border-radius:50%;background:#facc15;box-shadow:0 0 8px currentColor}
#dm5Ov{position:fixed;inset:0;z-index:9999;background:#000b;display:none;align-items:center;justify-content:center;direction:rtl}
#dm5Ov.on{display:flex}#dm5P{width:min(720px,94vw);max-height:88vh;overflow:auto;background:#12151c;color:#eef;border:1px solid #ffffff22;border-radius:18px;padding:20px 22px;font:14px/1.9 Vazirmatn,Tahoma,sans-serif}
#dm5P h3{margin:0 0 6px;font-size:18px}#dm5P h4{margin:16px 0 6px;font-size:14px;color:#9fb3ff}#dm5P .r{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:6px 0}
#dm5P button{background:#232a38;color:#fff;border:1px solid #ffffff22;border-radius:10px;padding:6px 12px;font:inherit;cursor:pointer}#dm5P button.p{background:#2563eb;border-color:#3b82f6}
#dm5P .s{padding:4px 10px;border-radius:8px;background:#1b202b;margin:3px 0}#dm5P .ok{color:#4ade80}#dm5P .w{color:#facc15}#dm5P .n{color:#f87171}#dm5P small{color:#8b93a7}
#dm5P .snap{display:flex;justify-content:space-between;gap:8px;align-items:center;border-bottom:1px solid #ffffff10;padding:4px 0}`;
function mountUI(){if(document.getElementById('dm5Btn'))return;const st_=document.createElement('style');st_.textContent=css;document.head.appendChild(st_);
 const b=document.createElement('button');b.id='dm5Btn';b.innerHTML='<span id="dm5Dot"></span><span>حافظه</span>';b.onclick=()=>{document.getElementById('dm5Ov').classList.add('on');renderPanel()};document.body.appendChild(b);
 const ov=document.createElement('div');ov.id='dm5Ov';ov.innerHTML='<div id="dm5P"></div>';ov.onclick=e=>{if(e.target===ov)ov.classList.remove('on')};document.body.appendChild(ov);
 ov.addEventListener('click',onPanelClick);ov.addEventListener('change',onPanelChange);renderDot()}
async function renderDot(){const d=document.getElementById('dm5Dot');if(!d)return;const p=await isPersisted();d.style.background=PV.others.size?'#f97316':p?'#22c55e':'#facc15'}
async function renderPanel(){const el=document.getElementById('dm5P');if(!el)return;const p=await isPersisted();let est=null;try{est=await navigator.storage.estimate()}catch(e){}
 const snaps=hasP()?await getSnaps(P.id):[];const integ=await integrity();const fh=await folderHandle();const mir=await DB.get('kv','settings-mirror').catch(()=>null);
 const row=(cls,t)=>`<div class="s ${cls}">${t}</div>`;
 el.innerHTML=`<h3>💾 حافظهٔ دائمی و بازیابی</h3><small>همه‌چیز روی همین دستگاه ذخیره می‌شود؛ با بستن برنامه، رفرش یا ری‌استارت چیزی از بین نمی‌رود.</small>
 <h4>وضعیت</h4>
 ${row(p?'ok':'w',p?'✓ ذخیرهٔ دائمی فعال است (مرورگر داده‌ها را پاک نمی‌کند)':'⚠ ذخیرهٔ دائمی هنوز فعال نیست. دکمهٔ زیر را بزنید؛ اگر فعال نشد، اپ را «نصب» کنید (آیکون نصب در نوار آدرس کروم).')}
 ${est?row('',`فضای استفاده‌شده ${fmtSize(est.usage||0)} از ${fmtSize(est.quota||0)}`):''}
 ${row('ok','آخرین ذخیره: '+T(Math.max(PV.lastSave,hasP()&&P.updated||0)))}
 ${row(snaps.length?'ok':'w',`نسخه‌های پشتیبان این قسمت: ${fa(snaps.length)}`)}
 ${row(mir?'ok':'w',mir?'✓ تنظیمات و کلیدها در حافظهٔ دوم هم ذخیره‌اند':'تنظیمات هنوز در حافظهٔ دوم ذخیره نشده')}
 ${row(fh?'ok':'w',fh?(PV.folderMsg||'پوشهٔ پشتیبان انتخاب شده'):'پشتیبان خودکار در پوشه خاموش است')}
 ${PV.others.size?row('n','⚠ اپ در تب/پنجرهٔ دیگری هم باز است. فقط در یکی کار کنید تا تغییرات روی هم نیفتند.'):''}
 ${integ.filter(x=>x.bad.length).map(x=>row('n',`⚠ «${esc(x.name)}»: ${x.bad.join('، ')} · از فهرست نسخه‌ها بازیابی کنید`)).join('')}
 <div class="r"><button class="p" data-a="persist">فعال‌سازی ذخیرهٔ دائمی</button><button data-a="flush">ذخیرهٔ فوری (Ctrl+S)</button><button data-a="snap">ساخت نسخهٔ پشتیبان الان</button></div>
 <h4>فایل پشتیبان کامل</h4><small>قسمت‌ها، همهٔ صداها، بانک SFX، منابع سناریو و تنظیمات در یک فایل. برای انتقال به دستگاه دیگر یا قبل از پاک کردن مرورگر.</small>
 <div class="r"><label><input type="checkbox" id="dm5Takes"> ویدیوهای ضبط‌شده هم باشد (حجیم)</label><label><input type="checkbox" id="dm5Keys"> کلیدهای API هم باشد</label></div>
 <div class="r"><button class="p" data-a="export">خروجی پشتیبان کامل</button><label><button data-a="importBtn">ورود فایل پشتیبان</button><input type="file" id="dm5Imp" accept=".json,application/json" hidden></label></div>
 <small>ورود پشتیبان هیچ دادهٔ جدیدتری را بازنویسی نمی‌کند و قبل از هر جایگزینی یک نسخه نگه می‌دارد.</small>
 <h4>پشتیبان خودکار در پوشه</h4><small>هر ۱۰ دقیقه یک پشتیبان سبک (بدون صداهای حجیم و بدون کلید API) در پوشهٔ DADASHMODE-backup نوشته می‌شود. پوشهٔ همگام گوگل‌درایو را انتخاب کنید تا نسخهٔ ابری هم داشته باشید.</small>
 <div class="r"><button data-a="pick">انتخاب پوشه</button>${fh?'<button data-a="folderNow">پشتیبان‌گیری در پوشه الان</button>':''}</div>
 <h4>نسخه‌های این قسمت</h4>${snaps.length?snaps.map((s,i)=>`<div class="snap"><span>${T(s.t)} · <small>${esc(s.reason||'')} · ${fmtSize(s.size||0)}</small></span><button data-a="restore" data-i="${i}">بازیابی</button></div>`).join(''):'<small>هنوز نسخه‌ای ساخته نشده؛ بعد از اولین تغییر خودکار ساخته می‌شود.</small>'}
 <div class="r" style="margin-top:14px"><button data-a="close">بستن</button></div>`}
async function onPanelClick(e){const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a;b.disabled=true;try{
 if(a==='close')document.getElementById('dm5Ov').classList.remove('on');
 else if(a==='persist'){const ok=await askPersist();say(ok?'ذخیرهٔ دائمی فعال شد ✓':'مرورگر اجازه نداد. اپ را نصب کنید (کروم ← نصب برنامه) و دوباره بزنید.',6000)}
 else if(a==='flush'){await flushNow();say('ذخیره شد ✓')}
 else if(a==='snap'){await snapshot('دستی',true);say('نسخهٔ پشتیبان ساخته شد ✓')}
 else if(a==='export'){say('در حال ساخت فایل پشتیبان...');const n=await exportBackup({audio:true,takes:document.getElementById('dm5Takes').checked,keys:document.getElementById('dm5Keys').checked});say('فایل پشتیبان ساخته شد · '+fmtSize(n),5000)}
 else if(a==='importBtn')document.getElementById('dm5Imp').click();
 else if(a==='pick')await pickFolder();
 else if(a==='folderNow'){const ok=await folderBackup(true);say(ok?'پشتیبان در پوشه نوشته شد ✓':PV.folderMsg,5000)}
 else if(a==='restore'){if(confirm('این نسخه بازیابی شود؟ نسخهٔ فعلی هم نگه داشته می‌شود.'))await restoreSnap(+b.dataset.i)}
 }catch(err){say(err.message||String(err),6000)}finally{b.disabled=false;if(a!=='close')renderPanel();renderDot()}}
async function onPanelChange(e){if(e.target.id!=='dm5Imp')return;const f=e.target.files[0];e.target.value='';if(!f)return;try{const r=await importBackup(f);
 say(`ورود انجام شد: ${fa(r.proj)} قسمت، ${fa(r.audio)} صدا، ${fa(r.kv)} مورد دیگر${r.projSkip?` · ${fa(r.projSkip)} قسمت نسخهٔ جدیدتر داشت و دست نخورد`:''}. صفحه دوباره بارگذاری می‌شود.`,7000);setTimeout(()=>location.reload(),2500)}catch(err){say(err.message,7000)}}

/* ---------- boot ---------- */
(async()=>{await waitFor(dbReady);try{await DB.put('kv','schema',{v:PV.schema,t:Date.now()})}catch(e){}
 await restoreSettings();mirrorSettings(true);
 await waitFor(()=>document.body);mountUI();bcInit();askPersist().then(renderDot);
 await waitFor(hasP);hookSave();await recoverEmergency();PV.lastSave=P.updated||0;setTimeout(()=>snapshot('شروع جلسه'),3000);
 setInterval(()=>mirrorSettings(false),2000);
 setInterval(()=>{if(Date.now()-PV.lastFolder>10*60e3)folderBackup(false)},60e3);
 window.DM5={flushNow,snapshot,exportBackup,importBackup,folderBackup,integrity,getSnaps:()=>getSnaps(P.id),_prune:prune,_enc:enc,_dec:dec}})();
})();
