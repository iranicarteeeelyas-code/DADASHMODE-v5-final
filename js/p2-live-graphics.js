/* DADASHMODE v5 · Phase 2 · Live, result-driven show graphics + adjustable playback speed
   Additive module: nothing from v4 is removed. Load AFTER vfx4.js/control4.js (and persist5.js if installed).
   1) SPEED: every segment (and the whole episode) has its own playback speed 0.25x..2x. Animations, lead-ins and gaps
      between lines slow down / speed up; recorded voices keep natural pitch; the live game timer always stays real-time.
   2) LIVE STORY ENGINE: reads the real append-only journal (real seconds, real scores, real champion) and reacts:
      lead change, tie, comeback, blowout, photo-finish, big gain, steal, streak, bank empty, timer out, VAR overturn,
      last-5-seconds hurry. Every situation gets its own cinematic banner + VFX + SFX, drawn on the canvas (so it is recorded).
   3) REAL RESULT SCENES: bank & winner segments get a live stats card built from actual data (final banks, margin,
      rounds won, biggest swing, lead changes, comeback). Ties are shown as ties, never as a fake winner.
   4) CONDITIONAL DIALOGUE: any line can be set to play only when a condition is true
      (winner = X, tie, close finish, blowout, comeback, leader = X). Record one variant per outcome; the app picks the true one.
   Nothing here can change a score: it only reads the journal. */
