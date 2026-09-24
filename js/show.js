/* DADASHMODE v3 · show runtime: cueing, voice playback, timers, recording (+SRT), logo cutout */
'use strict';
const st={mode:'rehearsal',sel:0,live:-1,playing:false,vt:0,segT0:0,line:null,lineK:-1,lineT0:0,lineDur:1,token:0,queue:[],ruleT:{},ruleStep:null,
  timer:{total:30,remain:30,running:false,lastSec:99},disp:{},pops:[],fx:[],src:null,rec:null,recT0:0,recSub:[],mic:null,fonts:false,hold:null,wake:null};
function at(delay,fn){st.queue.push({t:st.vt+delay,fn,tok:st.token})}
function stopVoice(){try{st.src&&st.src.stop()}catch(e){}st.src=null;if(window.speechSynthesis)speechSynthesis.cancel()}
function stopAll(){st.token++;stopVoice();st.live=-1;st.playing=false;st.line=null;st.queue=[];st.timer.running=false;AE.ctx&&AE.bedOff();renderTransport();renderROS();renderGameDeck()}
async function goLive(i){const seg=P.segments[i];if(!seg)return;await AE.resume();stopVoice();st.token++;const tok=st.token;
  st.queue=[];st.live=i;st.sel=i;st.segT0=st.vt;st.lineK=-1;st.line=null;st.ruleT={};st.ruleStep=null;st.playing=true;
  if(seg.type==='play'){st.timer={total:seg.duration||30,remain:seg.duration||30,running:true,lastSec:99};if(seg.game==='mystery'&&!G().mystery.dist)mysteryNew();if(seg.game==='vault'&&!G().vault.codes.length)vaultNew()}
  seg.lines.forEach(l=>getBuf(l));
  const fx={title:()=>{AE.boom();AE.whoosh()},intro:()=>{AE.whoosh();setTimeout(()=>AE.boom(),420);setTimeout(()=>AE.hit(),1150)},rules:()=>AE.whoosh(),dialogue:()=>AE.whoosh(),card:()=>AE.whoosh(),bank:()=>{AE.whoosh();setTimeout(()=>AE.sweepUp(),400)},play:()=>AE.whistle(),countdown:()=>{},winner:()=>AE.drumroll(2.7)}[seg.type];fx&&fx();
  AE.bedOff();if(seg.type==='play')AE.bedOn('play');else if(seg.type==='rules'||seg.type==='intro')AE.bedOn('suspense');
  if(seg.type==='countdown'){[.3,1.3,2.3].forEach(d=>at(d,()=>AE.tick()));at(3.3,()=>{AE.boom();AE.sweepUp()})}
  if(seg.type==='winner')at(2.8,()=>AE.fanfare());
  const lead={title:1.6,intro:1.6,rules:1.1,countdown:4.4,play:.6,winner:.2,dialogue:.5,card:.7,bank:1.2}[seg.type]||.6;
  at(lead,()=>nextLine(tok));renderROS();renderInspector();renderTransport();renderGameDeck()}
function nextLine(tok){if(tok!==st.token)return;const seg=P.segments[st.live];if(!seg)return;st.lineK++;markSpeaking();
  /* play segments: dialogue is cued manually from the game deck, not auto-run */
  if(seg.type==='play'){st.line=null;markSpeaking();return}
  if(st.lineK>=seg.lines.length){st.line=null;markSpeaking();if(st.rec&&st.stopAt!=null&&st.live>=st.stopAt){at(2.2,()=>{if(tok===st.token)stopRecording()});return}if(P.autoAdvance)at(seg.type==='winner'?5:seg.type==='countdown'?.3:2.4,()=>{const nx=P.segments[st.live+1];if(tok===st.token&&nx&&(nx.type!=='play'||seg.type==='countdown'))goLive(st.live+1)});return}
  speakLine(seg.lines[st.lineK],tok,()=>at(.35,()=>nextLine(tok)))}
