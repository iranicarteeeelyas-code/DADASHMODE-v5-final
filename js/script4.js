/* DADASHMODE v4 · script understanding upgrade
   - several sources at once (PDF director's book + .md chat + .txt + manual notes), ordered OLDEST → NEWEST; newest wins on conflict
   - PDF goes to Gemini natively (reads tables/storyboards); text is also extracted with pdf.js for OpenAI / offline parser
   - AI returns: episode, brief (+ conflicts, missing info, pronunciation lexicon), segments with per-game VISUAL BLUEPRINT and THEME
   - robust JSON (repairs truncated answers), 65k output tokens, redesign into a NEW episode so nothing is single-use */
'use strict';
function parseLooseJSON(t){t=String(t||'').trim().replace(/^```(?:json)?\s*/i,'').replace(/```\s*$/,'').trim();try{return JSON.parse(t)}catch(e){}
  const a=t.indexOf('{');if(a<0)throw new Error('پاسخ هوش مصنوعی JSON نداشت');t=t.slice(a);const b=t.lastIndexOf('}');if(b>0){try{return JSON.parse(t.slice(0,b+1))}catch(e){}}
  /* truncated answer: cut back to the last complete value and close open brackets */
  for(let cut=t.length;cut>1;){cut=Math.max(t.lastIndexOf('}',cut-1),t.lastIndexOf(']',cut-1))+1;if(cut<=0)break;const pre=t.slice(0,cut);const stack=[];let ins=false,esc=false;
    for(const ch of pre){if(ins){if(esc)esc=false;else if(ch==='\\')esc=true;else if(ch==='"')ins=false;continue}if(ch==='"')ins=true;else if(ch==='{'||ch==='[')stack.push(ch);else if(ch==='}'||ch===']')stack.pop()}
    if(ins)continue;const closed=pre.replace(/,\s*$/,'')+stack.reverse().map(c=>c==='{'?'}':']').join('');try{const j=JSON.parse(closed);j._truncated=true;return j}catch(e){cut--}}
  throw new Error('پاسخ هوش مصنوعی JSON معتبر نبود؛ دوباره امتحان کنید')}

aiJSON=async function(system,user,opts={}){await srvReady;const parts=[...(opts.parts||[]),{text:user}];
  if(S.aiProvider==='gemini'){const model=opts.model||S.geminiChat;
    const call=async()=>{if(SRV.server){const r=await fetch('/api/ai/json',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({system,parts,model,apiKey:S.geminiKey,maxTokens:opts.maxTokens||65536})});const j=await r.json().catch(()=>({error:'پاسخ نامعتبر سرور'}));if(!r.ok)throw new Error(j.error||('سرور '+r.status));return j}
      if(!S.geminiKey)throw new Error('کلید Gemini در «تنظیمات و API» وارد نشده');
      const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':S.geminiKey},body:JSON.stringify({systemInstruction:{parts:[{text:system}]},contents:[{role:'user',parts}],generationConfig:{responseMimeType:'application/json',temperature:.6,maxOutputTokens:opts.maxTokens||65536}})});
      if(!r.ok){const t=await r.text();throw new Error(/location is not supported/i.test(t)?'Gemini از این مکان (ایران) در دسترس نیست؛ VPN را روشن کنید یا از OpenAI/قالب آفلاین استفاده کنید':'Gemini '+r.status+': '+t.slice(0,200))}
      const j=await r.json();return {text:(j.candidates?.[0]?.content?.parts||[]).map(p=>p.text||'').join(''),finish:j.candidates?.[0]?.finishReason}};
    const j=await withRetry(call,3);const out=parseLooseJSON(j.text);if(j.finish==='MAX_TOKENS'||out._truncated)toast('پاسخ خیلی بلند بود و آخرش بریده شد؛ مراحل آخر را بررسی کنید',6000);return out}
  if(!S.openaiKey)throw new Error('کلید OpenAI در تنظیمات وارد نشده');
  const textParts=parts.map(p=>p.text||'').filter(Boolean).join('\n\n');
  const r=await withRetry(async()=>{const x=await fetch(S.openaiBase.replace(/\/$/,'')+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+S.openaiKey},body:JSON.stringify({model:S.openaiChat,temperature:.6,response_format:{type:'json_object'},messages:[{role:'system',content:system},{role:'user',content:textParts}]})});if(!x.ok)throw new Error('OpenAI '+x.status+': '+(await x.text()).slice(0,200));return x});
  const j=await r.json();return parseLooseJSON(j.choices[0].message.content)};

/* ---------- PDF text (pdf.js, cached by the service worker after first use) ---------- */
const PDFJS_V='4.10.38';
async function pdfToText(blob){const lib=await import(`https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_V}/build/pdf.min.mjs`);lib.GlobalWorkerOptions.workerSrc=`https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_V}/build/pdf.worker.min.mjs`;
  const doc=await lib.getDocument({data:new Uint8Array(await blob.arrayBuffer())}).promise;let out='';for(let i=1;i<=doc.numPages;i++){const pg=await doc.getPage(i);const tc=await pg.getTextContent();out+=`\n\n--- صفحه ${i} ---\n`+tc.items.map(it=>it.str+(it.hasEOL?'\n':' ')).join('')}return out}