'use strict';
(function(){
const L5={ev:[],cur:null,lastKey:'',prevLeader:undefined,prevTie:false,streak:{},timerWasRunning:false,hurryShown:-1,lastSeg:-1,frameId:0,drawn:-1};
const SPEEDS=[.25,.5,.75,1,1.25,1.5,2];
const cfg=()=>{if(!P.live5)P.live5={banners:true,stats:true,sfx:true,speed:1};return P.live5};
const nowS=()=>performance.now()/1000;
const sfx=(n,...a)=>{try{if(cfg().sfx&&AE.ctx&&typeof AE[n]==='function')AE[n](...a)}catch(e){}};
const vfx=(f,...a)=>{try{typeof window[f]==='function'&&window[f](...a)}catch(e){}};
const name=id=>{const p=pl(id);return p?p.name:''};
const col=id=>{const p=pl(id);return p?p.color:TH().accent};

/* ================= 1. SPEED ================= */
function segSpeed(){const s=P&&P.segments[st.live];if(!s)return 1;if(s.type==='play')return 1;/* live play is real time */
 const v=+(s.speed||0)||+(cfg().speed||1)||1;return cl(v,.25,2)}
(function hookSpeed(){let vt=st.vt||0;Object.defineProperty(st,'vt',{configurable:true,enumerable:true,
 get(){return vt},set(n){const d=n-vt;/* frame() advances by at most 0.1s per tick: scale only those ticks */
  if(d>0&&d<=.1001)vt+=d*segSpeed();else vt=n}})})();

/* ================= 2. LIVE STORY ENGINE (pure, read-only) ================= */
function replay(){const u=undoneSet();const bank={};P.players.forEach(p=>bank[p.id]=P.startBank);const hist=[];let leadChanges=0,prevLead=null;const won={},best={},minDiff={};
 P.players.forEach(p=>{won[p.id]=0;best[p.id]=0;minDiff[p.id]=0});
 for(const e of G().journal){if(e.kind==='undo'||u.has(e.id)||!e.player||!(e.player in bank))continue;bank[e.player]=Math.max(0,bank[e.player]+e.delta);
  if(e.delta>0){if(/^برد|موفق/.test(e.reason||''))won[e.player]++;best[e.player]=Math.max(best[e.player],e.delta)}
  const s=[...P.players].sort((a,b)=>bank[b.id]-bank[a.id]);const tie=s.length>1&&bank[s[0].id]===bank[s[1].id];const lead=tie?null:s[0].id;
  if(lead&&prevLead&&lead!==prevLead)leadChanges++;if(lead)prevLead=lead;
  P.players.forEach(p=>{const others=P.players.filter(q=>q.id!==p.id).map(q=>bank[q.id]);if(others.length)minDiff[p.id]=Math.min(minDiff[p.id],bank[p.id]-Math.max(...others))});
  hist.push({...bank})}
 return {bank,hist,leadChanges,won,best,minDiff}}
function situation(){const r=replay();const s=[...P.players].sort((a,b)=>r.bank[b.id]-r.bank[a.id]);if(!s.length)return {r};
 const first=s[0],second=s[1];const margin=second?r.bank[first.id]-r.bank[second.id]:0;const tie=!!second&&margin===0;
 const champ=G().champion&&pl(G().champion)?G().champion:null;const winner=champ||(tie?null:first.id);
 const comeback=!!winner&&r.minDiff[winner]<=-15;
 return {r,first:first.id,second:second&&second.id,margin,tie,winner,champ,comeback,close:!tie&&margin>0&&margin<=5,blowout:margin>=30}}
function condOk(when){if(!when||when==='always')return true;const s=situation();const [k,v]=String(when).split(':');
 if(k==='win')return s.winner===v;if(k==='leader')return !s.tie&&s.first===v;if(k==='tie')return s.tie;if(k==='close')return s.close;
 if(k==='blowout')return s.blowout;if(k==='comeback')return s.comeback;if(k==='notie')return !s.tie;return true}

/* ---------- event detection (runs after every real score change) ---------- */
function push(kind,title,sub,c,o={}){if(!cfg().banners)return;L5.ev.push({kind,title,sub:sub||'',col:c||TH().accent2,dur:o.dur||2.6,prio:o.prio||1});if(L5.ev.length>6)L5.ev.sort((a,b)=>b.prio-a.prio).splice(6)}
function analyse(ev){if(!ev||!ev.player)return;const s=situation();const pid=ev.player,d=ev.delta;const opp=P.players.find(p=>p.id!==pid);
 L5.streak[pid]=d>0?(L5.streak[pid]||0)+1:0;if(d>0&&opp)L5.streak[opp.id]=0;
 const lead=s.tie?null:s.first;
 if(s.tie&&!L5.prevTie&&G().journal.length>1){push('tie','تساوی!',`${fa(s.r.bank[s.first])} ${P.unit} · ${fa(s.r.bank[s.first])} ${P.unit}`,TH().accent2,{prio:3});sfx('hit');vfx('vfxFlash','#ffffff',.35,.3)}
 else if(lead&&L5.prevLeader&&lead!==L5.prevLeader&&!(s.r.minDiff[lead]<=-15)){push('lead',`${name(lead)} جلو افتاد!`,`اختلاف ${fa(s.margin)} ${P.unit}`,col(lead),{prio:3});sfx('sweepUp');vfx('vfxShake',14,.4)}
 if(d>=15&&ev.kind==='score'&&!/دزدی/.test(ev.reason||''))push('big',`+${fa(d)} ${P.unit}`,`${name(pid)} · ${ev.reason||''}`,col(pid),{prio:2});
 if(/دزدی/.test(ev.reason||'')&&d>0)push('steal','دزدی!',`${name(pid)} ${fa(d)} ${P.unit} از حریف گرفت`,'#ff4d4d',{prio:3});
 if(L5.streak[pid]===3)push('streak',`${name(pid)} داغ کرده!`,'سه امتیاز پشت سر هم',col(pid),{prio:2});
 if(d<0&&s.r.bank[pid]===0)push('empty',`بانک ${name(pid)} خالی شد!`,'صفر ثانیه',"#ff2d2d",{prio:3});
 if(!s.tie&&s.blowout&&!L5.blowShown){L5.blowShown=true;push('blowout','فاصلهٔ سنگین',`${name(s.first)} ${fa(s.margin)} ${P.unit} جلوتر`,col(s.first),{prio:1})}
 if(!s.blowout)L5.blowShown=false;
 if(lead&&s.r.minDiff[lead]<=-15&&L5.prevLeader&&lead!==L5.prevLeader)push('comeback','بازگشت بزرگ!',`${name(lead)} از ${fa(-s.r.minDiff[lead])} ${P.unit} عقب برگشت`,col(lead),{prio:4,dur:3.2});
 L5.prevLeader=lead||L5.prevLeader;L5.prevTie=s.tie}
function hookAward(){if(typeof award!=='function'||award.__l5)return;const prev=award;const w=function(){const ev=prev.apply(this,arguments);try{if(ev&&ev.id)analyse(ev)}catch(e){console.warn(e)}return ev};w.__l5=true;award=w}
function hookUndo(){if(typeof undoLast!=='function'||undoLast.__l5)return;const prev=undoLast;const w=function(){const wasVar=G().var;const r=prev.apply(this,arguments);if(wasVar||G().journal.slice(-3).some(e=>e.kind==='var-off'))push('var','VAR: تصمیم برگشت','امتیاز اصلاح شد','#00c8ff',{prio:3});const s=situation();L5.prevLeader=s.tie?L5.prevLeader:s.first;L5.prevTie=s.tie;return r};w.__l5=true;undoLast=w}
function watchTimer(){const seg=P.segments[st.live];if(!seg||seg.type!=='play'){L5.timerWasRunning=false;return}const T=st.timer;
 if(T.running&&T.remain<=5.05&&T.remain>0&&L5.hurryShown!==st.live&&T.total>8){L5.hurryShown=st.live;push('hurry','۵ ثانیهٔ آخر!','',"#ffb020",{prio:2,dur:1.6})}
 if(L5.timerWasRunning&&!T.running&&T.remain<=0){push('timeout','وقت تمام!',seg.title||'',"#ff2d2d",{prio:4,dur:2.2});vfx('vfxShake',20,.5);vfx('vfxFlash','#ff1a1a',.3,.35)}
 L5.timerWasRunning=T.running}

/* ================= 3. DRAWING ================= */
function banner(e,t){const th=TH();const a=e.dur;const kin=eo(ph(t,0,.35)),kout=1-eo(ph(t,a-.35,.35));const k=Math.min(kin,kout);if(k<=0)return;
 g.save();g.translate(960,330);g.rotate(-.035);
 /* glass band with accent edges */
 const w=1500*kin,h=190;g.globalAlpha=k;const gr=g.createLinearGradient(-w/2,0,w/2,0);gr.addColorStop(0,hexA(th.bg1,.0));gr.addColorStop(.12,hexA(th.bg1,.88));gr.addColorStop(.88,hexA(th.bg1,.88));gr.addColorStop(1,hexA(th.bg1,0));
 g.fillStyle=gr;g.fillRect(-w/2,-h/2,w,h);g.fillStyle=e.col;g.fillRect(-w/2,-h/2-8,w,8);g.fillRect(-w/2,h/2,w,8);
 /* light sweep */
 const sx=-900+ph(t,.15,.9)*1800;g.save();g.globalCompositeOperation='lighter';const lg=g.createLinearGradient(sx-160,0,sx+160,0);lg.addColorStop(0,'rgba(255,255,255,0)');lg.addColorStop(.5,hexA('#ffffff',.22));lg.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=lg;g.fillRect(-w/2,-h/2,w,h);g.restore();
 const pop=1.35-.35*eo(ph(t,.05,.4));g.save();g.scale(pop,pop);bigText(e.title,0,-18,fit(e.title,1250,110),{fill:th.ink,glow:hexA(e.col,.7),alpha:k});g.restore();
 if(e.sub){g.font=UF(38,800);g.direction='rtl';g.textAlign='center';g.textBaseline='middle';g.fillStyle=hexA(th.ink,.9*k);g.fillText(e.sub,0,62)}
 g.restore();
 if(!e.fx){e.fx=true;vfx('vfxBurst',960,330,e.col,70,.9);({lead:()=>sfx('whoosh'),comeback:()=>{sfx('boom');sfx('fanfare')},tie:()=>sfx('hit'),steal:()=>sfx('hit'),big:()=>sfx('coin'),streak:()=>sfx('sweepUp'),empty:()=>sfx('lose'),timeout:()=>sfx('boom'),hurry:()=>{},var:()=>sfx('whistle'),blowout:()=>sfx('whoosh')}[e.kind]||(()=>{}))()}}
function drawBanners(){if(!L5.cur&&L5.ev.length){L5.ev.sort((a,b)=>b.prio-a.prio);L5.cur=L5.ev.shift();L5.cur.t0=nowS()}
 if(L5.cur){const t=nowS()-L5.cur.t0;if(t>L5.cur.dur){L5.cur=null;return}banner(L5.cur,t)}}
/* live momentum strip during play/bank: who leads and by how much, from real data */
function drawMomentum(seg){if(!cfg().banners||P.players.length<2)return;const s=situation();const th=TH();const W=620,x=960-W/2,y=P.layout.score==='top'?210:1080-210;
 const a=s.r.bank[P.players[0].id],b=s.r.bank[P.players[1].id];const tot=Math.max(1,a+b);const k=a/tot;
 g.save();g.globalAlpha=.92;rr(x,y-14,W,28,14);g.fillStyle=hexA(th.bg1,.7);g.fill();
 g.save();rr(x,y-14,W,28,14);g.clip();g.fillStyle=P.players[0].color;g.fillRect(x+W*(1-k),y-14,W*k,28);g.fillStyle=P.players[1].color;g.fillRect(x,y-14,W*(1-k),28);g.restore();
 g.fillStyle='#fff';g.fillRect(x+W*(1-k)-2,y-20,4,40);
 const label=s.tie?'تساوی':`${name(s.first)} +${fa(s.margin)}`;chip(label,960,y+(P.layout.score==='top'?38:-38),24,s.tie?th.accent2:col(s.first),'#111',.95);g.restore()}
/* real stats card for bank & winner segments */
function drawStats(seg,t){if(!cfg().stats||seg.statsCard===false)return;const s=situation();if(!s.first)return;const th=TH();
 const delay=seg.type==='winner'?4.2:1.4;const k=eo(ph(t,delay,.7));if(k<=0)return;
 const W=1180,H=230,x=960-W/2,y=(seg.type==='winner'?1080-120-H:1080-300-H)+(1-k)*80;
 g.save();g.globalAlpha=k;panel(x,y,W,H,34,hexA(th.bg1,.86),hexA(th.accent2,.55));
 const title=seg.type!=='winner'?'وضعیت واقعی بانک زمان':s.tie?'نتیجه: تساوی':`قهرمان: ${name(s.winner)}`;
 g.font=F(50);g.direction='rtl';g.textAlign='center';g.textBaseline='middle';g.fillStyle=s.tie?th.accent2:col(s.winner||s.first);g.fillText(title,960,y+46);
 const ps=P.players.slice(0,4);const cw=W/ps.length;
 ps.forEach((p,i)=>{const cx=x+W-cw*(i+.5);g.font=F(64);g.fillStyle=p.color;g.fillText(fa(s.r.bank[p.id])+' '+P.unit,cx,y+118);
  g.font=UF(26,800);g.fillStyle=hexA(th.ink,.85);g.fillText(`${p.name} · ${fa(s.r.won[p.id]||0)} برد · بهترین +${fa(s.r.best[p.id]||0)}`,cx,y+178)});
 const facts=[];if(!s.tie)facts.push(`اختلاف ${fa(s.margin)} ${P.unit}`);if(s.r.leadChanges)facts.push(`${fa(s.r.leadChanges)} بار جابه‌جایی صدر`);if(s.comeback)facts.push('بازگشت از عقب');if(s.close)facts.push('نفس‌گیر تا لحظهٔ آخر');if(s.blowout)facts.push('برتری قاطع');
 if(facts.length){g.font=UF(24,700);g.fillStyle=hexA(th.ink,.7);g.fillText(facts.join('  ✦  '),960,y+H-14)}
 g.restore();
 if(seg.type==='winner'&&!seg.__l5fx&&k>=1){seg.__l5fx=st.token;if(s.tie){push('tie','تساوی کامل!','تای‌بریک یا VAR',th.accent2,{prio:5,dur:3})}else if(s.comeback)push('comeback','قهرمانی با بازگشت!',name(s.winner),col(s.winner),{prio:5,dur:3});else if(s.close)push('close','با اختلاف '+fa(s.margin)+' '+P.unit+'!','نفس‌گیرترین پایان',col(s.winner),{prio:5,dur:3})}}
function overlay(){const s=cv.width/1920;g.setTransform(s,0,0,s,0,0);const seg=P.segments[st.live];
 if(st.live!==L5.lastSeg){L5.lastSeg=st.live;if(seg)delete seg.__l5fx}
 watchTimer();
 if(seg&&st.live>=0){const t=st.vt-st.segT0;if(seg.type==='play'&&seg.game!=='vault')drawMomentum(seg);if(seg.type==='bank'||seg.type==='winner')drawStats(seg,t)}
 drawBanners();
 /* speed tag (control-room only hint when not 1x; hidden while recording) */
 const sp=segSpeed();if(sp!==1&&!st.rec&&st.live>=0){chip(`سرعت ${fa(sp)}×`,1920-150,1080-40,22,'#111','#ffd23f',.8)}}
(function hookDraw(){const prev=draw;draw=function(){prev();try{overlay()}catch(e){console.warn('live5',e)}}})();

/* ================= 4. CONDITIONAL DIALOGUE ================= */
(function hookSpeak(){if(typeof speakLine!=='function')return;const prev=speakLine;speakLine=function(ln,tok,after){if(ln&&ln.when&&!condOk(ln.when)){after&&after();return}return prev.apply(this,arguments)}})();

/* ================= 5. INSPECTOR UI ================= */
function condOptions(cur){const o=[['always','همیشه'],['tie','فقط اگر تساوی'],['notie','فقط اگر تساوی نیست'],['close','فقط اگر اختلاف ≤ ۵'],['blowout','فقط اگر اختلاف ≥ ۳۰'],['comeback','فقط اگر بازگشت از عقب']];
 P.players.forEach(p=>{o.push(['win:'+p.id,'فقط اگر قهرمان = '+p.name]);o.push(['leader:'+p.id,'فقط اگر پیشتاز = '+p.name])});
 return o.map(([v,l])=>`<option value="${esc(v)}"${(cur||'always')===v?' selected':''}>${esc(l)}</option>`).join('')}
function spOpts(cur,withInherit){return (withInherit?[`<option value=""${!cur?' selected':''}>مثل کل قسمت</option>`]:[]).concat(SPEEDS.map(v=>`<option value="${v}"${+cur===v?' selected':''}>${fa(v)}×${v<1?' (آهسته)':v>1?' (سریع)':''}</option>`)).join('')}
if(typeof renderInspector==='function'){const prev=renderInspector;renderInspector=function(){prev();const s=P.segments[st.sel];const el=document.getElementById('insp');if(!s||!el)return;
 const box=document.createElement('div');box.className='v4box l5box';box.style.cssText='border:1px solid #ffffff22;border-radius:12px;padding:10px 12px;margin:10px 0;background:#ffffff08';
 box.innerHTML=`<b>⚡ سرعت پخش و گرافیک زنده</b>
 <label style="display:block;margin-top:6px">سرعت این مرحله ${s.type==='play'?'<small>(بازی زنده همیشه با زمان واقعی است؛ فقط برای مراحل غیر بازی)</small>':''}<select data-l5="speed">${spOpts(s.speed,true)}</select></label>
 <label style="display:block">سرعت کل قسمت <select data-l5="gspeed">${spOpts(cfg().speed||1,false)}</select></label>
 <label style="display:block"><input type="checkbox" data-l5="banners" ${cfg().banners?'checked':''}> بنرهای خودکار رویدادها (جابه‌جایی صدر، تساوی، بازگشت، دزدی، وقت تمام...)</label>
 <label style="display:block"><input type="checkbox" data-l5="stats" ${cfg().stats?'checked':''}> کارت آمار واقعی در «بانک» و «اعلام برنده»</label>
 ${['bank','winner'].includes(s.type)?`<label style="display:block"><input type="checkbox" data-l5="segstats" ${s.statsCard!==false?'checked':''}> کارت آمار در همین مرحله</label>`:''}
 <label style="display:block"><input type="checkbox" data-l5="sfx" ${cfg().sfx?'checked':''}> صدای افکت بنرها</label>
 ${s.lines.length?`<div style="margin-top:8px"><b>شرط پخش دیالوگ‌ها</b> <small>(برای هر نتیجه یک نسخه بسازید؛ اپ فقط نسخهٔ درست را پخش می‌کند)</small>${s.lines.map((l,i)=>`<label style="display:flex;gap:6px;align-items:center;margin:3px 0"><span style="min-width:22px">${fa(i+1)}</span><select data-l5="when" data-i="${i}">${condOptions(l.when)}</select><small style="opacity:.7">${esc(l.text.slice(0,40))}</small></label>`).join('')}</div>`:''}
 <div style="margin-top:8px"><small>وضعیت واقعی الان: ${(()=>{const x=situation();return x.first?(x.tie?'تساوی':`${esc(name(x.first))} +${fa(x.margin)}`)+(x.comeback?' · بازگشت':'')+(x.champ?` · قهرمان: ${esc(name(x.champ))}`:''):'—'})()}</small>
 <button data-l5b="test" style="margin-inline-start:8px">تست بنرها</button><button data-l5b="variants">ساخت نسخه‌های اعلام برنده</button></div>`;
 const anchor=el.querySelector('[data-f="issue"]');el.insertBefore(box,anchor?anchor.closest('label'):null)}}
document.addEventListener('change',e=>{const k=e.target.dataset&&e.target.dataset.l5;if(!k)return;const s=P.segments[st.sel];
 if(k==='speed'){if(e.target.value)s.speed=+e.target.value;else delete s.speed}else if(k==='gspeed')cfg().speed=+e.target.value;
 else if(k==='when'){const l=s.lines[+e.target.dataset.i];if(l){if(e.target.value==='always')delete l.when;else l.when=e.target.value}}
 else if(k==='segstats')s.statsCard=e.target.checked;else cfg()[k]=e.target.checked;save()});
document.addEventListener('click',e=>{const b=e.target.closest('[data-l5b]');if(!b)return;const s=P.segments[st.sel];
 if(b.dataset.l5b==='test'){const p=P.players[0],q=P.players[1]||P.players[0];push('lead',`${p.name} جلو افتاد!`,'نمونهٔ آزمایشی',p.color,{prio:1});push('tie','تساوی!','نمونهٔ آزمایشی',TH().accent2);push('comeback','بازگشت بزرگ!',`${q.name} برگشت`,q.color);push('timeout','وقت تمام!','',"#ff2d2d");toast('برای دیدن، صحنه را نگاه کنید')}
 if(b.dataset.l5b==='variants'){if(s.type!=='winner'){toast('این دکمه برای مرحلهٔ «اعلام برنده» است');return}
  const has=w=>s.lines.some(l=>l.when===w);const mk=(w,emo,text)=>{if(!has(w))s.lines.push({id:uid(),speaker:s.lines[0]?s.lines[0].speaker:P.speakers[0].id,emotion:emo,text,direction:'',when:w})};
  P.players.forEach(p=>mk('win:'+p.id,'celebrate',`${p.name}! قهرمان این قسمت از داداش‌مود!`));mk('tie','shock','باورم نمی‌شه... تساوی کامل! بریم سراغ تای‌بریک.');mk('comeback','epic','از عقب برگشت و قهرمان شد! این یعنی داداش‌مود!');mk('close','suspense','فقط چند ثانیه فاصله... نفس‌گیرترین پایان ممکن!');
  save();renderInspector();renderROS();toast('نسخه‌های اعلام برنده اضافه شد؛ حالا برای هرکدام صدا بسازید یا ضبط کنید',6000)}});

/* ================= boot ================= */
(function boot(){if(typeof P==='undefined'||!P||!P.segments){setTimeout(boot,200);return}hookAward();hookUndo();const s=situation();L5.prevLeader=s.tie?null:s.first;L5.prevTie=s.tie;
 window.DM5L={situation,condOk,push,segSpeed,replay}})();
})();
