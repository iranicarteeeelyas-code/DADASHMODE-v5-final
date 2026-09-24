/* DADASHMODE v4 · control room upgrade: edit history (undo/redo), automatic inspection of every segment, clean program output,
   sources UI, brief with conflicts, voice engines + lexicon, inspector theme/visual editor, pro SFX bank, better logo cutout. Boots the app. */
'use strict';
const ICON_FA={trophy:'جام',cup:'لیوان',ball:'توپ',hoop:'سبد',box:'جعبه',gift:'هدیه',hand:'دست',glove:'دستکش',puzzle:'پازل',lock:'قفل',unlock:'قفل باز',briefcase:'کیف',brain:'مغز',pencil:'مداد',eye:'چشم',blind:'چشم‌بند',clock:'ساعت',zap:'برق',skull:'خرابکاری',card:'کارت',star:'ستاره',bottle:'بطری',target:'هدف',dice:'تاس',food:'غذا',key:'کلید',crown:'تاج',flame:'آتش',heart:'قلب',mic:'میکروفون',camera:'دوربین',run:'دویدن',question:'سؤال',check:'تیک',x:'ضربدر',music:'موسیقی',sword:'حمله',shield:'سپر',sparkle:'هوش مصنوعی',gavel:'داوری',robot:'داور ربات',coin:'سکه'};
const LAYOUT_FA={single:'تکی بزرگ',row:'ردیف',grid:'شبکه',tower:'برج',ring:'چرخشی',versus:'رودررو',cards:'کارت‌ها',timer:'تایمر',path:'مسیر مرحله‌ای'};

/* ---------------- edit history ---------------- */
const HIST={undo:[],redo:[],last:null,lock:false,t:0};
const snapObj=()=>JSON.stringify({name:P.name,unit:P.unit,startBank:P.startBank,segments:P.segments,speakers:P.speakers,players:P.players,theme:P.theme,layout:P.layout,brief:P.brief,lexicon:P.lexicon});
function histReset(){HIST.undo=[];HIST.redo=[];HIST.last=snapObj();histBtns()}
function histTick(){if(HIST.lock||!P)return;const cur=snapObj();if(HIST.last!=null&&cur!==HIST.last){HIST.undo.push(HIST.last);if(HIST.undo.length>80)HIST.undo.shift();HIST.redo=[]}HIST.last=cur;histBtns()}
function histPush(){clearTimeout(HIST.t);histTick()}
function histRestore(json){HIST.lock=true;const o=JSON.parse(json);Object.assign(P,o);if(o.lexicon===undefined)delete P.lexicon;st.sel=Math.min(st.sel,Math.max(0,P.segments.length-1));_save0();renderControl();HIST.last=json;HIST.lock=false;histBtns()}
function histUndo(){clearTimeout(HIST.t);histTick();if(!HIST.undo.length){toast('ویرایشی برای برگرداندن نیست');return}HIST.redo.push(HIST.last);histRestore(HIST.undo.pop());toast('ویرایش برگردانده شد')}
function histRedo(){if(!HIST.redo.length)return;HIST.undo.push(HIST.last);histRestore(HIST.redo.pop());toast('دوباره اعمال شد')}
function histBtns(){const u=$('#histUndo'),r=$('#histRedo');if(u)u.disabled=!HIST.undo.length;if(r)r.disabled=!HIST.redo.length}
const _save0=save;save=function(){_save0();if(!HIST.lock){clearTimeout(HIST.t);HIST.t=setTimeout(()=>{histTick();runInspect()},700)}};
$('#histUndo').onclick=histUndo;$('#histRedo').onclick=histRedo;
document.addEventListener('keydown',e=>{if(!(e.ctrlKey||e.metaKey)||e.target.matches('input,textarea,select'))return;const k=e.key.toLowerCase();if(k==='z'&&!e.shiftKey){e.preventDefault();histUndo()}else if(k==='y'||(k==='z'&&e.shiftKey)){e.preventDefault();histRedo()}});

