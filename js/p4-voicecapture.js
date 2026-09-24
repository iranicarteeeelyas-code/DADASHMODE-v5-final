/* DADASHMODE v5 · PHASE 4 · Gemini voice capture
   The Gemini app on a phone cannot be connected to a web app, so we capture its SOUND instead:
   1) the app writes a script sheet for Gemini Live (every AI-referee line + the exact tone)
   2) capture: line-by-line from the microphone / a tab, or one long take (live or an imported screen-recording)
   3) automatic silence detection cuts the long take into clips and maps them to the lines in order
   4) you listen, fix any mapping, and save → each clip is installed into the existing voice bank
      (same key as generated voices), so playback, recording, inspection and phase-1 backups all just work.
   The raw session is kept on the device, so closing the app mid-review loses nothing. */
'use strict';
(function(){
const D=DM5,fa=D.fa,esc=D.esc;
const OPT_DEF={minSilence:.55,minSpeech:.35,pad:.12,sens:.35,autoStop:1.2,onlyMissing:true,dropShort:true};
const opt=()=>Object.assign({},OPT_DEF,(D.P()&&D.P().voiceCapture)||{});
const setOpt=(k,v)=>{const p=D.P();p.voiceCapture=Object.assign({},opt(),{[k]:v});D.save()};

/* ================= pure audio analysis (unit-tested) ================= */
function mono(ab){if(ab.numberOfChannels===1)return ab.getChannelData(0);const n=ab.length,o=new Float32Array(n);for(let c=0;c<ab.numberOfChannels;c++){const d=ab.getChannelData(c);for(let i=0;i<n;i++)o[i]+=d[i]/ab.numberOfChannels}return o}
function frameDb(x,rate,hop=.02){const h=Math.max(1,Math.round(rate*hop));const n=Math.floor(x.length/h);const db=new Float32Array(n);for(let f=0;f<n;f++){let s=0;const o=f*h;for(let i=0;i<h;i++){const v=x[o+i];s+=v*v}db[f]=10*Math.log10(s/h+1e-12)}return{db,hop:h/rate}}
function pct(arr,p){const a=Array.from(arr).sort((x,y)=>x-y);return a[Math.min(a.length-1,Math.max(0,Math.floor(p*(a.length-1))))]}
/* returns [{s,e,short}] in seconds */
function segment(x,rate,o={}){o=Object.assign({},OPT_DEF,o);const{db,hop}=frameDb(x,rate);if(!db.length)return[];
 const floor=pct(db,.1),peak=pct(db,.97);const range=Math.max(6,peak-floor);const on=floor+Math.max(6,range*o.sens),off=on-3;
 const raw=[];let inS=false,s0=0;for(let f=0;f<db.length;f++){if(!inS&&db[f]>on){inS=true;s0=f}else if(inS&&db[f]<off){inS=false;raw.push([s0,f])}}if(inS)raw.push([s0,db.length]);
 const gap=Math.round(o.minSilence/hop);const merged=[];for(const r of raw){const l=merged[merged.length-1];if(l&&r[0]-l[1]<gap)l[1]=r[1];else merged.push([...r])}
 const dur=x.length/rate;return merged.map(([a,b])=>({s:Math.max(0,a*hop-o.pad),e:Math.min(dur,b*hop+o.pad),short:(b-a)*hop<o.minSpeech})).filter(c=>c.e-c.s>.08)}
/* best split point (seconds, absolute) = quietest 150ms window in the middle 20-80% of a clip */
function splitPoint(x,rate,s,e){const a=Math.floor(rate*(s+(e-s)*.2)),b=Math.floor(rate*(s+(e-s)*.8)),w=Math.floor(rate*.15);let best=a,bv=1e9;for(let i=a;i+w<b;i+=Math.floor(rate*.01)){let m=0;for(let k=i;k<i+w;k+=4)m+=x[k]*x[k];if(m<bv){bv=m;best=i}}return (best+w/2)/rate}
function trimEdges(x,rate,s,e,pad=.08){const{db,hop}=frameDb(x.subarray(Math.floor(s*rate),Math.floor(e*rate)),rate,.01);if(!db.length)return[s,e];const thr=pct(db,.95)-35;let a=0,b=db.length-1;while(a<b&&db[a]<thr)a++;while(b>a&&db[b]<thr)b--;return[Math.max(0,s+a*hop-pad),Math.min(x.length/rate,s+(b+1)*hop+pad)]}
const estDur=t=>Math.max(1.2,(t||'').length*.075);
D.vc={segment,splitPoint,trimEdges,frameDb,estDur};

/* ================= state ================= */
const S4={tab:'script',idx:0,rec:null,stream:null,chunks:[],src:'mic',live:null,clip:null,sess:null,buf:null,playing:null};
function targets(){const o=opt();return D.lines().filter(x=>(x.l.text||'').trim()&&(!o.onlyMissing||(typeof vstat==='function'?vstat(x.l)!=='ready':true)))}
function allTargets(){return D.lines().filter(x=>(x.l.text||'').trim())}
function lineById(id){const x=D.lines().find(y=>y.l.id===id);return x?x.l:null}
function ctx(){try{AE.init();return AE.ctx}catch(e){if(!S4._ctx)S4._ctx=new AudioContext({sampleRate:48000});return S4._ctx}}
async function decode(blob){return await ctx().decodeAudioData(await blob.arrayBuffer())}
function slice(ab,s,e){const r=ab.sampleRate,a=Math.floor(s*r),b=Math.min(ab.length,Math.floor(e*r));const out=ctx().createBuffer(1,Math.max(1,b-a),r);const src=mono(ab);const d=out.getChannelData(0);d.set(src.subarray(a,b));
 const f=Math.min(d.length>>1,Math.floor(r*.012));for(let i=0;i<f;i++){d[i]*=i/f;d[d.length-1-i]*=i/f}return out}
function stopPlay(){try{S4.playing&&S4.playing.stop()}catch(e){}S4.playing=null}
function playBuf(ab){stopPlay();const c=ctx();c.resume&&c.resume();const s=c.createBufferSource();s.buffer=ab;s.connect(c.destination);s.start();S4.playing=s}
async function saveClip(ln,ab,source='gemini-live'){const blob=D.wav(ab);if(typeof saveAudio==='function')await saveAudio(ln,blob,source);else throw new Error('بانک صدا در این نسخه پیدا نشد');try{refreshVoiceBits()}catch(e){}}

/* ================= capture ================= */
async function openStream(kind){if(kind==='tab'){const s=await navigator.mediaDevices.getDisplayMedia({video:true,audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});s.getVideoTracks().forEach(t=>t.stop());if(!s.getAudioTracks().length)throw new Error('صدای تب/سیستم انتخاب نشد. موقع اشتراک، تیک «اشتراک صدا» را بزنید');return s}
 return navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false,channelCount:1}})}