async function speakLine(ln,tok,after){const b=await getBuf(ln);if(tok!==st.token)return;st.line=ln;st.lineT0=st.vt;markSpeaking();AE.duck(true);
  const subStart=st.rec?(performance.now()-st.recT0)/1000:null;
  const done=()=>{if(tok!==st.token)return;AE.duck(false);if(subStart!==null&&st.rec)st.recSub.push({s:subStart,e:(performance.now()-st.recT0)/1000,text:ln.text});after&&after()};
  if(b){st.lineDur=b.b.duration;const s=AE.play(b.b,AE.voice,b.gain);st.src=s;s.onended=done}
  else{const est=Math.max(1.8,ln.text.length*.075);st.lineDur=est;
    if(S.devTts&&st.mode==='rehearsal'&&window.speechSynthesis&&ln.text){let fin=false;const f=()=>{if(fin)return;fin=true;done()};deviceSpeak(ln,f);at(est*2.2,f)}
    else at(est,done)}}
/* manual cue of any line (used in play segments & from inspector) */
async function cueLine(ln){await AE.resume();if(st.live<0){toast('اول یک مرحله را اجرا کنید');return previewLine(ln)}stopVoice();speakLine(ln,st.token,()=>{st.line=null;markSpeaking()})}
function togglePlay(){if(st.live<0){goLive(st.sel);return}st.playing=!st.playing;if(AE.ctx){st.playing?AE.ctx.resume():AE.ctx.suspend()}if(window.speechSynthesis){st.playing?speechSynthesis.resume():speechSynthesis.pause()}renderTransport()}
function markSpeaking(){$$('#insp .line').forEach(el=>el.classList.toggle('speaking',!!st.line&&el.dataset.id===st.line.id));renderNow()}
function startHold(sec=2){st.hold={t0:performance.now()/1000,dur:sec};AE.ctx&&AE.tick();const iv=setInterval(()=>{if(!st.hold){clearInterval(iv);return}const a=(performance.now()/1000-st.hold.t0);if(a>=sec){clearInterval(iv);AE.ctx&&AE.ding()}else AE.ctx&&AE.tick()},1000)}

let lastT=performance.now();
function frame(now){const dt=Math.min(.1,(now-lastT)/1000);lastT=now;
  if(st.playing){st.vt+=dt;const due=st.queue.filter(q=>q.t<=st.vt);st.queue=st.queue.filter(q=>q.t>st.vt);due.forEach(q=>{if(q.tok===st.token)q.fn()});
    const seg=P.segments[st.live];if(seg&&seg.type==='play'&&st.timer.running){st.timer.remain=Math.max(0,st.timer.remain-dt);const sec=Math.ceil(st.timer.remain);if(sec!==st.timer.lastSec){st.timer.lastSec=sec;if(sec<=5&&sec>0&&AE.ctx)AE.tick()}if(st.timer.remain<=0){st.timer.running=false;AE.ctx&&AE.buzzer()}}}
  P.players.forEach(p=>{const target=bankOf(p.id);const d=st.disp[p.id]??target;st.disp[p.id]=Math.abs(target-d)<.05?target:d+(target-d)*Math.min(1,dt*6)});st.pops=st.pops.filter(q=>now/1000-q.t<1.4);
  try{draw()}catch(e){console.error(e)}renderTally();requestAnimationFrame(frame)}