/* ---------------- automatic inspection ---------------- */
function inspectAll(){const out=[];let err=0,warn=0;const add=(i,lvl,msg)=>{out.push({i,lvl,msg});lvl==='err'?err++:warn++};
  const canFill=['gemini','edge','openai'].some(providerUsable);
  P.segments.forEach((s,i)=>{const miss=s.lines.filter(l=>l.text.trim()&&vstat(l)!=='ready').length;if(miss)add(i,'err',`${fa(miss)} دیالوگ صدا ندارد${canFill?'':' و هیچ موتور صدایی فعال نیست'}`);
    const empty=s.lines.filter(l=>!l.text.trim()).length;if(empty)add(i,'warn',`${fa(empty)} دیالوگ خالی`);
    if(['title','intro','rules','play','card'].includes(s.type)&&!s.title.trim())add(i,'warn','عنوان روی صحنه خالی است');
    if(s.type==='rules'){if(!s.rules.length)add(i,'err','قانونی وارد نشده');else if(s.lines.length&&s.lines.length!==s.rules.length&&s.lines.length!==s.rules.length+1)add(i,'warn',`تعداد دیالوگ (${fa(s.lines.length)}) با تعداد قانون (${fa(s.rules.length)}) جور نیست؛ انیمیشن قوانین با صدا هم‌زمان نمی‌شود`);
      s.rules.forEach((r,k)=>{if(r.split(/\s+/).length>10)add(i,'warn',`قانون ${fa(k+1)} بلند است (بیش از ۱۰ کلمه)`)})}
    s.lines.forEach((l,k)=>{const w=l.text.trim().split(/\s+/).filter(Boolean).length;if(w>18)add(i,'warn',`دیالوگ ${fa(k+1)} بلند است (${fa(w)} کلمه)؛ زیرنویس بیش از ۲ خط می‌شود`)});
    if(s.type==='play'&&(!s.duration||s.duration<5))add(i,'err','زمان بازی تنظیم نشده');
    if(['intro','rules','play'].includes(s.type)&&s.game==='generic'&&!s.visual)add(i,'warn','بازی جدید است ولی تصویرسازی اختصاصی ندارد (در جزئیات مرحله «تصویرسازی» را تنظیم کنید)');
    if(s.type==='intro'&&!(P.segments[i+1]&&P.segments[i+1].type==='rules'))add(i,'warn','بعد از معرفی، مرحلهٔ قوانین نیامده');
    if(s.status==='issue'||s.issue)add(i,'err','ایراد ثبت‌شده: '+(s.issue||'نیاز به اصلاح'));else if(s.status==='draft')add(i,'warn','هنوز پیش‌نویس است (بعد از بررسی «آماده» بزنید)');
    if(/SAFE\s*\/\s*RISK|Bottle Flip|Target\s*>\s*Stack/i.test(s.title+' '+s.subtitle+' '+s.rules.join(' ')+' '+s.notes))add(i,'warn','مکانیک قدیمی (SAFE/RISK، Bottle Flip یا Target>Stack) هنوز در این مرحله هست')});
  if(!P.logo)add(-1,'warn','لوگو تنظیم نشده (تم، چیدمان، لوگو)');
  return {items:out,err,warn}}
function runInspect(){const el=$('#inspectList');const r=inspectAll();const b=$('#inspBadge');if(b){b.textContent=r.err?fa(r.err):r.warn?fa(r.warn):'✓';b.className='badge '+(r.err?'bad':r.warn?'warn':'ok')}
  if(!el)return r;el.innerHTML=r.items.length?r.items.map(x=>`<button class="insp-item ${x.lvl}" data-i="${x.i}"><span class="insp-seg">${x.i>=0?'مرحله '+fa(x.i+1):'کل قسمت'}</span><span>${esc(x.msg)}</span></button>`).join(''):'<p class="muted">همه‌چیز آماده است ✓</p>';return r}
$('#inspectList').addEventListener('click',e=>{const b=e.target.closest('.insp-item');if(!b)return;const i=+b.dataset.i;if(i>=0){st.sel=i;renderROS();renderInspector();renderGameDeck()}else showView('look')});
$('#inspRun').onclick=()=>{runInspect();toast('بازرسی انجام شد')};
$('#inspFix').onclick=async e=>{const b=e.currentTarget;b.disabled=true;const r=await fillMissingVoices((i,n)=>b.textContent=`ساخت ${fa(i+1)} از ${fa(n)}...`);b.disabled=false;b.innerHTML='<i data-lucide="sparkles"></i>ساخت همهٔ صداهای ناقص';icons(b);refreshVoiceBits();toast(r.total?`${fa(r.ok)} صدا ساخته شد${r.fail?'، '+fa(r.fail)+' خطا: '+r.last:''}`:'صدای ناقصی نبود',6000)};
$('#deckTabs').addEventListener('click',e=>{if(e.target.closest('[data-deck="inspect"]'))runInspect()});
const _rvb=refreshVoiceBits;refreshVoiceBits=function(){_rvb();runInspect()};