function recMime(){return['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg'].find(m=>window.MediaRecorder&&MediaRecorder.isTypeSupported(m))||''}
async function startCapture(mode){if(S4.rec)return;const stream=await openStream(S4.src);S4.stream=stream;S4.chunks=[];const rec=new MediaRecorder(stream,recMime()?{mimeType:recMime(),audioBitsPerSecond:192000}:undefined);
 rec.ondataavailable=e=>e.data.size&&S4.chunks.push(e.data);S4.rec=rec;S4.mode=mode;
 const c=ctx();const an=c.createAnalyser();an.fftSize=2048;const node=c.createMediaStreamSource(stream);node.connect(an);const buf=new Float32Array(an.fftSize);let spoke=false,quietSince=0,t0=performance.now();
 S4.live={an,node,raf:0};const tick=()=>{if(!S4.rec)return;an.getFloatTimeDomainData(buf);let s=0;for(const v of buf)s+=v*v;const db=10*Math.log10(s/buf.length+1e-12);
  const m=document.getElementById('dm5-meter');if(m)m.style.width=Math.max(0,Math.min(100,(db+70)*1.6))+'%';
  const now=performance.now();if(db>-38){spoke=true;quietSince=now}else if(!quietSince)quietSince=now;
  if(mode==='line'&&opt().autoStop>0&&spoke&&now-quietSince>opt().autoStop*1000&&now-t0>800){stopCapture();return}
  const el=document.getElementById('dm5-rect');if(el)el.textContent=fa(((now-t0)/1000).toFixed(1))+' ث';S4.live.raf=requestAnimationFrame(tick)};tick();
 return new Promise(res=>{rec.onstop=async()=>{cancelAnimationFrame(S4.live&&S4.live.raf);try{node.disconnect()}catch(e){}stream.getTracks().forEach(t=>t.stop());const blob=new Blob(S4.chunks,{type:rec.mimeType||'audio/webm'});S4.rec=null;S4.stream=null;res(blob)};rec.start(250);dr.render()})}
