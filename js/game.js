/* DADASHMODE v3 · deterministic game logic: time bank journal, VAR, round mechanics.
   Invariants kept from v1: one currency, banks never < 0, append-only journal, AI never mutates score,
   random outcomes are local (crypto.getRandomValues) and never sent to AI. */
'use strict';
function freshGame(){return {journal:[],var:false,distance:{},mystery:{dist:null,picks:{},opened:{}},sabotage:{},powers:{},comebackUsed:false,vault:{codes:[],stage:{}}}}
const G=()=>P.game||(P.game=freshGame());
const pl=id=>P.players.find(p=>p.id===id);
function undoneSet(){const s=new Set();G().journal.forEach(e=>{if(e.kind==='undo')s.add(e.ref)});return s}
function bankOf(pid){const u=undoneSet();let b=P.startBank;for(const e of G().journal){if(e.player!==pid||e.kind==='undo'||u.has(e.id))continue;b+=e.delta}return Math.max(0,b)}
function opponentOf(pid){const others=P.players.filter(p=>p.id!==pid);if(!others.length)return null;return others.sort((a,b)=>bankOf(b.id)-bankOf(a.id))[0].id}
function leader(){if(!P.players.length)return null;const s=[...P.players].sort((a,b)=>bankOf(b.id)-bankOf(a.id));return {p:s[0],tie:s.length>1&&bankOf(s[0].id)===bankOf(s[1].id)}}
function curSegIndex(){return st.live>=0?st.live:st.sel}
function fxPush(kind,data){st.fx.push({kind,data,t0:performance.now()/1000})}
/* the ONLY writer of the bank */
function award(pid,delta,reason,opt={}){const p=pl(pid);if(!p||!delta)return false;
  if(G().var&&!opt.force){toast('VAR فعال است؛ تا پایان بازبینی امتیاز قفل است');AE.ctx&&AE.buzzer();return false}
  const before=bankOf(pid);const applied=Math.max(-before,Math.round(delta));
  const ev={id:uid(),t:Date.now(),kind:opt.kind||'score',player:pid,delta:applied,reason:reason||'',seg:curSegIndex()};G().journal.push(ev);
  if(!opt.silentFx){fxPush(applied>=0?'gain':'loss',{pid,delta:applied,reason});st.pops.push({pid,n:applied,t:performance.now()/1000})}
  if(AE.ctx&&!opt.noSfx){applied>=0?(AE.coin(),setTimeout(()=>AE.ding(),120)):AE.lose()}
  save();renderScores();renderJournal();return ev}
function undoLast(){const u=undoneSet();const ev=[...G().journal].reverse().find(e=>e.kind!=='undo'&&!u.has(e.id)&&e.delta);if(!ev){toast('چیزی برای برگرداندن نیست');return}
  G().journal.push({id:uid(),t:Date.now(),kind:'undo',ref:ev.id,player:ev.player,delta:0,reason:'برگرداندن: '+(ev.reason||''),seg:curSegIndex()});save();renderScores();renderJournal();toast(`برگشت: ${pl(ev.player)?.name||''} ${ev.delta>0?'+':''}${fa(ev.delta)}`)}
function setVar(on){G().var=on;G().journal.push({id:uid(),t:Date.now(),kind:on?'var-on':'var-off',player:null,delta:0,reason:on?'شروع بازبینی VAR':'پایان بازبینی VAR',seg:curSegIndex()});
  if(AE.ctx){on?AE.siren():AE.whistle()}fxPush(on?'var':'var-off',{});save();renderGameDeck();renderJournal()}
function resetGame(){P.game=freshGame();st.disp={};save();renderScores();renderGameDeck();renderJournal()}
/* round: generic win */
function roundWin(pid){const s=P.segments[curSegIndex()];award(pid,s&&s.reward||10,`برد ${s?s.title:''}`)}
/* distance */
function distLock(pid,c){const d=G().distance[pid]||(G().distance[pid]={choice:null,att:[]});if(d.choice&&d.att.length){toast('انتخاب بعد از پرتاب اول قفل است');return}d.choice=c;AE.ctx&&AE.lock();fxPush('lock',{pid,text:`${pl(pid).name}: خط ${DIST[c].fa}`,col:DIST[c].col});save();renderGameDeck()}
function distMax(pid){return G().sabotage[pid]==='فقط ۲ تلاش به جای ۳'?2:3}
function distAttempt(pid,hit){const d=G().distance[pid];if(!d||!d.choice){toast('اول خط را قفل کنید');return}if(d.att.length>=distMax(pid)){toast('تلاش‌ها تمام شده');return}
  d.att.push(hit?1:0);if(hit)award(pid,DIST[d.choice].sec,`پرتاب موفق خط ${DIST[d.choice].fa}`);else{AE.ctx&&AE.buzzer();fxPush('miss',{pid})}save();renderGameDeck()}