/* ---------------- preflight: engines + inspection ---------------- */
const _rp=renderPreflight;renderPreflight=async function(){await _rp();const ul=$('#preflight');if(!ul)return;await srvReady;const eng=engineReport().filter(x=>x.ok).map(x=>PROVIDERS[x.p].split(' ·')[0]);const r=inspectAll();
  const add=[[eng.length?'y':'n',eng.length?'موتورهای صدای فعال: '+eng.join('، '):'هیچ موتور صدایی فعال نیست (کلید Gemini بدهید یا اپ را با start-windows.bat باز کنید)'],[r.err?'n':r.warn?'w':'y',r.err?`${fa(r.err)} ایراد جدی در بازرسی مراحل (زبانهٔ بازرسی)`:r.warn?`${fa(r.warn)} هشدار در بازرسی مراحل`:'بازرسی مراحل بدون ایراد']];
  ul.insertAdjacentHTML('beforeend',add.map(([k,l])=>`<li><i data-lucide="${{y:'check-circle-2',n:'x-circle',w:'alert-triangle'}[k]}" class="${k}"></i><span>${l}</span></li>`).join(''));icons(ul)};

/* ---------------- recording: auto-fill missing voices ---------------- */
$('#recWarn').addEventListener('click',async e=>{if(e.target.id!=='recFill')return;const b=e.target;b.disabled=true;const r=await fillMissingVoices((i,n)=>b.textContent=`در حال ساخت ${fa(i+1)} از ${fa(n)}...`);refreshVoiceBits();
  if(r.fail){b.disabled=false;b.textContent='دوباره تلاش کن';toast(`${fa(r.fail)} صدا ساخته نشد: ${r.last}`,7000);return}$('#recWarn').innerHTML='';startRecording(true)});

/* ---------------- clean program output window ---------------- */
$('#tProgram').onclick=()=>{const w=window.open('','dm-program','width=1280,height=720');if(!w){toast('پنجره باز نشد؛ اجازهٔ Pop-up بدهید');return}
  w.document.write('<!doctype html><html dir="rtl"><head><title>DADASHMODE · خروجی تمیز</title><style>html,body{margin:0;height:100%;background:#000;overflow:hidden}video{width:100vw;height:100vh;object-fit:contain;display:block}p{position:fixed;inset:auto 0 8px;text-align:center;color:#888;font:13px Tahoma;margin:0}</style></head><body><video autoplay muted playsinline></video><p id="h">دوبار کلیک = تمام‌صفحه · این پنجره را در OBS یا مانیتور دوم بگذارید</p><script>document.body.ondblclick=()=>{document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen();document.getElementById("h").remove()}<\/script></body></html>');w.document.close();
  const v=w.document.querySelector('video');v.srcObject=cv.captureStream(+S.fps||60);v.play().catch(()=>{})};

/* ---------------- script page ---------------- */
$('#scriptFile').onchange=async e=>{const fs=[...e.target.files];e.target.value='';if(fs.length)await addSourceFiles(fs)};
$('#srcList').addEventListener('click',async e=>{const b=e.target.closest('[data-sa]');if(!b)return;const i=+b.closest('.src-row').dataset.i;const a=b.dataset.sa;
  if(a==='up'&&i>0)[SRC[i-1],SRC[i]]=[SRC[i],SRC[i-1]];else if(a==='down'&&i<SRC.length-1)[SRC[i+1],SRC[i]]=[SRC[i],SRC[i+1]];else if(a==='del')SRC.splice(i,1);await saveSources();renderSources()});
$('#aiParse').onclick=async e=>{const b=e.currentTarget;b.disabled=true;try{const n=await understandAll(b);const c=(P.brief&&P.brief.conflicts||[]).length;$('#parseMsg').textContent=`${fa(n)} مرحله با دیالوگ، لحن و تصویرسازی ساخته شد${c?` · ${fa(c)} تناقض بین منابع پیدا و حل شد (سمت چپ ببینید)`:''}. حالا «بازرسی» و بعد ساخت صداها.`;runInspect()}
  catch(err){console.error(err);$('#parseMsg').textContent=err.message+' · اگر اینترنت/VPN ندارید از «تبدیل آفلاین» استفاده کنید.'}finally{b.disabled=false}};