function stopCapture(){if(S4.rec&&S4.rec.state!=='inactive')S4.rec.stop()}

/* ================= session (long take) ================= */
async function buildSession(blob){const ab=await decode(blob);S4.buf=ab;const x=mono(ab);let clips=segment(x,ab.sampleRate,opt());if(opt().dropShort)clips=clips.map(c=>Object.assign(c,{skip:c.short}));
 const tg=targets();let k=0;clips.forEach(c=>{c.id=D.id();if(!c.skip&&k<tg.length){c.line=tg[k].l.id;k++}else c.line='';c.warn=''});checkWarn(clips);
 S4.sess={blob,clips,created:Date.now(),saved:false};await D.kvPut('p4:session',{blob,clips,created:S4.sess.created});return S4.sess}
function checkWarn(clips){clips.forEach(c=>{const l=c.line&&lineById(c.line);c.warn='';if(!l)return;const r=(c.e-c.s)/estDur(l.text);if(r>1.9)c.warn='خیلی بلندتر از متن: شاید دو خط به هم چسبیده (دکمهٔ «نصف کن»)';else if(r<.45)c.warn='خیلی کوتاه‌تر از متن: شاید یک خط دو تکه شده (دکمهٔ «ادغام با بعدی»)'})}
function remap(clips){const tg=targets();let k=0;clips.forEach(c=>{if(c.skip){c.line='';return}c.line=k<tg.length?tg[k++].l.id:''});checkWarn(clips)}
async function persistSess(){if(S4.sess)await D.kvPut('p4:session',{blob:S4.sess.blob,clips:S4.sess.clips,created:S4.sess.created})}
async function restoreSess(){if(S4.sess)return;const o=await D.kvGet('p4:session');if(o&&o.blob&&o.clips){try{S4.buf=await decode(o.blob);S4.sess={blob:o.blob,clips:o.clips,created:o.created};D.toast('جلسهٔ ضبط قبلی بازیابی شد')}catch(e){}}}

/* ================= Gemini script sheet ================= */
function sheet(kind){const tg=targets();const p=D.P();const head=kind==='next'?
 `سلام جمنای. تو «نیلا» هستی، مجری و داور زنِ جوان و پرانرژی مسابقهٔ تلویزیونی داداش‌مود. فارسی تهرانی طبیعی.
قانون کار: من «بعدی» می‌گویم، تو فقط جملهٔ بعدی لیست را با لحن گفته‌شده می‌خوانی و بعد کاملاً ساکت می‌مانی.
هیچ چیز اضافه نگو: نه شماره، نه توضیح، نه «باشه». اگر گفتم «دوباره»، همان جمله را دوباره بخوان.
اِعراب‌ها تلفظ درست را نشان می‌دهند؛ دقیق رعایت کن.`:
 `سلام جمنای. تو «نیلا» هستی، مجری و داور زنِ جوان و پرانرژی مسابقهٔ تلویزیونی داداش‌مود. فارسی تهرانی طبیعی.
همهٔ جمله‌های زیر را به ترتیب بخوان. بعد از هر جمله حدود ۳ ثانیه کامل ساکت بمان، بعد جملهٔ بعدی.
هیچ چیز اضافه نگو: نه شماره، نه توضیح. لحن هر جمله داخل پرانتز است و خودِ پرانتز را نخوان.`;
 const body=tg.map((x,i)=>{const e=(()=>{try{return EMO[x.l.emotion]}catch(er){return null}})();const t=typeof ttsText==='function'?ttsText(x.l):x.l.text;return `${fa(i+1)}. (${e?e.fa:x.l.emotion}${x.l.direction?'، '+x.l.direction:''}) ${t}`}).join('\n');
 return `${head}\n\n— ${p.name} · ${fa(tg.length)} جمله —\n${body}`}

