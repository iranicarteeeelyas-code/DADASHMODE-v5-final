/* DADASHMODE v4 · voice system upgrade
   - Microsoft Dilara (fa-IR female neural, NO API key) through the local server
   - automatic fallback chain so a line is never left silent: speaker engine → Gemini → Dilara → OpenAI (→ Piper only if allowed)
   - pronunciation lexicon (اِعراب / خوانش قفل‌شده) applied to TTS text only, never to subtitles
   - every generated voice is also written as a real file into ./voices when running on the local server */
'use strict';
const SRV={server:false,edge:false,gemini:false,voicesWritable:false,checked:false};
async function checkServer(){try{const r=await fetch('/api/config',{cache:'no-store'});if(r.ok&&/json/.test(r.headers.get('content-type')||'')){const j=await r.json();if(j&&j.server)Object.assign(SRV,{server:true,edge:!!j.edge,gemini:!!j.gemini,voicesWritable:!!j.voicesWritable})}}catch(e){}SRV.checked=true;return SRV}
const srvReady=checkServer();
const EDGE_VOICES=[['fa-IR-DilaraNeural','دلارا · زن'],['fa-IR-FaridNeural','فرید · مرد']];
const PROVIDERS={gemini:'Gemini · زن با لحن کامل (کلید)',edge:'مایکروسافت دلارا · زن، بدون کلید',openai:'OpenAI (کلید)',piper:'موتور اضطراری روی دستگاه (مردانه)',manual:'فقط صدای ضبط‌شده / فایل'};
const DEF_VOICE={gemini:'Leda',openai:'coral',edge:'fa-IR-DilaraNeural'};
const DEF_LEXICON='الیاس = اِلیاس\nعماد = عِماد\nداداش‌مود = داداش‌مُود\nداداش مود = داداش‌مُود\nجمنای = جِمِنای\nتروث کم = تروث‌کَم\nجعبه طلایی = جَعبهٔ طَلایی\nکیف طلایی = کیفِ طَلایی\nبرنده = بَرَنده';

/* ---------- pronunciation lexicon ---------- */
function lexiconPairs(){const src=(P&&P.lexicon!=null)?P.lexicon:DEF_LEXICON;return src.split(/\r?\n/).map(l=>l.split(/\s*=\s*/)).filter(x=>x.length===2&&x[0].trim()&&x[1].trim()).map(([a,b])=>[a.trim(),b.trim()])}
const reEsc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function ttsText(ln){let t=(ln.text||'').trim();for(const[a,b]of lexiconPairs()){t=t.replace(new RegExp(`(^|[^\\p{L}\\u064B-\\u0652])${reEsc(a)}(?=$|[^\\p{L}\\u064B-\\u0652])`,'gu'),(m,pre)=>pre+b)}return t}
ttsPrompt=function(ln){const e=EMO[ln.emotion]||EMO.warm;
  return `Read the following Persian (Farsi) line aloud as a charismatic, attractive young Iranian woman hosting a top-tier TV game show. Natural fluent Tehrani Persian, never robotic, never translated. Respect every diacritic (اِعراب) exactly as written; they mark the correct pronunciation. Delivery: ${e.ins}${ln.direction?` Director's note (Persian): ${ln.direction}.`:''} Speak ONLY the Persian line, nothing else:\n${ttsText(ln)}`};

/* ---------- Microsoft Dilara (via local server) ---------- */
async function ttsEdge(ln,voice){await srvReady;if(!SRV.edge)throw new Error('دلارا فقط وقتی کار می‌کند که اپ با start-windows.bat یا npm start باز شده باشد');
  const r=await fetch('/api/tts/edge',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:ttsText(ln),voice:voice||DEF_VOICE.edge,emotion:ln.emotion})});
  if(!r.ok){let m='';try{m=(await r.json()).error}catch(e){}throw new Error('دلارا: '+(m||r.status))}return r.blob()}
/* OpenAI with lexicon */
const _ttsOpenAI=ttsOpenAI;ttsOpenAI=function(ln,voice){return _ttsOpenAI(Object.assign({},ln,{text:ttsText(ln)}),voice)};