$('#offParse').onclick=async()=>{let txt='';for(const s of SRC){if(s.kind==='pdf'&&!s.text){try{s.text=await pdfToText(s.blob);saveSources()}catch(e){}}txt+='\n'+(s.text||'')}txt+='\n'+$('#scriptText').value;
  const{meta,segs}=parseOffline(txt);if(!segs.length){$('#parseMsg').textContent='چیزی برای تبدیل پیدا نشد (قالب استاندارد سمت چپ را ببینید).';return}histPush();applyEpisodeMeta(meta);const n=applySegments(segs,$('#parseAppend').checked);$('#parseMsg').textContent=`${fa(n)} مرحله ساخته شد. در اتاق کنترل بررسی کنید.`;runInspect()};
renderBrief=function(){const b=P.brief;const el=$('#briefOut');if(!b){el.innerHTML='<p class="muted">هنوز تحلیلی انجام نشده. منابع را اضافه کنید و «درک کامل با هوش مصنوعی» را بزنید؛ خلاصه، لحن، ضرب‌آهنگ، تناقض‌های بین منابع و واژه‌نامهٔ تلفظ اینجا می‌آید.</p>';return}const li=a=>(a||[]).map(x=>`<li>${esc(x)}</li>`).join('');
  el.innerHTML=`${b.summary?`<div><h3>خلاصه</h3><p>${esc(b.summary)}</p></div>`:''}${b.tone?`<div><h3>لحن کلی</h3><p>${esc(b.tone)}</p></div>`:''}
  ${(b.conflicts||[]).length?`<div class="conf"><h3>تناقض‌های بین منابع (جدیدتر اعمال شد)</h3><ul>${b.conflicts.map(c=>`<li><b>${esc(c.topic||'')}</b>: <s>${esc(c.older||'')}</s> ← ${esc(c.newer||'')}${c.decision?` <span class="muted">(${esc(c.decision)})</span>`:''}</li>`).join('')}</ul></div>`:''}
  ${(b.missing||[]).length?`<div class="miss"><h3>هنوز باید تصمیم بگیرید</h3><ul>${li(b.missing)}</ul></div>`:''}
  ${b.characters&&b.characters.length?`<div><h3>شخصیت‌ها</h3><ul>${li(b.characters)}</ul></div>`:''}${b.beats&&b.beats.length?`<div><h3>ضرب‌آهنگ و مراحل</h3><ul>${li(b.beats)}</ul></div>`:''}${b.directorNotes&&b.directorNotes.length?`<div><h3>یادداشت‌های کارگردان</h3><ul>${li(b.directorNotes)}</ul></div>`:''}`};

/* ---------------- voice page ---------------- */
function renderEngines(){const el=$('#engines');if(!el)return;const hint={gemini:'کلید Gemini در تنظیمات (از ایران VPN لازم است)',edge:'اپ را با start-windows.bat یا npm start باز کنید',openai:'کلید OpenAI در تنظیمات',piper:'در همین صفحه «دانلود و نصب موتور»'};
  el.innerHTML=engineReport().map(x=>`<div class="eng ${x.ok?'on':'off'}"><span>${x.ok?'✓':'✕'}</span><b>${PROVIDERS[x.p]}</b>${x.ok?'':`<span class="muted">${hint[x.p]}</span>`}</div>`).join('')}
const _renderVoice=renderVoice;renderVoice=function(){_renderVoice();renderEngines();srvReady.then(renderEngines);const lx=$('#lexicon');if(lx&&document.activeElement!==lx)lx.value=P.lexicon!=null?P.lexicon:DEF_LEXICON};
$('#lexicon').addEventListener('input',e=>{P.lexicon=e.target.value;save()});
$('#installFolder').onclick=async e=>{const b=e.currentTarget;b.disabled=true;const n=await installAllToFolder();b.disabled=false;if(n)toast(`${fa(n)} فایل صدا داخل پوشهٔ voices نوشته شد؛ روی هر دستگاهی که اپ را کپی کنید، صداها نصب‌اند`,6000)};

