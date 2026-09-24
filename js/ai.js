/* DADASHMODE v3 · AI (Gemini / OpenAI-compatible) + offline script parser */
'use strict';
function aiReady(){return S.aiProvider==='gemini'?!!S.geminiKey:!!S.openaiKey}
async function aiJSON(system,user){
  if(S.aiProvider==='gemini'){if(!S.geminiKey)throw new Error('کلید Gemini در تنظیمات وارد نشده');
    const r=await withRetry(async()=>{const x=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${S.geminiChat}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':S.geminiKey},
      body:JSON.stringify({systemInstruction:{parts:[{text:system}]},contents:[{role:'user',parts:[{text:user}]}],generationConfig:{responseMimeType:'application/json',temperature:.7}})});if(!x.ok)throw new Error('Gemini '+x.status+': '+(await x.text()).slice(0,200));return x});
    const j=await r.json();const txt=(j.candidates[0].content.parts||[]).map(p=>p.text||'').join('');return JSON.parse(txt.replace(/^```json|```$/g,''))}
  if(!S.openaiKey)throw new Error('کلید OpenAI در تنظیمات وارد نشده');
  const r=await withRetry(async()=>{const x=await fetch(S.openaiBase.replace(/\/$/,'')+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+S.openaiKey},
    body:JSON.stringify({model:S.openaiChat,temperature:.7,response_format:{type:'json_object'},messages:[{role:'system',content:system},{role:'user',content:user}]})});if(!x.ok)throw new Error('OpenAI '+x.status+': '+(await x.text()).slice(0,200));return x});
  const j=await r.json();return JSON.parse(j.choices[0].message.content)}
const EMO_KEYS=Object.keys(EMO).join(', ');
const SEG_SCHEMA=`Return ONLY JSON: {"episode":{"name":string,"unit":string (e.g. "ثانیه" or "امتیاز"),"startBank":number,"players":[{"name":string,"color":hex,"symbol":string}]},"brief":{"summary":string,"tone":string,"characters":[string],"beats":[string],"directorNotes":[string]},"segments":[{"type":one of [title,intro,rules,countdown,play,bank,dialogue,winner,card],"game":one of [generic,cup,distance,mystery,mitts,powers,vault],"title":string,"subtitle":string,"duration":seconds (play only),"reward":number (play only),"rules":[string] (rules only, max 9 words each),"notes":string (director notes, camera, props, SFX),"lines":[{"speaker":string,"emotion":one of [${EMO_KEYS}],"direction":string (short Persian acting note),"text":string}]}]}`;
const AI_SYS=`You are the head writer AND director of a top-tier Persian YouTube challenge show in the style of MrBeast (DADASHMODE). You read full screenplays, director's books, run-of-show documents and dialogue, understand them completely, and convert them into a precise run-of-show for a live broadcast graphics engine.
Rules:
- All output text in Persian. Spoken lines are natural spoken Persian (colloquial Tehrani), short (max ~16 words each) so a subtitle fits in 2 lines. Split longer speeches into several lines.
- Each line gets the emotion that fits THAT exact moment (hype, suspense before reveals, calm for rules, strict for referee calls, celebration for wins).
- For every game/challenge produce: an "intro" segment (full-screen reveal, 1-3 hype lines), a "rules" segment (short rules list; lines = one opener + exactly one line per rule in the same order), optionally "countdown", then a "play" segment with duration and reward. Pick the closest "game" visual key; use generic if none fits.
- Keep every scene, dialogue and director instruction from the source. Put camera/props/SFX notes in "notes". Never invent plot, prizes or results.
- If the script says who wins, do NOT decide results; results are entered live by the director.
${SEG_SCHEMA}`;
const PLAYER_COLS=['#ff2738','#00c98d','#3da5ff','#ffd23f','#c77dff','#ff8a3d'];
function speakerFor(name){if(!name)return P.speakers[0].id;name=String(name).trim().replace(/[:：]$/,'');let s=P.speakers.find(x=>x.name===name||x.name.startsWith(name)||name.startsWith(x.name.split(' ')[0]));
  if(!s){const hostish=/مجری|داور|گوینده|راوی|host|narrat/i.test(name);if(hostish)return P.speakers[0].id;s={id:uid(),name,provider:P.speakers[0].provider,voice:'Zephyr'};P.speakers.push(s)}return s.id}
function findEmo(t){if(!t)return 'warm';t=t.trim();for(const[k,v]of Object.entries(EMO)){if(t===k||v.fa===t||v.fa.includes(t)||t.includes(v.fa.split(' ')[0]))return k}
  if(/هیجان|پرانرژی/.test(t))return 'excited';if(/آرام|توضیح/.test(t))return 'calm';if(/جدی|قاطع/.test(t))return 'serious';if(/تعلیق|مرموز/.test(t))return 'suspense';if(/شاد|جشن|تبریک/.test(t))return 'celebrate';if(/شوخ|بامزه/.test(t))return 'playful';return 'warm'}