/* ---------- sources (stored per episode in IndexedDB, not inside the episode file) ---------- */
let SRC=[];
async function loadSources(){try{SRC=(await DB.get('kv','src:'+P.id))||[]}catch(e){SRC=[]}renderSources()}
async function saveSources(){await DB.put('kv','src:'+P.id,SRC)}
async function addSourceFiles(files){for(const f of files){const isPdf=/pdf$/i.test(f.type)||/\.pdf$/i.test(f.name);if(/\.json$/i.test(f.name)){try{await importEpisodeJSON(JSON.parse(await f.text()));continue}catch(e){}}
    const item={id:uid(),name:f.name,kind:isPdf?'pdf':'text',size:f.size,added:Date.now(),blob:isPdf?f:null,text:isPdf?'':await f.text()};SRC.push(item)}
  await saveSources();renderSources();toast('منبع اضافه شد. ترتیب: بالا = قدیمی‌تر، پایین = جدیدتر (جدیدتر برنده است)',4500)}
function renderSources(){const el=$('#srcList');if(!el)return;el.innerHTML=SRC.length?SRC.map((s,i)=>`<div class="src-row" data-i="${i}"><span class="src-n">${fa(i+1)}</span><span class="src-k ${s.kind}">${s.kind==='pdf'?'PDF':'متن'}</span><span class="src-name" title="${esc(s.name)}">${esc(s.name)}</span><span class="muted">${fmtSize(s.size||0)}${i===SRC.length-1?' · جدیدترین':''}</span>
  <button class="btn sm icon ghost" data-sa="up" title="قدیمی‌تر"><i data-lucide="chevron-up"></i></button><button class="btn sm icon ghost" data-sa="down" title="جدیدتر"><i data-lucide="chevron-down"></i></button><button class="btn sm icon ghost" data-sa="del" title="حذف"><i data-lucide="x"></i></button></div>`).join(''):'<p class="muted">هنوز منبعی نیست. PDF دفترچهٔ کارگردانی، فایل md چت سناریو یا متن را اضافه کنید.</p>';icons(el)}

const VIS_LAYOUTS=['single','row','grid','tower','ring','versus','cards','timer','path'];
function aiSys4(){return `You are the head writer AND director of a top-tier Persian YouTube challenge show in the style of MrBeast (DADASHMODE). You receive SEVERAL SOURCES (director's book PDF, chat transcripts where decisions were changed, notes). Sources are numbered OLDEST → NEWEST. When they contradict, the NEWEST source wins (a chat decision overrides an older PDF page). Read everything completely (tables, storyboards, shot lists, dialogue, rules) and convert it into a precise run-of-show for a live broadcast graphics engine.
Rules:
- All output text in Persian. Spoken lines are natural spoken Persian (colloquial Tehrani), short (max ~16 words) so a subtitle fits in 2 lines. Split longer speeches.
- Add minimal smart diacritics (اِعراب) only on names and words that TTS could mispronounce (e.g. اِلیاس، عِماد، داداش‌مُود). Never on every letter.
- Each line gets the emotion that fits THAT exact moment (hype, suspense before reveals, calm for rules, strict for referee calls, celebration for wins) plus a short Persian acting note in "direction".
- For every game/challenge produce: "intro" (full-screen reveal, 1-3 hype lines), "rules" (short rules, max 9 words each; lines = one opener + exactly one line per rule, same order), optional "countdown", then "play" with duration and reward. Use a known "game" key only if it really is that game; otherwise "generic" AND design a "visual" blueprint so the graphics engine can illustrate the NEW challenge.
- visual blueprint: {"icon": one of [${Object.keys(CICON).join(', ')}], "icon2": optional second icon, "layout": one of [${VIS_LAYOUTS.join(', ')}], "count": 1-12 props, "labels": up to 6 very short Persian labels (e.g. "+۵","+۱۰"), "accent": hex color optional}.
- "theme": optionally pick a per-challenge theme name from [${THEMES.map(t=>t.name).join('، ')}] that fits the mood.
- Keep every scene, dialogue and director instruction from the sources. Put camera/props/SFX/AI-referee notes in "notes". Never invent plot, prizes or results. Results are entered live by the director.
- In brief.conflicts list every contradiction you found between sources (topic, older, newer, decision you applied). In brief.missing list anything the director must still decide. In brief.lexicon give pronunciation locks [{"word":"الیاس","say":"اِلیاس"}].
Return ONLY JSON: {"episode":{"name":string,"unit":string,"startBank":number,"players":[{"name":string,"color":hex,"symbol":string}]},"brief":{"summary":string,"tone":string,"characters":[string],"beats":[string],"directorNotes":[string],"conflicts":[{"topic":string,"older":string,"newer":string,"decision":string}],"missing":[string],"lexicon":[{"word":string,"say":string}]},"segments":[{"type":one of [title,intro,rules,countdown,play,bank,dialogue,winner,card],"game":one of [${Object.keys(GAMES).join(',')}],"title":string,"subtitle":string,"duration":seconds (play only),"reward":number (play only),"rules":[string],"notes":string,"theme":string,"visual":{...} (intro/rules/play of generic games),"lines":[{"speaker":string,"emotion":one of [${Object.keys(EMO).join(', ')}],"direction":string,"text":string}]}]}`}