/* ---------- recording ---------- */
function pickMime(){if(!window.MediaRecorder)return '';return ['video/mp4;codecs=avc1.640033,mp4a.40.2','video/mp4;codecs=avc1.4d002a,mp4a.40.2','video/mp4;codecs=avc1,mp4a.40.2','video/mp4','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'].find(m=>MediaRecorder.isTypeSupported(m))||''}
async function wakeOn(){if(!S.wake||!navigator.wakeLock)return;try{st.wake=await navigator.wakeLock.request('screen')}catch(e){}}
function wakeOff(){try{st.wake&&st.wake.release()}catch(e){}st.wake=null}
async function startRecording(force,onlyRange){if(onlyRange)st.pendingRange=onlyRange;else if(force)onlyRange=st.pendingRange;else st.pendingRange=null;const miss=allLines().filter(x=>vstat(x.l)!=='ready').length;
  if(miss&&!force){$('#recWarn').innerHTML=`<div class="banner"><b>${fa(miss)} دیالوگ صدای آماده ندارد.</b><span>این خط‌ها فقط زیرنویس خواهند داشت و صدایی داخل ویدیو نمی‌رود.</span><div class="row"><button class="btn sm" data-go="voice">رفتن به بانک صدا</button><button class="btn sm pri" id="recFill">ساخت خودکار صداهای ناقص و بعد ضبط</button><button class="btn sm" id="recAnyway">ضبط بدون آن‌ها</button></div></div>`;return}
  $('#recWarn').innerHTML='';const mime=pickMime();if(!mime){toast('این مرورگر ضبط ویدیو را پشتیبانی نمی‌کند. کروم یا اج را امتحان کنید.');return}
  await AE.resume();stopAll();const co=$('#countover');co.classList.remove('hidden');for(const n of ['۳','۲','۱']){co.textContent=n;await sleep(800)}co.classList.add('hidden');
  const stream=new MediaStream([...cv.captureStream(+S.fps).getVideoTracks(),...AE.dest.stream.getAudioTracks()]);const q=QUAL[S.quality];
  const rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:Math.round(q.br*(S.fps==60?1.3:1)),audioBitsPerSecond:320000});const chunks=[];rec.ondataavailable=e=>e.data.size&&chunks.push(e.data);
  st.recSub=[];st.recLabel=onlyRange?onlyRange.label:'';
  rec.onstop=async()=>{wakeOff();const blob=new Blob(chunks,{type:mime.split(';')[0]});const ext=mime.includes('mp4')?'mp4':'webm';const id=uid();const stamp=new Date().toLocaleString('fa-IR').replace(/[\/:,،]/g,'-');
    const name=safeName(`${P.name}${st.recLabel?' - '+st.recLabel:''} - ${stamp}`)+'.'+ext;const srt=st.recSub.map((c,i)=>`${i+1}\n${srtTime(c.s)} --> ${srtTime(c.e)}\n${c.text}\n`).join('\n');
    const dur=(performance.now()-st.recT0)/1000;await DB.put('takes',id,{id,name,blob,srt,size:blob.size,mime,dur,date:Date.now(),project:P.name,res:S.quality,fps:S.fps});
    toast('ضبط ذخیره شد · '+fmtSize(blob.size));if(S.autoDl){download(blob,name);if(srt)download(new Blob([srt],{type:'text/plain'}),name.replace(/\.\w+$/,'.srt'))}await saveToFolder(blob,name,srt);st.rec=null;st.stopAt=null;renderRecBtn();renderTakes()};
  st.pendingRange=null;rec.start(1000);st.rec=rec;st.recT0=performance.now();st.stopAt=onlyRange?onlyRange.end:null;wakeOn();renderRecBtn();goLive(onlyRange?onlyRange.start:st.sel)}
function stopRecording(){if(st.rec&&st.rec.state!=='inactive'){st.rec.stop();stopAll()}}
/* cloud / folder: File System Access (e.g. Google Drive for desktop synced folder) */
async function pickFolder(){if(!window.showDirectoryPicker){toast('این مرورگر انتخاب پوشه ندارد؛ از دانلود/اشتراک استفاده کنید');return}try{const h=await showDirectoryPicker({mode:'readwrite'});await DB.put('kv','folder',h);toast('پوشهٔ ذخیره تنظیم شد: '+h.name);renderSettings()}catch(e){}}
async function saveToFolder(blob,name,srt){try{const h=await DB.get('kv','folder');if(!h)return;if((await h.queryPermission({mode:'readwrite'}))!=='granted'&&(await h.requestPermission({mode:'readwrite'}))!=='granted')return;
  const f=await h.getFileHandle(name,{create:true});const w=await f.createWritable();await w.write(blob);await w.close();if(srt){const f2=await h.getFileHandle(name.replace(/\.\w+$/,'.srt'),{create:true});const w2=await f2.createWritable();await w2.write(srt);await w2.close()}toast('در پوشهٔ ابری/محلی هم ذخیره شد')}catch(e){console.warn(e)}}

