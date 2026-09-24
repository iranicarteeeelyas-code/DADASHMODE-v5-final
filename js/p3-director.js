/* DADASHMODE v5 · PHASE 3 · on-set Director Assistant
   - shot list per segment (auto from segment type, game, notes like «دوربین ۲ روی دست‌ها», plus your own shots)
   - props: auto-detected from the script (rules, notes, titles, dialogue) + per-game kits, checklist need → have → on set
   - live HUD: what is happening NOW, what to prepare NEXT, props not yet on set, dialogue to cue manually, timer reminders
   - coverage: which segments, shots and lines are still not captured, so nothing is forgotten
   - printable call sheet. Everything is stored inside the episode (P.director), so phase-1 backups include it. */
'use strict';
(function(){
const D=DM5,fa=D.fa,esc=D.esc;
const def=()=>({v:1,cams:[{id:'1',name:'مستر ثابت (نمای باز)'},{id:'2',name:'دوربین نزدیک / متحرک'},{id:'3',name:'واکنش صورت (گوشی)'}],shots:{},props:[],lines:{},seg:{},notes:{},opt:{hud:true,speak:false,ahead:true}});
const DIR=()=>D.bag('director',def);
const players=()=>{const p=D.P();return p&&p.players?p.players:[]};
const nP=()=>Math.max(1,players().length);

/* ================= shots ================= */
const SHOT_BY_TYPE={
 title:[['1','نمای باز','هر دو بازیکن در قاب، فاصلهٔ یکسان از مرکز'],['2','مدیوم',`واکنش {p0} به خوشامد`],['3','مدیوم',`واکنش {p1} به خوشامد`]],
 intro:[['2','اینسرت','کلوزآپ آهسته از وسایل همین بازی (B-roll برای زیر معرفی)'],['3','کلوزآپ','واکنش هر دو بازیکن وقتی اسم بازی اعلام می‌شود']],
 rules:[['1','نمای باز','بازیکن‌ها در حال گوش دادن'],['2','اینسرت','برای هر قانون، همان وسیله/حرکت را نشان بده']],
 countdown:[['3','کلوزآپ','صورت هر دو بازیکن، چشم‌ها روی تایمر'],['2','کلوزآپ','دست‌ها روی وسایل، آمادهٔ شروع']],
 play:[['1','مستر','کل صحنه و هر دو بازیکن، بدون قطع تا پایان راند'],['2','نزدیک','دست‌ها و وسایل'],['3','واکنش','صورت بازیکن‌ها در لحظه‌های حساس']],
 bank:[['3','واکنش','واکنش به امتیازها روی صفحه'],['1','نمای باز','هر دو بازیکن رو به دوربین']],
 dialogue:[['1','مدیوم','بازیکن‌ها هنگام شنیدن داور']],
 winner:[['3','کلوزآپ','صورت برنده، ۳ ثانیه قبل از اعلام'],['1','نمای باز','جشن و واکنش بازنده'],['2','اینسرت','کیف طلایی / جایزه']],
 card:[['1','نمای باز','قاب ثابت']]};
const SHOT_BY_GAME={
 cup:[['2','کلوزآپ هم‌سطح میز','برج از روبه‌رو؛ ۲ ثانیه سرپا ماندن باید کامل دیده شود'],['1','کنترل قانون','دست دوم پشت کمر در قاب باشد (برای داوری)']],
 distance:[['1','نمای جانبی','کل مسیر پرتاب تا سبد، هر سه خط رنگی داخل قاب'],['2','اینسرت','لحظهٔ انتخاب خط (قفل شدن انتخاب)']],
 mystery:[['2','بالای سر (Top-down)','هر شش جعبه و شماره‌ها'],['3','کلوزآپ','صورت هنگام خوردن لقمه']],
 mitts:[['2','دنبال‌کننده (Follow)','از باز کردن جعبه تا خط پایان'],['1','نمای باز','خط پایان داخل قاب']],
 powers:[['2','اینسرت','کارت قدرتی که خریده می‌شود'],['3','واکنش','صورت حریف هنگام خرابکاری']],
 vault:[['2','کلوزآپ','ارقام قفل هنگام وارد کردن هر رمز'],['1','نمای باز','لحظهٔ باز شدن کیف (اگر دوربین دارد ۶۰ یا ۱۲۰ فریم)'],['3','کلوزآپ','برگهٔ نقاشی/معما']]};
function fillP(s){const ps=players();return s.replace('{p0}',ps[0]?ps[0].name:'بازیکن اول').replace('{p1}',ps[1]?ps[1].name:'بازیکن دوم')}
function parseCamNotes(txt){const out=[];const re=/دوربین\s*([۰-۹\d]+)\s*[:：]?\s*(?:روی|برای|از)?\s*([^،,.\n؛]+)/g;let m;while((m=re.exec(txt||''))){out.push([D.en(m[1]),'طبق یادداشت',m[2].trim()])}return out}
function autoShots(seg){const base=[...(SHOT_BY_TYPE[seg.type]||[])];if(['play','rules','intro'].includes(seg.type)&&SHOT_BY_GAME[seg.game])base.push(...SHOT_BY_GAME[seg.game]);
 if(seg.type==='rules')(seg.rules||[]).forEach((r,k)=>base.push(['2','اینسرت قانون '+fa(k+1),r]));
 const notes=[seg.notes,...(seg.lines||[]).map(l=>l.direction)].join('\n');base.unshift(...parseCamNotes(notes));
 const seen=new Set();return base.filter(([c,f,d])=>{const k=c+f+d;if(seen.has(k))return false;seen.add(k);return true}).map(([cam,frame,desc])=>({id:D.id(),cam,frame,desc:fillP(desc),done:false,auto:true}))}
function shotsOf(seg){const d=DIR();if(!d.shots[seg.id])d.shots[seg.id]=autoShots(seg);return d.shots[seg.id]}
function regenShots(seg){const d=DIR();const old=d.shots[seg.id]||[];const mine=old.filter(s=>!s.auto);const done=new Set(old.filter(s=>s.done).map(s=>s.cam+s.frame+s.desc));d.shots[seg.id]=[...autoShots(seg).map(s=>(done.has(s.cam+s.frame+s.desc)&&(s.done=true),s)),...mine]}

/* ================= props ================= */
const KITS={
 cup:[['لیوان یک‌بار مصرف (هم‌اندازه)',10,true],['میز صاف و بی‌لرزش',1,false]],
 distance:[['توپ کوچک',3,true],['سبد / سطل هدف',1,false],['نوار چسب سبز، زرد، قرمز برای خط‌ها',3,false],['متر برای اندازه‌گیری فاصلهٔ خط‌ها',1,false]],
 mystery:[['جعبهٔ شماره‌دار ۱ تا ۶',6,false],['لقمه/خوراکی داخل جعبه‌ها (آلرژی را بپرسید)',6,false],['برگهٔ مخفی نتیجهٔ جعبه‌ها (فقط کارگردان)',1,false]],
 mitts:[['دستکش فر (جفت)',1,true],['جعبهٔ چسب‌خورده',1,true],['پازل ۴ تکهٔ آرم گرگ',1,true],['نوار خط پایان',1,false]],
 powers:[['کارت‌های قدرت چاپی (۶ نوع)',6,false],['کارت خرابکاری',3,false]],
 vault:[['کیف طلایی',1,false],['قفل رمزدار ۳ رقمی',1,false],['چشم‌بند',1,true],['کاغذ A3 و ماژیک',1,true],['الگوی «ساخت از حافظه»',1,false],['برگهٔ معمای منطقی در پاکت',1,false],['کدهای کیف روی کاغذ (نسخهٔ پشتیبان)',1,false]]};
const KEYWORDS=[[/لیوان/,'لیوان یک‌بار مصرف (هم‌اندازه)'],[/توپ/,'توپ کوچک'],[/سبد|سطل|حلقه/,'سبد / سطل هدف'],[/دستکش/,'دستکش فر (جفت)'],[/پازل|قطعه/,'پازل ۴ تکهٔ آرم گرگ'],[/کیف/,'کیف طلایی'],[/قفل|رمز/,'قفل رمزدار ۳ رقمی'],
 [/چشم[\s‌]*(بسته|بند)/,'چشم‌بند'],[/نقاشی|بکش/,'کاغذ A3 و ماژیک'],[/لقمه|خوراکی/,'لقمه/خوراکی داخل جعبه‌ها (آلرژی را بپرسید)'],[/بطری/,'بطری'],[/تاس/,'تاس'],[/سوت/,'سوت داور'],[/کرنومتر/,'کرنومتر پشتیبان'],[/معما|منطق/,'برگهٔ معمای منطقی در پاکت'],[/میز/,'میز صاف و بی‌لرزش'],[/چسب/,'چسب پهن'],[/کارت/,'کارت‌های چاپی'],[/خط\s*(سبز|زرد|قرمز)/,'نوار چسب سبز، زرد، قرمز برای خط‌ها'],[/خط\s*پایان/,'نوار خط پایان']];
const TECH=[['باتری و کارت حافظهٔ خالی برای همهٔ دوربین‌ها',1],['میکروفون یقه‌ای برای هر بازیکن',0],['نور اصلی + نور پرکننده',1],['لپ‌تاپ اپ + شارژر + بلندگوی صحنه برای صدای داور',1],['کف زدن/سوت اول هر برداشت برای هم‌زمانی صدا و تصویر در کپ‌کات',1]];
function detectProps(){const p=D.P();const found=new Map();const add=(name,qty,per,segId,cat)=>{const k=name;const o=found.get(k)||{name,qty:0,per:false,segs:new Set(),cat};o.qty=Math.max(o.qty,qty||1);o.per=o.per||per;if(segId)o.segs.add(segId);found.set(k,o)};
 p.segments.forEach(s=>{const kit=KITS[s.game];if(kit&&['rules','play','intro'].includes(s.type))kit.forEach(([n,q,per])=>add(n,q,per,s.id,'بازی'));
  const txt=[s.title,s.subtitle,...(s.rules||[]),s.notes,...(s.lines||[]).map(l=>l.text+' '+(l.direction||''))].join(' \n ');
  KEYWORDS.forEach(([re,name])=>{if(re.test(txt)){const m=D.en(txt).match(new RegExp('(\\d+)\\s*'+re.source));add(name,m?+m[1]:1,false,s.id,'بازی')}})});
 (p.brief&&p.brief.directorNotes||[]).forEach(n=>{if(/کاغذ/.test(n))add('کدهای کیف روی کاغذ (نسخهٔ پشتیبان)',1,false,null,'بازی')});
 TECH.forEach(([n,q])=>add(n,q||nP(),false,null,'فنی'));
 try{const c=p.cine;if(c&&c.output&&c.output!=='full')add('پردهٔ کروما (فقط اگر روی صحنه هم کروما می‌گیرید)',1,false,null,'فنی')}catch(e){}
 const d=DIR();let added=0;
 for(const o of found.values()){const qty=o.per?o.qty*nP():o.qty;const ex=d.props.find(x=>x.name===o.name);
  if(ex){ex.segs=[...new Set([...(ex.segs||[]),...o.segs])];if(ex.auto)ex.qty=qty}else{d.props.push({id:D.id(),name:o.name,qty,cat:o.cat,segs:[...o.segs],status:'need',auto:true,per:o.per});added++}}
 D.save();return added}
const ST_NEXT={need:'have',have:'set',set:'need'};const ST_FA={need:'تهیه نشده',have:'تهیه شد',set:'سر صحنه چیده شد'};const ST_CL={need:'red',have:'yel',set:'grn'};
const propsFor=seg=>DIR().props.filter(x=>(x.segs||[]).includes(seg.id));
const segLabel=(s,i)=>`${fa(i+1)} · ${esc(D.typeName(s.type))}${s.title?' · '+esc(s.title):''}`;

/* ================= coverage ================= */
function coverage(){const p=D.P(),d=DIR();let segs=0,segOk=0,sh=0,shOk=0,ln=0,lnOk=0;const miss=[];
 p.segments.forEach((s,i)=>{segs++;const ok=d.seg[s.id]==='ok';if(ok)segOk++;const shots=shotsOf(s);sh+=shots.length;const sd=shots.filter(x=>x.done).length;shOk+=sd;
  const lines=(s.lines||[]).filter(l=>(l.text||'').trim());ln+=lines.length;const ld=lines.filter(l=>d.lines[l.id]==='ok').length;lnOk+=ld;
  const retake=d.seg[s.id]==='retake'||lines.some(l=>d.lines[l.id]==='retake');
  if(!ok||sd<shots.length||retake)miss.push({i,s,ok,shotsLeft:shots.filter(x=>!x.done),linesLeft:lines.filter(l=>d.lines[l.id]!=='ok'),retake})});
 const propsLeft=d.props.filter(x=>x.status!=='set');return{segs,segOk,sh,shOk,ln,lnOk,miss,propsLeft}}

/* ================= drawer UI ================= */
const dr=D.drawer('dir','🎬 دستیار کارگردان سر صحنه',[['plan','برنامهٔ فیلمبرداری'],['props','لوازم'],['cover','چه چیزی جا مانده'],['opt','تنظیمات']]);
let openSeg=null;
dr.render=()=>{const p=D.P();if(!p){dr.body.innerHTML='<p>قسمتی باز نیست.</p>';return}const d=DIR();
 if(dr.tab==='plan'){const cur=D.curIndex();const ps=players();
  dr.body.innerHTML=`<div class="dm5-card"><div class="dm5-row"><b>قانون ۱۸۰ درجه:</b> <span>${ps[0]?esc(ps[0].name)+' همیشه سمت راست قاب':''}${ps[1]?'، '+esc(ps[1].name)+' سمت چپ':''}</span></div><div class="dm5-muted">هم‌جهت با کارت‌های امتیاز روی گرافیک. جای بازیکن‌ها را بین برداشت‌ها عوض نکنید تا در تدوین همه‌چیز جور باشد.</div>
  <div class="dm5-row" style="margin-top:6px"><button class="dm5-btn" data-a="print">🖨 چاپ برنامهٔ فیلمبرداری</button><button class="dm5-btn" data-a="regenAll">↻ پیشنهاد دوباره برای همهٔ نماها</button></div></div>`+
  p.segments.map((s,i)=>{const shots=shotsOf(s);const done=shots.filter(x=>x.done).length;const st=d.seg[s.id];const open=openSeg===s.id||(openSeg==null&&i===cur);const props=propsFor(s);
   return `<div class="dm5-card" data-seg="${s.id}" style="${i===cur?'border-color:#ff3b3b':''}"><div class="dm5-row" data-a="toggle" style="cursor:pointer"><b style="flex:1">${segLabel(s,i)}</b>
   <span class="dm5-pill ${done===shots.length&&shots.length?'grn':'yel'}">نما ${fa(done)}/${fa(shots.length)}</span>${st==='ok'?'<span class="dm5-pill grn">گرفته شد</span>':st==='retake'?'<span class="dm5-pill red">دوباره</span>':''}${props.some(x=>x.status!=='set')?'<span class="dm5-pill red">لوازم</span>':''}</div>
   ${open?`<ul class="dm5-list" style="margin-top:6px">${shots.map(x=>`<li><input type="checkbox" class="dm5-chk" data-shot="${x.id}" ${x.done?'checked':''}><span class="grow"><span class="dm5-pill blu">دوربین ${fa(x.cam)}</span> <b>${esc(x.frame)}</b> · ${esc(x.desc)}</span><button class="dm5-x" data-delshot="${x.id}">✕</button></li>`).join('')}</ul>
   <div class="dm5-row" style="margin-top:4px"><select data-newcam>${d.cams.map(c=>`<option value="${esc(c.id)}">دوربین ${fa(c.id)}</option>`).join('')}</select><input class="dm5-in" data-newshot placeholder="نمای جدید… (مثلاً کلوزآپ ساعت)" style="flex:1"><button class="dm5-btn" data-a="addshot">+ نما</button><button class="dm5-btn" data-a="regen">↻</button></div>
   ${(s.lines||[]).length?`<h4 style="margin-top:8px">دیالوگ‌ها ${s.type==='play'?'<span class="dm5-pill yel">در بازی زنده دستی پخش می‌شوند</span>':''}</h4><ul class="dm5-list">${s.lines.map((l,k)=>`<li><span class="grow">${fa(k+1)}. ${esc(l.text)} <span class="dm5-muted">(${esc(D.emoName(l.emotion))}${l.direction?' · '+esc(l.direction):''})</span></span><button class="dm5-btn ${d.lines[l.id]==='ok'?'ok':''}" data-line="${l.id}" data-v="ok">✓</button><button class="dm5-btn ${d.lines[l.id]==='retake'?'warn':''}" data-line="${l.id}" data-v="retake">↺</button></li>`).join('')}</ul>`:''}
   ${props.length?`<h4 style="margin-top:8px">لوازم این مرحله</h4>${props.map(x=>`<span class="dm5-pill ${ST_CL[x.status]}" data-prop="${x.id}" style="cursor:pointer;margin:2px">${esc(x.name)} ×${fa(x.qty)}</span>`).join('')}`:''}
   <textarea data-note placeholder="یادداشت کارگردان برای این مرحله (سر صحنه نمایش داده می‌شود)" style="min-height:50px;margin-top:8px">${esc(d.notes[s.id]||s.notes||'')}</textarea>
   <div class="dm5-row"><button class="dm5-btn ok" data-segst="ok">✓ این مرحله کامل گرفته شد</button><button class="dm5-btn warn" data-segst="retake">↺ دوباره بگیریم</button><button class="dm5-btn" data-segst="">پاک</button></div>`:''}</div>`}).join('')}
 else if(dr.tab==='props'){const groups={};d.props.forEach(x=>(groups[x.cat||'بازی']=groups[x.cat||'بازی']||[]).push(x));const cnt=k=>d.props.filter(x=>x.status===k).length;
  dr.body.innerHTML=`<div class="dm5-card"><div class="dm5-row"><button class="dm5-btn pri" data-a="detect">🔍 تشخیص خودکار لوازم از فیلمنامه</button><button class="dm5-btn" data-a="csv">خروجی CSV</button><button class="dm5-btn" data-a="print">🖨 چاپ</button></div>
  <div class="dm5-muted">روی وضعیت هر وسیله بزنید: <span class="dm5-pill red">تهیه نشده</span> ← <span class="dm5-pill yel">تهیه شد</span> ← <span class="dm5-pill grn">سر صحنه چیده شد</span>. تشخیص خودکار فقط پیشنهاد است؛ تعداد را خودتان تأیید کنید.</div>
  <div class="dm5-row" style="margin-top:6px"><span class="dm5-pill red">${fa(cnt('need'))} تهیه نشده</span><span class="dm5-pill yel">${fa(cnt('have'))} تهیه شد</span><span class="dm5-pill grn">${fa(cnt('set'))} چیده شد</span></div>
  <div class="dm5-row" style="margin-top:6px"><input class="dm5-in" data-newprop placeholder="وسیلهٔ جدید" style="flex:1"><input class="dm5-in" data-newqty type="number" min="1" value="1" style="width:60px"><button class="dm5-btn" data-a="addprop">+ افزودن</button></div></div>`+
  (d.props.length?Object.entries(groups).map(([g,arr])=>`<div class="dm5-card"><h4>${esc(g)}</h4><ul class="dm5-list">${arr.map(x=>`<li><span class="grow"><b>${esc(x.name)}</b> <span class="dm5-muted">×${fa(x.qty)}${x.per?' (برای هر بازیکن)':''}${(x.segs||[]).length?' · مراحل '+x.segs.map(id=>fa(p.segments.findIndex(s=>s.id===id)+1)).filter(v=>v!=='۰').join('، '):''}</span></span>
   <input class="dm5-in" type="number" min="0" value="${x.qty}" data-qty="${x.id}" style="width:56px"><button class="dm5-btn" data-prop="${x.id}"><span class="dm5-pill ${ST_CL[x.status]}">${ST_FA[x.status]}</span></button><button class="dm5-x" data-delprop="${x.id}">✕</button></li>`).join('')}</ul></div>`).join(''):'<p class="dm5-muted">هنوز لیستی نیست. «تشخیص خودکار» را بزنید.</p>')}
 else if(dr.tab==='cover'){const c=coverage();const pc=(a,b)=>b?Math.round(a/b*100):100;
  dr.body.innerHTML=`<div class="dm5-card"><h4>پیشرفت فیلمبرداری</h4>
  <div>مراحل: ${fa(c.segOk)}/${fa(c.segs)}</div><div class="dm5-bar"><i style="width:${pc(c.segOk,c.segs)}%"></i></div>
  <div>نماها: ${fa(c.shOk)}/${fa(c.sh)}</div><div class="dm5-bar"><i style="width:${pc(c.shOk,c.sh)}%"></i></div>
  <div>دیالوگ‌ها: ${fa(c.lnOk)}/${fa(c.ln)}</div><div class="dm5-bar"><i style="width:${pc(c.lnOk,c.ln)}%"></i></div>
  <div>لوازم چیده‌نشده: ${fa(c.propsLeft.length)}</div></div>`+
  (c.miss.length?c.miss.map(m=>`<div class="dm5-card" style="${m.retake?'border-color:#b45309':''}"><h4>${segLabel(m.s,m.i)} ${m.retake?'<span class="dm5-pill red">نیاز به برداشت دوباره</span>':''}</h4>
   ${m.shotsLeft.length?`<div><b>نماهای باقی‌مانده:</b> ${m.shotsLeft.map(x=>`دوربین ${fa(x.cam)}: ${esc(x.frame)}`).join(' · ')}</div>`:''}
   ${m.linesLeft.length?`<div><b>دیالوگ‌های تأییدنشده:</b> ${fa(m.linesLeft.length)}</div>`:''}${!m.ok?'<div class="dm5-muted">این مرحله هنوز «کامل گرفته شد» نخورده.</div>':''}
   <button class="dm5-btn" data-goto="${m.i}">رفتن به این مرحله</button></div>`).join(''):'<div class="dm5-card"><b>همه‌چیز گرفته شده ✓</b></div>')+
  (c.propsLeft.length?`<div class="dm5-card"><h4>لوازمی که هنوز سر صحنه نیستند</h4>${c.propsLeft.map(x=>`<span class="dm5-pill ${ST_CL[x.status]}" style="margin:2px">${esc(x.name)} ×${fa(x.qty)}</span>`).join('')}</div>`:'')}
 else{dr.body.innerHTML=`<div class="dm5-card"><label class="dm5-row"><input type="checkbox" class="dm5-chk" data-opt="hud" ${d.opt.hud?'checked':''}> کارت راهنمای زنده کنار صفحه (داخل ویدیو ضبط نمی‌شود)</label>
  <label class="dm5-row"><input type="checkbox" class="dm5-chk" data-opt="ahead" ${d.opt.ahead?'checked':''}> یادآوری مرحلهٔ بعد و لوازم آن</label>
  <label class="dm5-row"><input type="checkbox" class="dm5-chk" data-opt="speak" ${d.opt.speak?'checked':''}> یادآوری صوتی با صدای دستگاه (فقط با هدفون؛ داخل فایل ویدیو نمی‌رود ولی میکروفون دوربین آن را می‌شنود)</label></div>
  <div class="dm5-card"><h4>دوربین‌ها</h4>${d.cams.map((c,i)=>`<div class="dm5-row"><span class="dm5-pill blu">دوربین ${fa(c.id)}</span><input class="dm5-in" data-cam="${i}" value="${esc(c.name)}" style="flex:1"></div>`).join('')}
  <button class="dm5-btn" data-a="addcam">+ دوربین</button></div>`}};
function segEl(e){const c=e.target.closest('[data-seg]');const p=D.P();return c?p.segments.find(s=>s.id===c.dataset.seg):null}
dr.el.addEventListener('click',e=>{const d=DIR(),p=D.P();const t=e.target;const a=t.closest('[data-a]');const s=segEl(e);
 if(a){const k=a.dataset.a;
  if(k==='toggle'){openSeg=openSeg===s.id?'-':s.id}
  else if(k==='addshot'){const card=a.closest('[data-seg]');const txt=card.querySelector('[data-newshot]').value.trim();if(!txt)return;shotsOf(s).push({id:D.id(),cam:card.querySelector('[data-newcam]').value,frame:'نمای من',desc:txt,done:false,auto:false})}
  else if(k==='regen')regenShots(s);
  else if(k==='regenAll')p.segments.forEach(regenShots);
  else if(k==='detect'){const n=detectProps();D.toast(n?`${fa(n)} وسیلهٔ جدید پیدا شد`:'وسیلهٔ جدیدی پیدا نشد؛ لیست به‌روز شد')}
  else if(k==='addprop'){const n=dr.body.querySelector('[data-newprop]').value.trim();if(!n)return;d.props.push({id:D.id(),name:n,qty:+dr.body.querySelector('[data-newqty]').value||1,cat:'دستی',segs:s?[s.id]:[],status:'need',auto:false})}
  else if(k==='csv'){const rows=[['وسیله','تعداد','وضعیت','مراحل']].concat(d.props.map(x=>[x.name,x.qty,ST_FA[x.status],(x.segs||[]).map(id=>p.segments.findIndex(s2=>s2.id===id)+1).join(' ')]));const csv='\ufeff'+rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');try{download(new Blob([csv],{type:'text/csv'}),'props-'+(p.name||'episode')+'.csv')}catch(err){}return}
  else if(k==='print'){printSheet();return}
  else if(k==='addcam'){d.cams.push({id:String(d.cams.length+1),name:'دوربین جدید'})}
  D.save();dr.render();return}
 if(t.dataset.shot){const x=shotsOf(s).find(o=>o.id===t.dataset.shot);if(x){x.done=t.checked;D.save();refreshHud()}return}
 if(t.dataset.delshot){const arr=shotsOf(s);const i=arr.findIndex(o=>o.id===t.dataset.delshot);if(i>=0)arr.splice(i,1);D.save();dr.render();return}
 const lb=t.closest('[data-line]');if(lb){const id=lb.dataset.line,v=lb.dataset.v;d.lines[id]=d.lines[id]===v?'':v;D.save();dr.render();refreshHud();return}
 const pb=t.closest('[data-prop]');if(pb){const x=d.props.find(o=>o.id===pb.dataset.prop);if(x){x.status=ST_NEXT[x.status]||'need';D.save();dr.render();refreshHud()}return}
 if(t.dataset.delprop){d.props=d.props.filter(o=>o.id!==t.dataset.delprop);D.save();dr.render();return}
 const sb=t.closest('[data-segst]');if(sb){d.seg[s.id]=sb.dataset.segst;D.save();dr.render();refreshHud();return}
 const gb=t.closest('[data-goto]');if(gb){try{st.sel=+gb.dataset.goto;renderROS();renderInspector();renderGameDeck&&renderGameDeck()}catch(err){}openSeg=null;dr.tab='plan';dr.el.querySelectorAll('.dm5-tabs button').forEach(x=>x.classList.toggle('on',x.dataset.tab==='plan'));dr.render()}});
dr.el.addEventListener('change',e=>{const d=DIR(),t=e.target;
 if(t.dataset.note!==undefined){const s=segEl(e);d.notes[s.id]=t.value;D.save();return}
 if(t.dataset.qty){const x=d.props.find(o=>o.id===t.dataset.qty);if(x){x.qty=Math.max(0,+t.value||0);x.auto=false;D.save()}return}
 if(t.dataset.opt){d.opt[t.dataset.opt]=t.checked;D.save();refreshHud();return}
 if(t.dataset.cam){d.cams[+t.dataset.cam].name=t.value;D.save()}});

/* ================= printable call sheet ================= */
function printSheet(){const p=D.P(),d=DIR();const w=window.open('','dm5-print');if(!w){D.toast('اجازهٔ باز شدن پنجره را بدهید');return}
 const rows=p.segments.map((s,i)=>`<section><h2>${segLabel(s,i)}</h2>${d.notes[s.id]||s.notes?`<p class="n">📝 ${esc(d.notes[s.id]||s.notes)}</p>`:''}
 <table><tr><th>☐</th><th>دوربین</th><th>نما</th><th>توضیح</th></tr>${shotsOf(s).map(x=>`<tr><td>☐</td><td>${fa(x.cam)}</td><td>${esc(x.frame)}</td><td>${esc(x.desc)}</td></tr>`).join('')}</table>
 ${(s.lines||[]).length?`<ol>${s.lines.map(l=>`<li>${esc(l.text)} <i>(${esc(D.emoName(l.emotion))})</i></li>`).join('')}</ol>`:''}
 ${propsFor(s).length?`<p><b>لوازم:</b> ${propsFor(s).map(x=>esc(x.name)+' ×'+fa(x.qty)).join('، ')}</p>`:''}</section>`).join('');
 w.document.write(`<!doctype html><html dir="rtl" lang="fa"><head><meta charset="utf-8"><title>برنامهٔ فیلمبرداری · ${esc(p.name)}</title><style>body{font:13px/1.7 Vazirmatn,Tahoma;margin:24px}h1{font-size:20px}h2{font-size:15px;margin:18px 0 4px;border-bottom:2px solid #000}table{border-collapse:collapse;width:100%}td,th{border:1px solid #999;padding:3px 6px;text-align:right}.n{background:#f4f4f4;padding:4px 8px}section{page-break-inside:avoid}</style></head><body>
 <h1>برنامهٔ فیلمبرداری · ${esc(p.name)}</h1><p><b>لوازم کل:</b> ${d.props.map(x=>'☐ '+esc(x.name)+' ×'+fa(x.qty)).join(' &nbsp; ')}</p>${rows}<script>setTimeout(()=>print(),400)<\/script></body></html>`);w.document.close()}

/* ================= live HUD ================= */
let hudSeg=-1,lastWarn='';
function speak(txt){const d=DIR();if(!d.opt.speak||!window.speechSynthesis)return;try{const u=new SpeechSynthesisUtterance(txt);u.lang='fa-IR';u.rate=1.1;speechSynthesis.speak(u)}catch(e){}}
function hudHtml(i){const p=D.P(),d=DIR();const s=p.segments[i];if(!s)return '';const nx=p.segments[i+1];const shots=shotsOf(s);const props=propsFor(s);const bad=props.filter(x=>x.status!=='set');
 const stt=D.st();let lineNow='',lineNext='';try{if(stt.line)lineNow=stt.line.text;const k=stt.lineK+(stt.line?1:0);if(s.lines&&s.lines[k]&&s.type!=='play')lineNext=s.lines[k].text}catch(e){}
 let timerTip='';try{if(s.type==='play'&&stt.timer){const r=Math.ceil(stt.timer.remain);if(r<=10&&r>0)timerTip=`<div class="alert flash">⏱ ${fa(r)} ثانیه مانده: دوربین واکنش آماده</div>`;else if(r===0)timerTip='<div class="alert">⏹ وقت تمام شد: نمای واکنش و نتیجه را بگیرید</div>'}}catch(e){}
 return `<h5 class="drag">🎬 مرحلهٔ ${fa(i+1)} از ${fa(p.segments.length)} <span class="dm5-pill">${esc(D.typeName(s.type))}</span><span style="flex:1"></span><button class="dm5-x" data-h="close">✕</button></h5>
 <div class="big">${esc(s.title||'')}</div>${bad.length?`<div class="alert">⚠ لوازم این مرحله هنوز چیده نشده: ${bad.map(x=>esc(x.name)).join('، ')}</div>`:''}${timerTip}
 ${d.notes[s.id]||s.notes?`<div>📝 ${esc(d.notes[s.id]||s.notes)}</div>`:''}
 <ul class="dm5-list">${shots.map(x=>`<li><input type="checkbox" class="dm5-chk" data-hs="${x.id}" ${x.done?'checked':''}><span class="grow"><b>دوربین ${fa(x.cam)}</b> · ${esc(x.frame)}: ${esc(x.desc)}</span></li>`).join('')}</ul>
 ${lineNow?`<div>🔊 الان: «${esc(lineNow)}»</div>`:''}${lineNext?`<div class="dm5-muted">بعدی: «${esc(lineNext)}»</div>`:''}
 ${s.type==='play'&&(s.lines||[]).length?`<div class="dm5-muted">دیالوگ‌های این بازی دستی‌اند: ${s.lines.map(l=>'«'+esc(l.text)+'»').join(' ')}</div>`:''}
 <div class="dm5-row" style="margin-top:6px"><button class="dm5-btn ok" data-h="ok">✓ گرفته شد</button><button class="dm5-btn warn" data-h="retake">↺ دوباره</button></div>
 ${d.opt.ahead&&nx?`<div class="next"><b>آماده کنید · مرحلهٔ ${fa(i+2)}:</b> ${esc(D.typeName(nx.type))} ${esc(nx.title||'')}<br>${shotsOf(nx).slice(0,3).map(x=>'دوربین '+fa(x.cam)+': '+esc(x.frame)).join(' · ')}${propsFor(nx).filter(x=>x.status!=='set').length?`<br>⚠ لوازم: ${propsFor(nx).filter(x=>x.status!=='set').map(x=>esc(x.name)).join('، ')}`:''}</div>`:''}`}
function refreshHud(){const d=D.P()&&DIR();if(!d)return;if(!d.opt.hud){D.hud.hide();return}const stt=D.st();if(!stt||stt.live<0){if(hudSeg!==-1){hudSeg=-1;D.hud.hide()}return}D.hud.show(hudHtml(stt.live))}
D.hud.el.addEventListener('click',e=>{const d=DIR(),p=D.P(),stt=D.st();const s=p.segments[stt.live];if(!s)return;const h=e.target.dataset.h;
 if(e.target.dataset.hs){const x=shotsOf(s).find(o=>o.id===e.target.dataset.hs);if(x){x.done=e.target.checked;D.save()}return}
 if(h==='close'){d.opt.hud=false;D.save();D.hud.hide();D.toast('راهنمای زنده خاموش شد (از دستیار کارگردان › تنظیمات روشن کنید)');return}
 if(h==='ok'||h==='retake'){d.seg[s.id]=h;D.save();refreshHud();dr.isOpen()&&dr.render()}});
D.on('live',i=>{const p=D.P();if(!p)return;hudSeg=i;const s=p.segments[i];refreshHud();const bad=propsFor(s).filter(x=>x.status!=='set');
 if(bad.length)speak('لوازم آماده نیست: '+bad.map(x=>x.name).join('، '));const nx=p.segments[i+1];if(nx&&DIR().opt.ahead){const sh=shotsOf(nx)[0];if(sh)setTimeout(()=>speak('مرحلهٔ بعد: '+(nx.title||D.typeName(nx.type))),1500)}});
let hudTick=0;setInterval(()=>{const stt=D.st();if(!stt||stt.live<0){if(hudSeg!==-1){hudSeg=-1;D.hud.hide()}return}
 const key=stt.live+'|'+(stt.line&&stt.line.id)+'|'+(stt.timer?Math.ceil(stt.timer.remain):'');if(key!==lastWarn){lastWarn=key;refreshHud()}},300);

D.dockButton('dir','🎬 کارگردان',()=>dr.toggle());
D.director={detectProps,coverage,autoShots,shotsOf,parseCamNotes,refreshHud,printSheet};
})();