function guessGame(s){const t=(s||'');for(const[k,v]of Object.entries(GAME_ALIAS))if(t.includes(k))return v;return 'generic'}
function applyEpisodeMeta(ep){if(!ep)return;if(ep.name)P.name=ep.name;if(ep.unit)P.unit=ep.unit;if(Number.isFinite(+ep.startBank)&&+ep.startBank>=0)P.startBank=+ep.startBank;
  if(Array.isArray(ep.players)&&ep.players.length>=1){P.players=ep.players.slice(0,6).map((p,i)=>({id:(P.players[i]&&P.players[i].id)||uid(),name:p.name||('بازیکن '+fa(i+1)),color:/^#[0-9a-f]{6}$/i.test(p.color||'')&&p.color.toLowerCase()!=='#ff00ff'?p.color:PLAYER_COLS[i],symbol:p.symbol||['▲','●','■','◆','★','✚'][i],key:['a','l','s','k','d','j'][i]}))}}
function applySegments(segs,append){const out=segs.map(s=>{const type=TYPES[s.type]?s.type:'card';const game=GAMES[s.game]?s.game:guessGame(s.title);
  return mkSeg({type,game,title:s.title||'',subtitle:s.subtitle||'',duration:+s.duration||30,reward:Number.isFinite(+s.reward)?+s.reward:10,rules:Array.isArray(s.rules)?s.rules.filter(Boolean):[],notes:s.notes||'',status:'draft',
    lines:(s.lines||[]).filter(l=>l&&l.text).map(l=>({id:uid(),speaker:speakerFor(l.speaker),emotion:EMO[l.emotion]?l.emotion:findEmo(l.emotion),direction:l.direction||'',text:String(l.text).trim()}))})});
  if(append)P.segments.push(...out);else{stopAll();P.segments=out;st.sel=0}save();renderControl();return out.length}
/* Offline, no-AI parser for the standard script format (see docs/SCRIPT-FORMAT.md) */
function parseOffline(text){const segs=[];let cur=null;const meta={};
  for(const raw of text.split(/\r?\n/)){const ln=raw.trim();if(!ln||ln.startsWith('//'))continue;
    let m=ln.match(/^(نام قسمت|واحد|بانک اولیه|بازیکن)\s*[:：]\s*(.+)$/);
    if(m&&!cur){const[,k,v]=m;if(k==='نام قسمت')meta.name=v;else if(k==='واحد')meta.unit=v;else if(k==='بانک اولیه')meta.startBank=+enNum(v);else{(meta.players=meta.players||[]).push({name:v.split(/[,،]/)[0].trim(),color:(v.match(/#[0-9a-f]{6}/i)||[])[0]})}continue}
    m=ln.match(/^#{1,3}\s*(?:\[([^\]]+)\])?\s*(?:\{([^}]+)\})?\s*(.*)$/);
    if(m){const tk=(m[1]||'').trim(),gk=(m[2]||'').trim();cur={type:TYPE_ALIAS[tk]||(TYPES[tk]?tk:'card'),game:GAME_ALIAS[gk]||(GAMES[gk]?gk:guessGame(m[3])),title:m[3].trim(),subtitle:'',rules:[],lines:[],notes:'',duration:30,reward:10};segs.push(cur);continue}
    if(!cur){cur={type:'dialogue',game:'generic',title:'',subtitle:'',rules:[],lines:[],notes:''};segs.push(cur)}
    m=ln.match(/^(زیرعنوان|قانون|زمان|جایزه|یادداشت|بازی)\s*[:：]\s*(.*)$/);
    if(m){const[,k,v]=m;if(k==='زیرعنوان')cur.subtitle=v;else if(k==='قانون')cur.rules.push(v);else if(k==='زمان')cur.duration=+enNum(v).replace(/\D/g,'')||30;else if(k==='جایزه')cur.reward=+enNum(v).replace(/[^\d-]/g,'')||0;else if(k==='بازی')cur.game=GAME_ALIAS[v]||(GAMES[v]?v:guessGame(v));else cur.notes+=(cur.notes?'\n':'')+v;continue}
    m=ln.match(/^([^:：()«»]{1,30})\s*(?:\(([^)]*)\))?\s*[:：]\s*(.+)$/);
    if(m){cur.lines.push({speaker:m[1].trim(),emotion:findEmo(m[2]),text:m[3].trim()});continue}
    cur.lines.push({speaker:'',emotion:'warm',text:ln})}
  return {meta,segs}}
/* Director's assistant: answers disputes / rule questions using the whole episode context */
async function askDirector(q){const ctx={episode:P.name,unit:P.unit,brief:P.brief,current:P.segments[st.live>=0?st.live:st.sel],banks:P.players.map(p=>({name:p.name,bank:bankOf(p.id)})),var:G().var,recentJournal:G().journal.slice(-12)};
  return aiJSON(`You are the head referee & director's assistant of the Persian game show DADASHMODE. Answer in short, clear Persian. Never change scores yourself; suggest actions for the human director. If the evidence is unclear, recommend a VAR review. Return JSON {"answer":string,"sayLine":string (optional short line the host can say on camera, spoken Persian),"emotion":one of [${EMO_KEYS}],"suggestedAction":string}`,`Context: ${JSON.stringify(ctx)}\n\nDirector question: ${q}`)}