/* ---------------- settings: voice safety, bloom, SFX bank ---------------- */
function renderSfxBank(){const el=$('#sfxBank');if(!el)return;const slots=Object.assign({},SFX_LIST,BED_SLOTS);el.innerHTML=Object.entries(slots).map(([k,v])=>`<div class="sfx-row" data-k="${k}"><b>${esc(v)}</b><span class="muted" data-st>${AE.custom&&AE.custom[k]?'فایل شما':'ساختگی'}</span><button class="btn sm" data-sb="test"><i data-lucide="volume-2"></i></button><label class="btn sm"><i data-lucide="upload"></i><input type="file" accept="audio/*" hidden data-sb="file"></label><button class="btn sm ghost" data-sb="clr" title="برگشت به صدای ساختگی"><i data-lucide="x"></i></button></div>`).join('');icons(el)}
$('#sfxBank').addEventListener('click',async e=>{const b=e.target.closest('[data-sb]');if(!b||b.dataset.sb==='file')return;const k=b.closest('[data-k]').dataset.k;await AE.resume();
  if(b.dataset.sb==='test'){if(BED_SLOTS[k]){AE.bedOn(k==='bed_play'?'play':'suspense');setTimeout(()=>AE.bedOff(),5000)}else AE[k]&&AE[k]()}else{await DB.del('kv','sfx:'+k);if(AE.custom)delete AE.custom[k];renderSfxBank();toast('صدای ساختگی برگشت')}});
$('#sfxBank').addEventListener('change',async e=>{if(e.target.dataset.sb!=='file')return;const f=e.target.files[0];if(!f)return;const k=e.target.closest('[data-k]').dataset.k;await AE.resume();try{const buf=await AE.ctx.decodeAudioData(await f.arrayBuffer());await DB.put('kv','sfx:'+k,f);AE.custom=AE.custom||{};AE.custom[k]=buf;renderSfxBank();toast('فایل شما جایگزین شد و آفلاین ذخیره شد')}catch(err){toast('این فایل صوتی خوانده نشد')}});
const _renderSettings=renderSettings;renderSettings=async function(){await _renderSettings();$('#sFallback').checked=S.fallback!==false;$('#sAllowMale').checked=!!S.allowMale;$('#sBloom').checked=S.bloom!==false;$('#sFbGemini').value=S.fbGemini||'';renderSfxBank()};
[['#sFallback','fallback'],['#sAllowMale','allowMale'],['#sBloom','bloom']].forEach(([sel,k])=>$(sel).addEventListener('change',e=>{S[k]=e.target.checked;saveS()}));
$('#sFbGemini').addEventListener('change',e=>{S.fbGemini=e.target.value.trim();saveS()});

/* ---------------- inspector: per-challenge theme + visual blueprint ---------------- */
const _renderInspector=renderInspector;renderInspector=function(){_renderInspector();const s=P.segments[st.sel];if(!s)return;const el=$('#insp');const box=document.createElement('div');box.className='v4box';
  const v=s.visual||{};const showVis=['intro','rules','play'].includes(s.type);
  box.innerHTML=`<label class="f">تم مخصوص این مرحله<select data-v4="theme"><option value="">همان تم قسمت</option>${THEMES.map(t=>`<option ${t.name===s.theme?'selected':''}>${esc(t.name)}</option>`).join('')}</select></label>
  ${showVis?`<details class="vis" ${s.game==='generic'?'open':''}><summary>تصویرسازی اختصاصی بازی ${s.game==='generic'?'':'<span class="muted">(فقط برای بازی «عمومی» استفاده می‌شود)</span>'}</summary>
    <div class="grid2"><label class="f">نماد اصلی<select data-v4="icon">${Object.entries(ICON_FA).map(([k,n])=>`<option value="${k}" ${k===v.icon?'selected':''}>${n}</option>`).join('')}</select></label><label class="f">چیدمان<select data-v4="layout">${Object.entries(LAYOUT_FA).map(([k,n])=>`<option value="${k}" ${k===v.layout?'selected':''}>${n}</option>`).join('')}</select></label></div>
    <div class="grid2"><label class="f">تعداد<input type="number" min="1" max="12" data-v4="count" value="${v.count||3}"></label><label class="f">نماد دوم<select data-v4="icon2"><option value="">—</option>${Object.entries(ICON_FA).map(([k,n])=>`<option value="${k}" ${k===v.icon2?'selected':''}>${n}</option>`).join('')}</select></label></div>
    <label class="f">برچسب‌ها (با ویرگول)<input type="text" data-v4="labels" value="${esc((v.labels||[]).join('، '))}" placeholder="+۵، +۱۰، +۲۰"></label>
    <div class="row"><button class="btn sm" data-v4b="ai"><i data-lucide="sparkles"></i>پیشنهاد با هوش مصنوعی</button><button class="btn sm ghost" data-v4b="clr">حذف تصویرسازی</button></div></details>`:''}`;
  const anchor=el.querySelector('[data-f="issue"]');el.insertBefore(box,anchor?anchor.closest('label'):null);icons(box)};
