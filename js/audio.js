/* DADASHMODE v3 · audio engine, SFX, offline voice bank, TTS providers */
'use strict';
const AE={ctx:null,
  init(){if(this.ctx)return;const c=this.ctx=new (window.AudioContext||window.webkitAudioContext)({sampleRate:48000,latencyHint:'interactive'});
    this.dest=c.createMediaStreamDestination();
    this.master=c.createGain();
    this.comp=c.createDynamicsCompressor();this.comp.threshold.value=-12;this.comp.knee.value=6;this.comp.ratio.value=3;this.comp.attack.value=.004;this.comp.release.value=.18;
    this.limiter=c.createDynamicsCompressor();this.limiter.threshold.value=-1.5;this.limiter.knee.value=0;this.limiter.ratio.value=20;this.limiter.attack.value=.001;this.limiter.release.value=.05;
    this.master.connect(this.comp);this.comp.connect(this.limiter);this.limiter.connect(c.destination);this.limiter.connect(this.dest);
    /* voice bus: presence EQ + gentle high-pass for broadcast clarity */
    this.voice=c.createGain();this.voice.gain.value=S.voiceVol;
    const hp=c.createBiquadFilter();hp.type='highpass';hp.frequency.value=85;
    const pres=c.createBiquadFilter();pres.type='peaking';pres.frequency.value=3200;pres.Q.value=.9;pres.gain.value=2.5;
    this.voice.connect(hp);hp.connect(pres);pres.connect(this.master);
    this.sfx=c.createGain();this.sfx.gain.value=S.sfxVol;this.sfx.connect(this.master);
    this.bed=c.createGain();this.bed.gain.value=0;this.bed.connect(this.master);
    this.noiseBuf=c.createBuffer(1,c.sampleRate*2,c.sampleRate);const d=this.noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;},
  async resume(){this.init();if(this.ctx.state!=='running')await this.ctx.resume()},
  play(buf,node,gain=1){const s=this.ctx.createBufferSource();s.buffer=buf;if(gain!==1){const g=this.ctx.createGain();g.gain.value=gain;s.connect(g);g.connect(node||this.voice)}else s.connect(node||this.voice);s.start();return s},
  env(g,t,a,peak,d){g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(0.0001,t+a+d)},
  noise(dur,f0,f1,peak=.8,type='bandpass',when=0){const c=this.ctx,t=c.currentTime+when,n=c.createBufferSource();n.buffer=this.noiseBuf;const f=c.createBiquadFilter();f.type=type;f.Q.value=1.2;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(f1,t+dur);const g=c.createGain();this.env(g,t,dur*.35,peak,dur*.65);n.connect(f);f.connect(g);g.connect(this.sfx);n.start(t,Math.random());n.stop(t+dur+.05)},
  tone(freq,dur,type='sine',peak=.4,when=0,slide=0){const c=this.ctx,t=c.currentTime+when,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+dur);this.env(g,t,.008,peak,dur);o.connect(g);g.connect(this.sfx);o.start(t);o.stop(t+dur+.05)},
  whoosh(){this.noise(.55,300,4200,.7)},
  boom(){this.tone(110,1.1,'sine',.9,0,38);this.noise(.5,900,120,.5,'lowpass')},
  hit(){this.tone(70,.6,'sine',.8,0,40);this.noise(.25,3000,300,.4,'lowpass')},
  ding(){this.tone(1318,.5,'triangle',.35);this.tone(1760,.6,'sine',.2,.06)},
  coin(){this.tone(988,.09,'square',.18);this.tone(1319,.35,'square',.16,.08)},
  lose(){this.tone(392,.25,'triangle',.3);this.tone(330,.25,'triangle',.3,.2);this.tone(262,.6,'triangle',.3,.4)},
  tick(){this.tone(1900,.05,'square',.18)},
  lock(){this.tone(180,.08,'square',.4);this.noise(.12,4000,1500,.5,'bandpass',.05);this.tone(90,.25,'sine',.5,.06)},
  buzzer(){this.tone(140,.7,'sawtooth',.35);this.tone(147,.7,'sawtooth',.3)},
  whistle(){const c=this.ctx,t=c.currentTime,o=c.createOscillator(),l=c.createOscillator(),lg=c.createGain(),g=c.createGain();o.type='sine';o.frequency.value=2900;l.frequency.value=38;lg.gain.value=160;l.connect(lg);lg.connect(o.frequency);this.env(g,t,.02,.35,.7);o.connect(g);g.connect(this.sfx);o.start(t);l.start(t);o.stop(t+.8);l.stop(t+.8)},
  siren(){for(let i=0;i<3;i++){this.tone(700,.28,'sawtooth',.16,i*.32,1100);this.tone(1100,.28,'sawtooth',.14,i*.32+.16,700)}},
  drumroll(d){for(let i=0;i<d*22;i++){const w=i/22;this.noiseAt(w,.06,.12+.5*(w/d))}},
  noiseAt(when,dur,peak){const c=this.ctx,t=c.currentTime+when,n=c.createBufferSource();n.buffer=this.noiseBuf;const f=c.createBiquadFilter();f.type='bandpass';f.frequency.value=1800;const g=c.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+.005);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);n.connect(f);f.connect(g);g.connect(this.sfx);n.start(t,Math.random());n.stop(t+dur+.02)},
  fanfare(){[[523,0],[659,.12],[784,.24],[1047,.36]].forEach(([f,w])=>{this.tone(f,.9,'sawtooth',.14,w);this.tone(f*1.005,.9,'square',.06,w)});this.boom()},
  sweepUp(){this.tone(220,.9,'sawtooth',.12,0,880);this.noise(.9,200,6000,.4)},
  vault(){this.tone(60,1.6,'sawtooth',.25,0,45);[0,.35,.7].forEach(w=>{this.lock&&setTimeout(()=>this.lock(),w*1000)});setTimeout(()=>this.fanfare(),1100)},
  /* tension bed: low pulse, ducked under voice. Musical but royalty-free (synthesised live) */
  bedOn(kind){if(!S.musicBed)return;this.bedOff();const c=this.ctx;const o1=c.createOscillator(),o2=c.createOscillator(),f=c.createBiquadFilter(),lfo=c.createOscillator(),lg=c.createGain();
    o1.type='sawtooth';o2.type='sawtooth';const base=kind==='play'?55:kind==='suspense'?49:65.4;o1.frequency.value=base;o2.frequency.value=base*1.502;o2.detune.value=7;
    f.type='lowpass';f.frequency.value=380;f.Q.value=6;lfo.frequency.value=kind==='play'?2:1;lg.gain.value=220;lfo.connect(lg);lg.connect(f.frequency);
    o1.connect(f);o2.connect(f);f.connect(this.bed);[o1,o2,lfo].forEach(o=>o.start());this._bed=[o1,o2,lfo];const t=c.currentTime;this.bed.gain.cancelScheduledValues(t);this.bed.gain.setValueAtTime(this.bed.gain.value,t);this.bed.gain.linearRampToValueAtTime(.07,t+1.2)},
  bedOff(){if(!this._bed)return;const t=this.ctx.currentTime;this.bed.gain.cancelScheduledValues(t);this.bed.gain.setValueAtTime(this.bed.gain.value,t);this.bed.gain.linearRampToValueAtTime(0,t+.5);const b=this._bed;this._bed=null;setTimeout(()=>b.forEach(o=>{try{o.stop()}catch(e){}}),700)},
  duck(on){if(!this._bed)return;const t=this.ctx.currentTime;this.bed.gain.cancelScheduledValues(t);this.bed.gain.setValueAtTime(this.bed.gain.value,t);this.bed.gain.linearRampToValueAtTime(on?.025:.07,t+.25)}
};
const SFX_LIST={whoosh:'ووش',boom:'بوم',hit:'ضربه',ding:'دینگ',coin:'سکه',lose:'باخت',lock:'قفل',buzzer:'بوق پایان',whistle:'سوت داور',siren:'آژیر VAR',fanfare:'فن‌فار',sweepUp:'اوج‌گیری'};