/* mystery boxes: distribution generated locally, never exposed to AI */
function mysteryNew(){G().mystery={dist:shuffle(MYSTERY_POOL),picks:{},opened:{}};save();renderGameDeck();toast('توزیع جدید و مخفی جعبه‌ها ساخته شد')}
function mysteryPick(pid,box){const m=G().mystery;if(!m.dist)mysteryNew();if(Object.entries(m.picks).some(([k,v])=>v===box&&k!==pid)){toast('این جعبه را حریف برداشته');return}if(m.opened[box]){toast('این جعبه باز شده');return}m.picks[pid]=box;AE.ctx&&AE.lock();fxPush('lock',{pid,text:`${pl(pid).name}: جعبه ${fa(box)}`,col:pl(pid).color});save();renderGameDeck()}
function mysteryReveal(pid){const m=G().mystery;const box=m.picks[pid];if(!box){toast('جعبه‌ای انتخاب نشده');return}const it=m.dist[box-1];m.opened[box]=pid;delete m.picks[pid];
  fxPush('mystery',{pid,box,res:it});AE.ctx&&AE.drumroll(1.6);
  setTimeout(()=>{if(it.k==='gain')award(pid,it.v,`لقمهٔ مرموز جعبه ${box}`);else if(it.k==='steal'){const o=opponentOf(pid);if(o){award(o,-it.v,`دزدی از جعبه ${box}`,{silentFx:true});award(pid,it.v,`دزدی از جعبه ${box}`,{silentFx:true,noSfx:true})}AE.ctx&&AE.hit()}else{AE.ctx&&AE.lose()}save();renderGameDeck()},1700)}
/* mitts: win + local random sabotage for the opponent */
function mittsWin(pid){const s=P.segments[curSegIndex()];award(pid,s&&s.reward||15,'برد دستکش و پازل');const o=opponentOf(pid);if(!o)return;const card=SABOTAGE[secureRandInt(SABOTAGE.length)];G().sabotage[o]=card;
  setTimeout(()=>{fxPush('sabotage',{pid:o,card});AE.ctx&&AE.hit()},1400);save();renderGameDeck()}
/* powers */
function powerBuy(pid,id,stake){const pw=POWERS.find(x=>x.id===id);if(!pw)return;const list=G().powers[pid]||(G().powers[pid]=[]);
  if(id==='allin'){if(G().comebackUsed){toast('بازگشت فقط یک بار در کل مسابقه مجاز است');return}const lead=leader();if(!lead||lead.p.id===pid||lead.tie){toast('بازگشت فقط برای بازیکنی که عقب‌تر است');return}G().comebackUsed=true}
  let cost=pw.cost;if(pw.variable){cost=Math.max(1,Math.round(+stake||0));if(!stake){toast('مقدار شرط را وارد کنید');return}}
  if(id!=='allin'&&bankOf(pid)<cost){toast('ثانیهٔ کافی ندارد');return}
  if(id!=='allin'&&!award(pid,-cost,`خرید ${pw.name}`,{silentFx:true,noSfx:true}))return;
  list.push({id,stake:cost,resolved:null});AE.ctx&&AE.lock();fxPush('power',{pid,name:pw.name,cost:id==='allin'?0:cost});save();renderGameDeck()}
function powerResolve(pid,i,ok){const it=(G().powers[pid]||[])[i];if(!it||it.resolved!==null)return;it.resolved=ok;
  if(it.id==='double'){if(ok)award(pid,it.stake*2,'دو برابر یا هیچ: موفق');else{fxPush('miss',{pid});AE.ctx&&AE.lose()}}
  else if(it.id==='allin'){award(pid,ok?50:-30,ok?'بازگشت: موفق':'بازگشت: شکست')}save();renderGameDeck()}
/* vault */
function vaultNew(){G().vault={codes:[0,1,2].map(()=>secureRandInt(10)),stage:{}};save();renderGameDeck();toast('سه رمز جدید ساخته شد؛ روی کاغذ هم بنویسید')}
function vaultIssue(pid){const v=G().vault;if(!v.codes.length)vaultNew();const n=v.stage[pid]||0;if(n>=3){toast('هر سه رمز گرفته شده');return}v.stage[pid]=n+1;fxPush('code',{pid,stage:n+1,digit:v.codes[n]});AE.ctx&&(AE.lock(),setTimeout(()=>AE.ding(),200));save();renderGameDeck()}
function vaultResetStage(pid){toast(`ترتیب اشتباه: فقط مرحلهٔ ${fa((G().vault.stage[pid]||0)+1)} از اول`);AE.ctx&&AE.buzzer();fxPush('miss',{pid})}
function vaultUnlock(pid){const v=G().vault;if((v.stage[pid]||0)<3){toast('هنوز سه رمز کامل نیست');return}fxPush('vault',{pid,codes:v.codes});AE.ctx&&AE.vault();G().journal.push({id:uid(),t:Date.now(),kind:'vault',player:pid,delta:0,reason:'کیف طلایی باز شد',seg:curSegIndex()});G().champion=pid;save();renderJournal()}