/* ---------- engine availability + fallback chain ---------- */
function providerUsable(p){if(p==='gemini')return !!S.geminiKey||SRV.gemini;if(p==='openai')return !!S.openaiKey;if(p==='edge')return SRV.edge;if(p==='piper')return !!S.piperVoice;return false}
function engineReport(){return ['gemini','edge','openai','piper'].map(p=>({p,ok:providerUsable(p)}))}
async function synthVia(p,ln,voice){if(p==='gemini')return withRetry(()=>ttsGemini(ln,voice||DEF_VOICE.gemini));if(p==='openai')return withRetry(()=>ttsOpenAI(ln,voice||DEF_VOICE.openai));
  if(p==='edge')return withRetry(()=>ttsEdge(ln,voice||DEF_VOICE.edge),2);if(p==='piper')return Piper.speak(ttsText(ln),voice||S.piperVoice);throw new Error('موتور نامعتبر')}
synthLine=async function(ln){await srvReady;const sp=spk(ln.speaker);const first=sp.provider||'gemini';
  if(first==='manual')throw new Error('این گوینده با میکروفون/فایل پر می‌شود');
  const chain=[first];if(S.fallback!==false)['gemini','edge','openai'].forEach(p=>{if(p!==first)chain.push(p)});if(S.allowMale&&first!=='piper')chain.push('piper');
  const errs=[];for(const p of chain){if(p!==first&&!providerUsable(p))continue;
    try{const voice=p===first?sp.voice:(p==='gemini'?(S.fbGemini||'Leda'):DEF_VOICE[p]);const blob=await synthVia(p,ln,voice);const rec=await saveAudio(ln,blob,p);if(p!==first)toast(`«${ln.text.slice(0,24)}…» با موتور جایگزین (${PROVIDERS[p].split(' ·')[0]}) ساخته شد`,3200);return rec}
    catch(e){errs.push(`${PROVIDERS[p].split(' ·')[0]}: ${e.message}`);console.warn(p,e)}}
  throw new Error(errs.join(' | ')||'هیچ موتور صدایی در دسترس نیست. تنظیمات و API را ببینید')};

/* ---------- physically install voices into ./voices on the local server ---------- */
function blobToB64(b){return new Promise(r=>{const f=new FileReader();f.onload=()=>r(String(f.result).split(',')[1]||'');f.readAsDataURL(b)})}
const extOf=t=>/mpeg|mp3/.test(t)?'mp3':/webm/.test(t)?'webm':/ogg/.test(t)?'ogg':'wav';
async function pushVoiceToServer(rec){await srvReady;if(!SRV.voicesWritable||!rec||!rec.blob)return false;try{const r=await fetch('/api/voices/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:rec.key,ext:extOf(rec.blob.type),data:await blobToB64(rec.blob),text:rec.text,emotion:rec.emotion,direction:rec.direction,voice:rec.voice,source:rec.source})});return r.ok}catch(e){return false}}
const _saveAudio=saveAudio;saveAudio=async function(ln,blob,source){const rec=await _saveAudio(ln,blob,source);pushVoiceToServer(rec);return rec};
async function installAllToFolder(){await srvReady;if(!SRV.voicesWritable){toast('این کار فقط وقتی اپ با start-windows.bat باز شده ممکن است');return 0}let n=0;const seen=new Set();for(const x of allLines()){const r=lineRec(x.l);if(r&&!seen.has(r.key)){seen.add(r.key);if(await pushVoiceToServer(r))n++}}return n}

/* ---------- missing-voice auto fill (used before recording) ---------- */
async function fillMissingVoices(onProgress){const todo=allLines().filter(x=>vstat(x.l)!=='ready'&&x.l.text.trim()&&spk(x.l.speaker).provider!=='manual');let ok=0,fail=0,last='';
  for(let i=0;i<todo.length;i++){onProgress&&onProgress(i,todo.length);try{await synthLine(todo[i].l);ok++}catch(e){fail++;last=e.message;if(fail>=3&&ok===0)break}await sleep(250)}return {ok,fail,last,total:todo.length}}