/* ---------- voice bank (hash-keyed, offline, IndexedDB) ---------- */
const AUD=new Map(),BUF=new Map();
function spk(id){return P.speakers.find(s=>s.id===id)||P.speakers[0]}
function voiceIdOf(sp){return `${sp.provider||'gemini'}:${sp.voice||''}`}
function lineKey(ln){const sp=spk(ln.speaker);return hash53(`${voiceIdOf(sp)}|${ln.emotion}|${(ln.direction||'').trim()}|${(ln.text||'').trim()}`)}
function lineRec(ln){return AUD.get(lineKey(ln))}
function vstat(ln){if(!ln.text||!ln.text.trim())return 'none';return lineRec(ln)?'ready':'none'}
const VLABEL={ready:'آفلاین آماده',none:'بدون صدا'};
async function saveAudio(ln,blob,source){const key=lineKey(ln);const rec={key,blob,text:ln.text.trim(),emotion:ln.emotion,direction:ln.direction||'',voice:voiceIdOf(spk(ln.speaker)),source,created:Date.now()};await DB.put('audio',key,rec);AUD.set(key,rec);BUF.delete(key);return rec}
async function getBuf(ln){const r=lineRec(ln);if(!r)return null;const c=BUF.get(r.key);if(c&&c.k===r.created)return c;AE.init();
  try{const b=await AE.ctx.decodeAudioData(await r.blob.arrayBuffer());const item={k:r.created,b,gain:S.normalize?normGain(b):1};BUF.set(r.key,item);return item}catch(e){console.warn('decode failed',e);return null}}