/* ================= UI ================= */
const dr=D.drawer('vc','🎙 ضبط صدای جمنای',[['script','۱. متن برای جمنای'],['line','۲. ضبط خط‌به‌خط'],['long','۳. ضبط یکسره / فایل'],['opt','تنظیمات']]);
function srcPicker(){return `<div class="dm5-row"><b>منبع صدا:</b><select data-src><option value="mic" ${S4.src==='mic'?'selected':''}>میکروفون (گوشی کنار لپ‌تاپ یا خود گوشی)</option><option value="tab" ${S4.src==='tab'?'selected':''}>صدای یک تب / سیستم (کامپیوتر)</option></select></div>
 <div class="dm5-meter" style="margin:6px 0"><i id="dm5-meter"></i></div>`}
dr.render=async()=>{const p=D.P();if(!p){dr.body.innerHTML='<p>قسمتی باز نیست.</p>';return}const tg=targets();const o=opt();
 if(dr.tab==='script'){dr.body.innerHTML=`<div class="dm5-card"><h4>چطور کار می‌کند</h4><div class="dm5-muted">اپ جمنای روی گوشی به هیچ اپ دیگری وصل نمی‌شود؛ پس صدایش را ضبط می‌کنیم. این متن را در Gemini Live (گوشی) بچسبانید تا همهٔ دیالوگ‌های داور را با لحن درست بخواند. هر جمله بعد از ذخیره، دقیقاً سر جای خودش در بانک صدا می‌نشیند.</div>
  <div class="dm5-row" style="margin-top:6px"><span class="dm5-pill ${tg.length?'yel':'grn'}">${fa(tg.length)} جمله ${o.onlyMissing?'بدون صدا':'در کل'}</span><label class="dm5-row"><input type="checkbox" class="dm5-chk" data-o="onlyMissing" ${o.onlyMissing?'checked':''}> فقط خط‌هایی که صدا ندارند</label></div></div>
  <div class="dm5-card"><h4>روش پیشنهادی: «بعدی» (مطمئن‌تر)</h4><div class="dm5-muted">شما «بعدی» می‌گویید و جمنای فقط یک جمله می‌خواند. با «ضبط خط‌به‌خط» عالی جور است. در ضبط یکسره، کلمهٔ کوتاه «بعدی» خودکار حذف می‌شود.</div>
  <textarea readonly data-sheet="next">${esc(sheet('next'))}</textarea><div class="dm5-row"><button class="dm5-btn pri" data-copy="next">کپی</button><button class="dm5-btn" data-share="next">ارسال به گوشی</button></div></div>
  <div class="dm5-card"><h4>روش سریع: یکسره با مکث ۳ ثانیه</h4><textarea readonly data-sheet="all">${esc(sheet('all'))}</textarea><div class="dm5-row"><button class="dm5-btn" data-copy="all">کپی</button><button class="dm5-btn" data-share="all">ارسال به گوشی</button></div></div>
  <div class="dm5-card dm5-muted">بهترین کیفیت: روی اندروید با «ضبط صفحه» همراه با «صدای داخلی/رسانه» از Gemini Live فیلم بگیرید و فایل را در زبانهٔ ۳ بدهید؛ صدای اتاق و صدای خودتان وارد نمی‌شود.</div>`;return}
 if(dr.tab==='line'){const list=allTargets();if(S4.idx>=list.length)S4.idx=0;const cur=list[S4.idx];const ready=cur&&typeof vstat==='function'&&vstat(cur.l)==='ready';
  dr.body.innerHTML=`<div class="dm5-card">${srcPicker()}
  <div class="dm5-row"><button class="dm5-btn" data-l="prev">→ قبلی</button><select data-pick style="flex:1">${list.map((x,i)=>`<option value="${i}" ${i===S4.idx?'selected':''}>${fa(i+1)}. ${typeof vstat==='function'&&vstat(x.l)==='ready'?'✓ ':'○ '}${esc(x.l.text.slice(0,40))}</option>`).join('')}</select><button class="dm5-btn" data-l="next">بعدی ←</button></div></div>
  ${cur?`<div class="dm5-card" style="border-color:#ff3b3b"><div class="dm5-muted">مرحلهٔ ${fa(cur.i+1)} · ${esc(D.typeName(cur.s.type))} · لحن: <b>${esc(D.emoName(cur.l.emotion))}</b>${cur.l.direction?' · '+esc(cur.l.direction):''} ${ready?'<span class="dm5-pill grn">صدا دارد</span>':'<span class="dm5-pill red">بدون صدا</span>'}</div>
   <div style="font-size:20px;font-weight:900;margin:8px 0">${esc(cur.l.text)}</div>
   <div class="dm5-row">${S4.rec?`<button class="dm5-btn warn" data-l="stop">⏹ توقف <span id="dm5-rect"></span></button>`:`<button class="dm5-btn pri" data-l="rec">⏺ ضبط این خط</button>`}
   ${S4.clip?`<button class="dm5-btn" data-l="play">▶ گوش بده</button><button class="dm5-btn ok" data-l="save">✓ ذخیره و خط بعد</button><button class="dm5-btn" data-l="rec">↺ دوباره</button>`:''}${ready?`<button class="dm5-btn" data-l="cur">▶ صدای فعلی</button>`:''}</div>
   ${S4.clip?`<canvas class="dm5-wave" id="dm5-wave"></canvas><div class="dm5-muted">${fa(S4.clip.duration.toFixed(1))} ثانیه · سکوت اول و آخر خودکار بریده شد</div>`:''}
   <div class="dm5-muted" style="margin-top:6px">${o.autoStop>0?`بعد از ${fa(o.autoStop)} ثانیه سکوت، ضبط خودکار تمام می‌شود.`:'توقف دستی.'} به جمنای بگویید «بعدی» یا «دوباره».</div></div>`:'<p>دیالوگی نیست.</p>'}`;
  if(S4.clip)drawWave(document.getElementById('dm5-wave'),S4.clip);return}
 if(dr.tab==='long'){await restoreSess();const ss=S4.sess;
  dr.body.innerHTML=`<div class="dm5-card">${srcPicker()}<div class="dm5-row">${S4.rec?`<button class="dm5-btn warn" data-g="stop">⏹ پایان ضبط <span id="dm5-rect"></span></button>`:`<button class="dm5-btn pri" data-g="rec">⏺ شروع ضبط یکسره</button>`}
  <label class="dm5-btn">📁 فایل صدا/ویدیو ضبط‌شده<input type="file" accept="audio/*,video/*" data-g="file" hidden></label></div>
  <div class="dm5-muted">فایل ضبط صفحهٔ گوشی (mp4) هم قبول است. اپ جمله‌ها را با تشخیص سکوت جدا و به‌ترتیب به ${fa(tg.length)} خطِ ${o.onlyMissing?'بدون صدا':''} وصل می‌کند.</div></div>
  ${ss?`<div class="dm5-card"><div class="dm5-row"><b style="flex:1">${fa(ss.clips.filter(c=>!c.skip).length)} تکه ← ${fa(ss.clips.filter(c=>c.line&&!c.skip).length)} خط وصل شد</b><button class="dm5-btn" data-g="remap">↻ چیدن دوباره به ترتیب</button><button class="dm5-btn ok" data-g="saveall">✓ ذخیرهٔ همه در بانک صدا</button><button class="dm5-btn" data-g="clear">پاک کردن جلسه</button></div>
   ${ss.clips.filter(c=>!c.skip).length!==tg.length&&!ss.saved?`<div class="dm5-muted" style="color:#fbbf24">تعداد تکه‌ها (${fa(ss.clips.filter(c=>!c.skip).length)}) با تعداد خط‌ها (${fa(tg.length)}) برابر نیست. هشدارهای زرد را ببینید، ادغام/نصف کنید و بعد «چیدن دوباره».</div>`:''}</div>
   ${ss.clips.map((c,k)=>`<div class="dm5-card" data-c="${c.id}" style="${c.skip?'opacity:.5':''}${c.warn?';border-color:#b45309':''}"><div class="dm5-row"><b>${fa(k+1)}</b><span class="dm5-muted">${fa(c.s.toFixed(1))}–${fa(c.e.toFixed(1))} ث (${fa((c.e-c.s).toFixed(1))})</span>${c.short?'<span class="dm5-pill yel">کوتاه (احتمالاً «بعدی»)</span>':''}${c.saved?'<span class="dm5-pill grn">ذخیره شد</span>':''}<span style="flex:1"></span>
    <button class="dm5-btn" data-c-a="play">▶</button><button class="dm5-btn" data-c-a="split">نصف کن</button><button class="dm5-btn" data-c-a="merge">ادغام با بعدی</button><button class="dm5-btn" data-c-a="skip">${c.skip?'برگردان':'حذف'}</button></div>
    ${c.skip?'':`<select data-c-line style="width:100%;margin-top:4px"><option value="">— به هیچ خطی وصل نشود —</option>${allTargets().map(x=>`<option value="${x.l.id}" ${x.l.id===c.line?'selected':''}>${fa(x.i+1)} · ${esc(x.l.text.slice(0,60))}</option>`).join('')}</select>`}${c.warn?`<div class="dm5-muted" style="color:#fbbf24">⚠ ${esc(c.warn)}</div>`:''}</div>`).join('')}`:''}`;return}
 dr.body.innerHTML=`<div class="dm5-card"><h4>تشخیص سکوت</h4>
 <label class="dm5-row">حداقل سکوت بین دو جمله <input class="dm5-in" type="number" step=".05" min=".2" max="3" data-o="minSilence" value="${o.minSilence}" style="width:70px"> ثانیه</label>
 <label class="dm5-row">حساسیت (کمتر = حساس‌تر) <input class="dm5-in" type="number" step=".05" min=".1" max=".8" data-o="sens" value="${o.sens}" style="width:70px"></label>
 <label class="dm5-row">تکه‌های کوتاه‌تر از <input class="dm5-in" type="number" step=".05" min=".1" max="1.5" data-o="minSpeech" value="${o.minSpeech}" style="width:70px"> ثانیه = احتمالاً «بعدی»</label>
 <label class="dm5-row"><input type="checkbox" class="dm5-chk" data-o="dropShort" ${o.dropShort?'checked':''}> تکه‌های کوتاه خودکار کنار گذاشته شوند</label>
 <label class="dm5-row">توقف خودکار ضبط خط‌به‌خط بعد از <input class="dm5-in" type="number" step=".1" min="0" max="5" data-o="autoStop" value="${o.autoStop}" style="width:70px"> ثانیه سکوت (۰ = دستی)</label></div>
 <div class="dm5-card dm5-muted">راه دیگر، Gemini Live API مستقیم از داخل اپ است (بدون گوشی) که از ایران VPN و کلید لازم دارد؛ ساخت صدای Gemini با کلید از قبل در «صدا و گوینده» هست.</div>`};