$('#insp').addEventListener('change',e=>{const k=e.target.dataset.v4;if(!k)return;const s=P.segments[st.sel];if(!s)return;if(k==='theme')s.theme=e.target.value;else{s.visual=Object.assign({icon:'star',layout:'row',count:3,labels:[],icon2:'',accent:''},s.visual||{});if(k==='count')s.visual.count=cl(+e.target.value||1,1,12);else if(k==='labels')s.visual.labels=e.target.value.split(/[،,]/).map(x=>x.trim()).filter(Boolean).slice(0,6);else s.visual[k]=e.target.value;if(s.game!=='generic'&&k!=='theme'){s.game='generic';renderInspector()}}save();renderROS()});
$('#insp').addEventListener('click',async e=>{const b=e.target.closest('[data-v4b]');if(!b)return;const s=P.segments[st.sel];if(b.dataset.v4b==='clr'){s.visual=null;save();renderInspector();return}
  b.disabled=true;try{const j=await aiJSON(`Design a broadcast illustration blueprint for a Persian TV game-show challenge. Return ONLY JSON {"icon":one of [${Object.keys(CICON).join(',')}],"icon2":same list or "","layout":one of [${Object.keys(LAYOUT_FA).join(',')}],"count":1-12,"labels":[up to 6 very short Persian labels],"theme":one of [${THEMES.map(t=>t.name).join('،')}]}`,`Challenge: ${s.title}\n${s.subtitle}\nRules: ${s.rules.join(' | ')}\nNotes: ${s.notes}`);
    s.visual={icon:CICON[j.icon]?j.icon:'star',icon2:CICON[j.icon2]?j.icon2:'',layout:LAYOUT_FA[j.layout]?j.layout:'row',count:cl(+j.count||3,1,12),labels:(j.labels||[]).slice(0,6).map(String),accent:''};if(THEMES.some(t=>t.name===j.theme))s.theme=j.theme;s.game='generic';save();renderInspector();toast('تصویرسازی ساخته شد؛ مرحله را اجرا کنید')}catch(err){toast(err.message,5000)}finally{b.disabled=false}});