/* ---------- logo background removal (edge flood-fill or global key, soft matte, auto-trim) ---------- */
function loadImg(src){return new Promise((r,j)=>{const im=new Image();im.onload=()=>r(im);im.onerror=j;im.src=src})}
async function cutLogo(src,tol,global){const im=await loadImg(src);const k=Math.min(1,1600/Math.max(im.width,im.height));const w=Math.round(im.width*k),h=Math.round(im.height*k);const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(im,0,0,w,h);const d=x.getImageData(0,0,w,h),p=d.data;
  const samp=[];const S2=Math.max(3,Math.round(Math.min(w,h)*.02));[[0,0],[w-S2,0],[0,h-S2],[w-S2,h-S2]].forEach(([sx,sy])=>{for(let yy=sy;yy<sy+S2;yy++)for(let xx=sx;xx<sx+S2;xx++){const i=(yy*w+xx)*4;samp.push([p[i],p[i+1],p[i+2],p[i+3]])}});
  const transparentAlready=samp.filter(s=>s[3]<20).length>samp.length*.6;
  if(!transparentAlready){const avg=[0,1,2].map(j=>samp.reduce((a,s)=>a+s[j],0)/samp.length);const dist=i=>Math.hypot(p[i]-avg[0],p[i+1]-avg[1],p[i+2]-avg[2]);
    if(global){for(let i=0;i<p.length;i+=4){const dd=dist(i);if(dd<tol)p[i+3]=0;else if(dd<tol*1.5)p[i+3]=Math.round(p[i+3]*(dd-tol)/(tol*.5))}}
    else{const seen=new Uint8Array(w*h);const stack=[];for(let xx=0;xx<w;xx++){stack.push(xx,(h-1)*w+xx)}for(let yy=0;yy<h;yy++){stack.push(yy*w,yy*w+w-1)}
      while(stack.length){const q=stack.pop();if(seen[q])continue;seen[q]=1;const i=q*4;const dd=dist(i);if(dd>=tol*1.5)continue;if(dd<tol)p[i+3]=0;else{p[i+3]=Math.round(p[i+3]*(dd-tol)/(tol*.5));continue}const qx=q%w;if(qx>0)stack.push(q-1);if(qx<w-1)stack.push(q+1);if(q>=w)stack.push(q-w);if(q<w*(h-1))stack.push(q+w)}}
    /* de-fringe: pull edge colours away from the background colour */
    for(let i=0;i<p.length;i+=4){const a=p[i+3]/255;if(a>0&&a<1){for(let j=0;j<3;j++)p[i+j]=cl(Math.round((p[i+j]-avg[j]*(1-a))/Math.max(a,.2)),0,255)}}
    x.putImageData(d,0,0)}
  let minX=w,minY=h,maxX=0,maxY=0;for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){if(p[(yy*w+xx)*4+3]>12){if(xx<minX)minX=xx;if(xx>maxX)maxX=xx;if(yy<minY)minY=yy;if(yy>maxY)maxY=yy}}
  if(maxX<=minX)return c.toDataURL('image/png');const o=document.createElement('canvas');o.width=maxX-minX+1;o.height=maxY-minY+1;o.getContext('2d').drawImage(c,minX,minY,o.width,o.height,0,0,o.width,o.height);return o.toDataURL('image/png')}
/* dominant colours of the logo → suggested theme */
async function logoPalette(src){const im=await loadImg(src);const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');x.drawImage(im,0,0,64,64);const p=x.getImageData(0,0,64,64).data;const bins={};
  for(let i=0;i<p.length;i+=4){if(p[i+3]<128)continue;const r=p[i],gg=p[i+1],b=p[i+2];const mx=Math.max(r,gg,b),mn=Math.min(r,gg,b);if(mx-mn<40||mx<60)continue;const k=(r>>5)+'-'+(gg>>5)+'-'+(b>>5);(bins[k]=bins[k]||{n:0,r:0,g:0,b:0}).n++;bins[k].r+=r;bins[k].g+=gg;bins[k].b+=b}
  return Object.values(bins).sort((a,b)=>b.n-a.n).slice(0,3).map(v=>'#'+[v.r/v.n,v.g/v.n,v.b/v.n].map(z=>Math.round(z).toString(16).padStart(2,'0')).join(''))}