function drawWave(c,ab){if(!c)return;const w=c.width=c.clientWidth*2,h=c.height=112;const x=c.getContext('2d');const d=mono(ab);x.fillStyle='#0e0b10';x.fillRect(0,0,w,h);x.fillStyle='#ff5a5a';const st=Math.max(1,Math.floor(d.length/w));for(let i=0;i<w;i++){let m=0;for(let k=i*st;k<(i+1)*st&&k<d.length;k++)m=Math.max(m,Math.abs(d[k]));x.fillRect(i,h/2-m*h/2,1,m*h)}}
dr.el.addEventListener('change',async e=>{const t=e.target;
 if(t.dataset.src!==undefined){S4.src=t.value;return}
 if(t.dataset.o){setOpt(t.dataset.o,t.type==='checkbox'?t.checked:+t.value);if(t.type==='checkbox')dr.render();return}
 if(t.dataset.pick!==undefined){S4.idx=+t.value;S4.clip=null;dr.render();return}
 if(t.dataset.g==='file'){const f=t.files[0];if(!f)return;D.toast('در حال تحلیل فایل…');try{await buildSession(f);dr.render()}catch(err){D.toast('این فایل خوانده نشد: '+err.message,5000)}return}
 if(t.dataset.cLine!==undefined){const c=S4.sess.clips.find(o=>o.id===t.closest('[data-c]').dataset.c);c.line=t.value;checkWarn(S4.sess.clips);persistSess();dr.render()}});