function normGain(b){/* RMS normalise every clip to ~-18 dBFS with peak guard so all lines sound equally loud */
  const d=b.getChannelData(0);let sum=0,peak=0;for(let i=0;i<d.length;i+=2){const v=d[i];sum+=v*v;const a=Math.abs(v);if(a>peak)peak=a}
  const rms=Math.sqrt(sum/(d.length/2))||1e-4;const target=Math.pow(10,-18/20);return Math.min(target/rms,.95/Math.max(peak,1e-4),6)}
function faVoices(){return (window.speechSynthesis?speechSynthesis.getVoices():[])}
function deviceSpeak(ln,onend){if(!window.speechSynthesis){onend&&onend();return}const u=new SpeechSynthesisUtterance(ln.text);const vs=faVoices();const v=vs.find(v=>v.name===S.deviceVoice)||vs.find(v=>/^fa/i.test(v.lang));if(v){u.voice=v;u.lang=v.lang}else u.lang='fa-IR';const e=EMO[ln.emotion]||EMO.warm;u.rate=e.rate;u.pitch=e.pitch;u.onend=()=>onend&&onend();u.onerror=()=>onend&&onend();speechSynthesis.cancel();speechSynthesis.speak(u)}
let previewSrc=null;
async function previewLine(ln){await AE.resume();try{previewSrc&&previewSrc.stop()}catch(e){}const b=await getBuf(ln);if(b){previewSrc=AE.play(b.b,AE.voice,b.gain);return true}if(S.devTts){deviceSpeak(ln);toast('صدای ذخیره‌شده ندارد؛ فقط برای تست با صدای دستگاه پخش شد (داخل ویدیو نمی‌رود)')}else toast('این دیالوگ هنوز صدا ندارد');return false}

/* ---------- WAV helpers ---------- */
function pcm16ToWav(bytes,rate=24000,ch=1){const len=bytes.length,buf=new ArrayBuffer(44+len),v=new DataView(buf);const w=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i))};
  w(0,'RIFF');v.setUint32(4,36+len,true);w(8,'WAVE');w(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,ch,true);v.setUint32(24,rate,true);v.setUint32(28,rate*ch*2,true);v.setUint16(32,ch*2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,len,true);new Uint8Array(buf,44).set(bytes);return new Blob([buf],{type:'audio/wav'})}
function audioBufferToWav(ab){const ch=ab.numberOfChannels,rate=ab.sampleRate,n=ab.length;const out=new Int16Array(n*ch);for(let c=0;c<ch;c++){const d=ab.getChannelData(c);for(let i=0;i<n;i++){const s=Math.max(-1,Math.min(1,d[i]));out[i*ch+c]=s<0?s*0x8000:s*0x7fff}}return pcm16ToWav(new Uint8Array(out.buffer),rate,ch)}
function b64ToBytes(b64){const bin=atob(b64);const u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u}