applySegments=function(segs,append){const out=segs.map(s=>{const type=TYPES[s.type]?s.type:'card';const game=GAMES[s.game]?s.game:guessGame(s.title);
  const vis=s.visual&&typeof s.visual==='object'?{icon:CICON[s.visual.icon]?s.visual.icon:'star',icon2:CICON[s.visual.icon2]?s.visual.icon2:'',layout:VIS_LAYOUTS.includes(s.visual.layout)?s.visual.layout:'row',count:cl(+s.visual.count||3,1,12),labels:Array.isArray(s.visual.labels)?s.visual.labels.slice(0,6).map(String):[],accent:/^#[0-9a-f]{6}$/i.test(s.visual.accent||'')?s.visual.accent:''}:null;
  return mkSeg({type,game,title:s.title||'',subtitle:s.subtitle||'',duration:+s.duration||30,reward:Number.isFinite(+s.reward)?+s.reward:10,rules:Array.isArray(s.rules)?s.rules.filter(Boolean):[],notes:s.notes||'',status:'draft',
    theme:THEMES.some(t=>t.name===s.theme)?s.theme:'',visual:vis,
    lines:(s.lines||[]).filter(l=>l&&l.text).map(l=>({id:uid(),speaker:speakerFor(l.speaker),emotion:EMO[l.emotion]?l.emotion:findEmo(l.emotion),direction:l.direction||'',text:String(l.text).trim()}))})});
  if(append)P.segments.push(...out);else{stopAll();P.segments=out;st.sel=0}save();renderControl();return out.length};

async function buildSourceParts(forGemini){const list=[...SRC];const manual=($('#scriptText')?.value||'').trim();if(manual)list.push({name:'یادداشت‌ها و متن دستی کارگردان',kind:'text',text:manual});
  const n=list.length;const parts=[];for(let i=0;i<n;i++){const s=list[i];parts.push({text:`\n=== منبع ${i+1} از ${n}${i===n-1?' (جدیدترین)':i===0?' (قدیمی‌ترین)':''}: ${s.name} ===`});
    if(s.kind==='pdf'){if(forGemini&&s.blob&&s.size<19e6)parts.push({inline_data:{mime_type:'application/pdf',data:await blobToB64(s.blob)}});else{if(!s.text){try{s.text=await pdfToText(s.blob);saveSources()}catch(e){throw new Error('متن PDF استخراج نشد (بار اول اینترنت لازم است): '+e.message)}}parts.push({text:s.text})}}
    else parts.push({text:s.text||''})}return {parts,n}}

async function understandAll(btn){const {parts,n}=await buildSourceParts(S.aiProvider==='gemini');if(!n)throw new Error('اول یک منبع (PDF / md / متن) اضافه کنید');
  $('#parseMsg').textContent=`هوش مصنوعی در حال خواندن کامل ${fa(n)} منبع است (PDF بزرگ ممکن است ۱ تا ۳ دقیقه طول بکشد)...`;
  const j=await aiJSON(aiSys4(),'Understand ALL sources above completely and build the full run-of-show. Newest source wins on conflicts. Return the JSON only.',{parts});
  if(!Array.isArray(j.segments)||!j.segments.length)throw new Error('هوش مصنوعی مرحله‌ای برنگرداند');
  const asNew=$('#parseNew')?.checked;const append=$('#parseAppend').checked&&!asNew;
  if(typeof histPush==='function')histPush('قبل از درک سناریو');
  if(asNew){const keep=SRC;const c=cloneEpisode(P);c.name=(j.episode&&j.episode.name)||'قسمت جدید';c.segments=[];c.brief=null;await openProject(c);SRC=keep;await saveSources();renderSources()}
  P.brief=Object.assign({},j.brief||{});if(!append)applyEpisodeMeta(j.episode);
  const lex=(j.brief&&j.brief.lexicon)||[];if(lex.length){const have=lexiconPairs().map(x=>x[0]);const add=lex.filter(x=>x&&x.word&&x.say&&!have.includes(x.word)).map(x=>`${x.word} = ${x.say}`);if(add.length)P.lexicon=((P.lexicon!=null?P.lexicon:DEF_LEXICON)+'\n'+add.join('\n')).trim()}
  const cnt=applySegments(j.segments,append);renderBrief();return cnt}