dr.el.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;
 if(b.dataset.copy){const txt=dr.body.querySelector(`[data-sheet="${b.dataset.copy}"]`).value;try{await navigator.clipboard.writeText(txt);D.toast('کپی شد؛ در Gemini Live بچسبانید')}catch(err){dr.body.querySelector(`[data-sheet="${b.dataset.copy}"]`).select();document.execCommand('copy');D.toast('کپی شد')}return}
 if(b.dataset.share){const txt=dr.body.querySelector(`[data-sheet="${b.dataset.share}"]`).value;if(navigator.share){try{await navigator.share({title:'متن داور داداش‌مود',text:txt})}catch(err){}}else{try{download(new Blob([txt],{type:'text/plain'}),'gemini-script.txt')}catch(err){}}return}
 const L=b.dataset.l;if(L){const list=allTargets();const cur=list[S4.idx];
  try{if(L==='prev'){S4.idx=Math.max(0,S4.idx-1);S4.clip=null}else if(L==='next'){S4.idx=Math.min(list.length-1,S4.idx+1);S4.clip=null}
  else if(L==='rec'){S4.clip=null;const blob=await startCapture('line');const ab=await decode(blob);const x=mono(ab);const[s,e2]=trimEdges(x,ab.sampleRate,0,ab.duration);S4.clip=slice(ab,s,e2);playBuf(S4.clip)}
  else if(L==='stop'){stopCapture();return}else if(L==='play'){S4.clip&&playBuf(S4.clip);return}
  else if(L==='cur'){try{previewLine(cur.l)}catch(err){}return}
  else if(L==='save'){await saveClip(cur.l,S4.clip);D.toast('ذخیره شد ✓');S4.clip=null;const nx=list.findIndex((x,i)=>i>S4.idx&&typeof vstat==='function'&&vstat(x.l)!=='ready');S4.idx=nx>=0?nx:Math.min(list.length-1,S4.idx+1)}}
  catch(err){D.toast(err.name==='NotAllowedError'?'اجازهٔ میکروفون داده نشد':err.message,5000);S4.rec=null}dr.render();return}
 const G=b.dataset.g;if(G){try{if(G==='rec'){const blob=await startCapture('long');D.toast('در حال تحلیل…');await buildSession(blob)}else if(G==='stop'){stopCapture();return}
  else if(G==='remap'){remap(S4.sess.clips);await persistSess()}
  else if(G==='clear'){S4.sess=null;S4.buf=null;await D.kvPut('p4:session',null)}
  else if(G==='saveall'){let n=0;for(const c of S4.sess.clips){if(c.skip||!c.line)continue;const ln=lineById(c.line);if(!ln)continue;const x=mono(S4.buf);const[s,e2]=trimEdges(x,S4.buf.sampleRate,c.s,c.e);await saveClip(ln,slice(S4.buf,s,e2));c.saved=true;n++}S4.sess.saved=true;await persistSess();D.toast(`${fa(n)} صدا در بانک صدا نصب شد ✓`,4000)}}
  catch(err){D.toast(err.name==='NotAllowedError'?'اجازه داده نشد':err.message,5000);S4.rec=null}dr.render();return}
 const A=b.dataset.cA;if(A){const cl=S4.sess.clips;const k=cl.findIndex(o=>o.id===b.closest('[data-c]').dataset.c);const c=cl[k];
  if(A==='play'){playBuf(slice(S4.buf,c.s,c.e));return}
  if(A==='skip')c.skip=!c.skip;
  if(A==='merge'&&cl[k+1]){c.e=cl[k+1].e;c.short=false;cl.splice(k+1,1)}
  if(A==='split'){const m=splitPoint(mono(S4.buf),S4.buf.sampleRate,c.s,c.e);cl.splice(k+1,0,{id:D.id(),s:m,e:c.e,short:false,line:''});c.e=m}
  if(A!=='skip'||true){remap(cl)}await persistSess();dr.render()}});
D.dockButton('vc','🎙 صدای جمنای',()=>dr.toggle());
})();