/* ---------------- logo: multi-colour background detection + click-to-remove colour ---------------- */
cutLogo=async function(src,tol,global){const im=await loadImg(src);const k=Math.min(1,1600/Math.max(im.width,im.height));const w=Math.round(im.width*k),h=Math.round(im.height*k);const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(im,0,0,w,h);const d=x.getImageData(0,0,w,h),p=d.data;
  const border=[];const stp=Math.max(1,Math.round((w+h)/400));for(let xx=0;xx<w;xx+=stp){border.push((0*w+xx)*4,((h-1)*w+xx)*4)}for(let yy=0;yy<h;yy+=stp){border.push((yy*w)*4,(yy*w+w-1)*4)}
  if(border.filter(i=>p[i+3]<20).length>border.length*.6){return trimAlpha(c,x,w,h)}
  /* k-means (k≤3) on border colours → handles gradients / two-tone backgrounds */
  let cent=[[p[border[0]],p[border[0]+1],p[border[0]+2]]];const far=()=>{let best=null,bd=-1;for(const i of border){const dd=Math.min(...cent.map(cc=>Math.hypot(p[i]-cc[0],p[i+1]-cc[1],p[i+2]-cc[2])));if(dd>bd){bd=dd;best=i}}return bd>tol*1.2?[p[best],p[best+1],p[best+2]]:null};
  for(let n=0;n<2;n++){const f=far();if(f)cent.push(f)}for(let it=0;it<6;it++){const acc=cent.map(()=>[0,0,0,0]);for(const i of border){let bi=0,bd=1e9;cent.forEach((cc,j)=>{const dd=Math.hypot(p[i]-cc[0],p[i+1]-cc[1],p[i+2]-cc[2]);if(dd<bd){bd=dd;bi=j}});acc[bi][0]+=p[i];acc[bi][1]+=p[i+1];acc[bi][2]+=p[i+2];acc[bi][3]++}cent=cent.map((cc,j)=>acc[j][3]?[acc[j][0]/acc[j][3],acc[j][1]/acc[j][3],acc[j][2]/acc[j][3]]:cc)}
  const keys=(P.logo&&P.logo.keys||[]).map(hx=>{const n=parseInt(hx.slice(1),16);return[n>>16&255,n>>8&255,n&255]});const bgs=[...cent,...keys];
  const near=i=>{let bd=1e9,bc=bgs[0];for(const cc of bgs){const dd=Math.hypot(p[i]-cc[0],p[i+1]-cc[1],p[i+2]-cc[2]);if(dd<bd){bd=dd;bc=cc}}return[bd,bc]};
  const alphaAt=new Float32Array(w*h).fill(1);
  if(global){for(let q=0;q<w*h;q++){const[dd]=near(q*4);if(dd<tol)alphaAt[q]=0;else if(dd<tol*1.5)alphaAt[q]=(dd-tol)/(tol*.5)}}
  else{const seen=new Uint8Array(w*h);const stack=[];for(let xx=0;xx<w;xx++)stack.push(xx,(h-1)*w+xx);for(let yy=0;yy<h;yy++)stack.push(yy*w,yy*w+w-1);
    while(stack.length){const q=stack.pop();if(seen[q])continue;seen[q]=1;const[dd]=near(q*4);if(dd>=tol*1.5)continue;if(dd<tol)alphaAt[q]=0;else{alphaAt[q]=(dd-tol)/(tol*.5);continue}const qx=q%w;if(qx>0)stack.push(q-1);if(qx<w-1)stack.push(q+1);if(q>=w)stack.push(q-w);if(q<w*(h-1))stack.push(q+w)}
    if(keys.length){for(let q=0;q<w*h;q++){if(alphaAt[q]===0)continue;const i=q*4;for(const cc of keys){const dd=Math.hypot(p[i]-cc[0],p[i+1]-cc[1],p[i+2]-cc[2]);if(dd<tol)alphaAt[q]=0}}}}
  for(let q=0;q<w*h;q++){const a=alphaAt[q];const i=q*4;if(a>=1)continue;if(a<=0){p[i+3]=0;continue}const[,bc]=near(i);for(let j=0;j<3;j++)p[i+j]=cl(Math.round((p[i+j]-bc[j]*(1-a))/Math.max(a,.2)),0,255);p[i+3]=Math.round(p[i+3]*a)}
  x.putImageData(d,0,0);return trimAlpha(c,x,w,h)};
function trimAlpha(c,x,w,h){const p=x.getImageData(0,0,w,h).data;let minX=w,minY=h,maxX=0,maxY=0;for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){if(p[(yy*w+xx)*4+3]>12){if(xx<minX)minX=xx;if(xx>maxX)maxX=xx;if(yy<minY)minY=yy;if(yy>maxY)maxY=yy}}
  if(maxX<=minX)return c.toDataURL('image/png');const o=document.createElement('canvas');o.width=maxX-minX+1;o.height=maxY-minY+1;o.getContext('2d').drawImage(c,minX,minY,o.width,o.height,0,0,o.width,o.height);return o.toDataURL('image/png')}
$('#logoOrig').addEventListener('click',async e=>{const img=e.target.closest('img');if(!img||!P.logo)return;const r=img.getBoundingClientRect();const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const x=c.getContext('2d');x.drawImage(img,0,0);
  const px=x.getImageData(Math.floor((e.clientX-r.left)/r.width*c.width),Math.floor((e.clientY-r.top)/r.height*c.height),1,1).data;const hx='#'+[px[0],px[1],px[2]].map(v=>v.toString(16).padStart(2,'0')).join('');
  P.logo.keys=[...(P.logo.keys||[]),hx].slice(-6);toast('رنگ '+hx+' هم حذف می‌شود...');await setLogoCut(false)});
$('#logoKeep').addEventListener('click',()=>{if(P.logo){P.logo.keys=[];save()}});

/* ---------------- projects ---------------- */
const _openProject=openProject;openProject=async function(p){await _openProject(p);await loadSources();histReset();runInspect()};

/* ---------------- boot ---------------- */
boot().then(async()=>{await loadSources();histReset();runInspect();srvReady.then(()=>{renderPreflight();if(SRV.server)console.log('local server engines',SRV)})});