/* ---------- TTS providers ---------- */
function ttsPrompt(ln){const e=EMO[ln.emotion]||EMO.warm;
  return `Read the following Persian (Farsi) line aloud as a charismatic, attractive young Iranian woman hosting a top-tier TV game show. Natural fluent Tehrani Persian, never robotic. Delivery: ${e.ins}${ln.direction?` Director's note (Persian): ${ln.direction}.`:''} Speak ONLY the Persian line, nothing else:\n${ln.text.trim()}`}
async function withRetry(fn,tries=4){let last;for(let i=0;i<tries;i++){try{return await fn()}catch(e){last=e;if(!/429|500|502|503|504|fetch/i.test(e.message))throw e;await sleep(1500*Math.pow(2,i))}}throw last}
async function ttsGemini(ln,voiceName){if(!S.geminiKey)throw new Error('کلید Gemini در تنظیمات وارد نشده');
  const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${S.geminiTts}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':S.geminiKey},
    body:JSON.stringify({contents:[{parts:[{text:ttsPrompt(ln)}]}],generationConfig:{responseModalities:['AUDIO'],speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:voiceName||'Leda'}}}}})});
  if(!r.ok)throw new Error('Gemini '+r.status+': '+(await r.text()).slice(0,180));const j=await r.json();
  const part=j.candidates&&j.candidates[0]&&j.candidates[0].content&&(j.candidates[0].content.parts||[]).find(p=>p.inlineData);if(!part)throw new Error('Gemini صدایی برنگرداند');
  const mime=part.inlineData.mimeType||'';const rate=+((mime.match(/rate=(\d+)/)||[])[1]||24000);return pcm16ToWav(b64ToBytes(part.inlineData.data),rate,1)}
async function ttsOpenAI(ln,voice){if(!S.openaiKey)throw new Error('کلید OpenAI در تنظیمات وارد نشده');const e=EMO[ln.emotion]||EMO.warm;
  const body={model:S.openaiTts,voice:voice||'coral',input:ln.text.trim(),response_format:'wav'};
  if(/4o|gpt/i.test(S.openaiTts))body.instructions=`Speak ONLY in fluent, natural Persian (Farsi) with a Tehrani accent. You are a charismatic young female TV game-show host. Delivery: ${e.ins}${ln.direction?' Director note (Persian): '+ln.direction:''}`;
  const r=await fetch(S.openaiBase.replace(/\/$/,'')+'/audio/speech',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+S.openaiKey},body:JSON.stringify(body)});
  if(!r.ok)throw new Error('OpenAI '+r.status+': '+(await r.text()).slice(0,180));return r.blob()}
/* Emergency on-device neural engine (Piper via WASM). Downloads once, then works with no internet. Persian Piper voices are male. */
const Piper={mod:null,async load(){if(this.mod)return this.mod;this.mod=await import('https://cdn.jsdelivr.net/npm/@mintplex-labs/piper-tts-web@1.0.5/+esm');return this.mod},
  async voices(){const m=await this.load();const v=await m.voices();return Object.keys(v).filter(k=>/^fa_/i.test(k))},
  async install(id,onp){const m=await this.load();await m.download(id,p=>onp&&p.total&&onp(p.loaded/p.total))},
  async stored(){try{const m=await this.load();return await m.stored()}catch(e){return []}},
  async speak(text,id){const m=await this.load();return m.predict({text,voiceId:id})}};
async function synthLine(ln){const sp=spk(ln.speaker);const prov=sp.provider||'gemini';let blob;
  if(prov==='gemini')blob=await withRetry(()=>ttsGemini(ln,sp.voice));
  else if(prov==='openai')blob=await withRetry(()=>ttsOpenAI(ln,sp.voice));
  else if(prov==='piper')blob=await Piper.speak(ln.text.trim(),sp.voice);
  else throw new Error('این گوینده با میکروفون/فایل پر می‌شود، نه ساخت خودکار');
  return saveAudio(ln,blob,prov)}

/* ---------- installed voice pack (voices/index.json next to the app) ---------- */
async function loadInstalledPack(){try{const r=await fetch('voices/index.json',{cache:'no-cache'});if(!r.ok)return 0;const j=await r.json();let n=0;
  for(const[key,it]of Object.entries(j.items||{})){if(AUD.has(key))continue;try{const fr=await fetch('voices/'+it.file);if(!fr.ok)continue;const rec={key,blob:await fr.blob(),text:it.text||'',emotion:it.emotion||'',direction:it.direction||'',voice:it.voice||'',source:'pack',created:it.created||Date.now()};await DB.put('audio',key,rec);AUD.set(key,rec);n++}catch(e){}}
  return n}catch(e){return 0}}
