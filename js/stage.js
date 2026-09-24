/* DADASHMODE v3 · broadcast renderer (canvas, 1920x1080 logical, renders at 1080p/1440p/4K) */
'use strict';
const cv=document.getElementById('stage'),g=cv.getContext('2d',{alpha:false});
const QUAL={'1080p':{w:1920,h:1080,br:16e6},'1440p':{w:2560,h:1440,br:32e6},'2160p':{w:3840,h:2160,br:50e6}};
function setQuality(){const q=QUAL[S.quality]||QUAL['1080p'];cv.width=q.w;cv.height=q.h}
let logoImg=null;function loadLogoImg(){logoImg=null;const src=P.logo&&(P.logo.cut||P.logo.orig);if(!src)return;const im=new Image();im.onload=()=>logoImg=im;im.src=src}
let TH=()=>P.theme;
function F(size){const f=TH().font;return f==='Lalezar'?`${size}px Lalezar`:`900 ${size}px "${f}"`}
const UF=(s,w=800)=>`${w} ${s}px Vazirmatn`;
function rr(x,y,w,h,r){g.beginPath();r=Math.min(r,h/2,w/2);g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
function fit(str,maxW,size,fontFn=F){g.font=fontFn(size);const w=g.measureText(str).width;return w>maxW?Math.floor(size*maxW/w):size}
function wrap(str,maxW,font){g.font=font;const words=String(str).split(/\s+/);const out=[];let cur='';for(const w of words){const t=cur?cur+' '+w:w;if(g.measureText(t).width>maxW&&cur){out.push(cur);cur=w}else cur=t}if(cur)out.push(cur);
  if(out.length===2){/* balance two-line subtitles like broadcast captioners do */const all=words;let best=null;for(let i=1;i<all.length;i++){const a=all.slice(0,i).join(' '),b=all.slice(i).join(' ');const wa=g.measureText(a).width,wb=g.measureText(b).width;if(wa>maxW||wb>maxW)continue;const d=Math.abs(wa-wb);if(!best||d<best.d)best={d,l:[a,b]}}if(best)return best.l}
  return out}
function bigText(str,x,y,size,o={}){const th=TH();g.save();g.globalAlpha*=o.alpha??1;g.font=o.font||F(size);g.textAlign=o.align||'center';g.textBaseline='middle';g.direction='rtl';g.lineJoin='round';
  const depth=o.depth??Math.round(size*.09);g.fillStyle=o.shade||th.shade;for(let d=depth;d>0;d-=2)g.fillText(str,x,y+d);
  g.lineWidth=size*(o.sw??.13);g.strokeStyle=o.stroke||'#120a0c';g.strokeText(str,x,y);
  if(o.glow){g.shadowColor=o.glow;g.shadowBlur=size*.45}g.fillStyle=o.fill||th.ink;g.fillText(str,x,y);g.restore()}
function chip(str,x,y,size,bg,fg,alpha=1,measureOnly=false){g.save();g.font=UF(size,900);g.direction='rtl';const w=g.measureText(str).width+size*1.4,h=size*1.9;if(measureOnly){g.restore();return w}
  g.globalAlpha*=alpha;rr(x-w/2,y-h/2,w,h,h/2);g.fillStyle=bg;g.fill();g.fillStyle=fg;g.textAlign='center';g.textBaseline='middle';g.fillText(str,x,y+size*.06);g.restore();return w}
const PARTS=Array.from({length:80},(_,i)=>({x:rnd(i)*1920,y:rnd(i+99)*1080,r:1.5+rnd(i+7)*4,s:12+rnd(i+3)*40,a:.15+rnd(i+5)*.45}));
function drawBG(t,green){const th=TH();if(green){g.fillStyle='#00b140';g.fillRect(0,0,1920,1080);return}
  const rg=g.createRadialGradient(960,440,40,960,540,1250);rg.addColorStop(0,th.bg2);rg.addColorStop(1,th.bg1);g.fillStyle=rg;g.fillRect(0,0,1920,1080);
  g.save();g.globalCompositeOperation='lighter';g.translate(960,1200);
  for(let i=0;i<11;i++){const a=(i-5)*.17+Math.sin(t*.35+i*1.3)*.1;g.save();g.rotate(a);const lg=g.createLinearGradient(0,0,0,-1500);lg.addColorStop(0,hexA(i%2?th.accent:th.accent2,.15));lg.addColorStop(1,hexA(th.accent,0));g.fillStyle=lg;g.beginPath();g.moveTo(-18,0);g.lineTo(18,0);g.lineTo(140,-1500);g.lineTo(-140,-1500);g.closePath();g.fill();g.restore()}
  g.restore();
  g.save();g.strokeStyle=hexA(th.accent,.12);g.lineWidth=2;for(let i=-12;i<=12;i++){g.beginPath();g.moveTo(960+i*40,760);g.lineTo(960+i*260,1080);g.stroke()}for(let k=0;k<7;k++){const y=760+Math.pow(k/6,1.8)*320+((t*30)%46)*(k/6);g.beginPath();g.moveTo(0,y);g.lineTo(1920,y);g.stroke()}g.restore();
  g.save();for(const p of PARTS){const y=(p.y-t*p.s)%1080;const yy=y<0?y+1080:y;g.fillStyle=hexA(th.ink,p.a*.55);g.beginPath();g.arc(p.x+Math.sin(t+p.x)*14,yy,p.r,0,7);g.fill()}g.restore();
  const vg=g.createRadialGradient(960,540,520,960,540,1150);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(4,2,3,.62)');g.fillStyle=vg;g.fillRect(0,0,1920,1080)}
function rays(cx,cy,t,k,col,n=18){if(k<=0)return;g.save();g.globalCompositeOperation='lighter';g.translate(cx,cy);g.rotate(t*.18);for(let i=0;i<n;i++){g.rotate(Math.PI*2/n);const lg=g.createLinearGradient(0,0,0,-1300*k);lg.addColorStop(0,hexA(col,.3));lg.addColorStop(1,hexA(col,0));g.fillStyle=lg;g.beginPath();g.moveTo(0,0);g.lineTo(-70*k,-1300*k);g.lineTo(70*k,-1300*k);g.closePath();g.fill()}g.restore()}
function drawLogo(cx,cy,size,alpha=1,glow=true){if(!logoImg)return false;const s=size/Math.max(logoImg.width,logoImg.height);const w=logoImg.width*s,h=logoImg.height*s;g.save();g.globalAlpha*=alpha;if(glow){g.shadowColor=hexA(TH().accent,.8);g.shadowBlur=size*.16}g.drawImage(logoImg,cx-w/2,cy-h/2,w,h);g.restore();return true}
function bug(){if(!drawLogo(96+64,54+54,120,.96,false)){g.save();g.font=F(40);g.fillStyle=hexA(TH().ink,.92);g.textAlign='left';g.textBaseline='middle';g.fillText(P.name.split('·')[0].trim(),96,54+40);g.restore()}}
function confetti(t0,t){const age=t-t0;if(age<0||age>6.5)return;const th=TH();const cols=[th.accent,th.accent2,th.ink,'#3da5ff','#ff8a3d'];g.save();g.globalAlpha=cl(6.5-age);
  for(let i=0;i<240;i++){const side=i%2?1:-1;const x0=side>0?1920:0;const vx=-side*(500+rnd(i)*1300),vy=-(900+rnd(i+1)*1100);const k=1-Math.exp(-1.3*age);const x=x0+vx*k/1.3+Math.sin(age*3+i)*30,y=1080+vy*k/1.3+225*age*age;if(y>1120)continue;g.save();g.translate(x,y);g.rotate(age*(4+rnd(i+2)*8));g.scale(1,Math.cos(age*6+i));g.fillStyle=cols[i%cols.length];g.fillRect(-10,-6,20,12);g.restore()}g.restore()}
function panel(x,y,w,h,r,fill,stroke){rr(x,y,w,h,r);g.fillStyle=fill;g.fill();if(stroke){g.lineWidth=4;g.strokeStyle=stroke;g.stroke()}}

/* ================= game illustrations (used by full-screen intro & animated rules) ================= */
const ILL={};
function cupShape(x,y,w,h,col,a=1){g.save();g.globalAlpha*=a;g.beginPath();g.moveTo(x-w*.5,y-h);g.lineTo(x+w*.5,y-h);g.lineTo(x+w*.38,y);g.lineTo(x-w*.38,y);g.closePath();const lg=g.createLinearGradient(x-w/2,0,x+w/2,0);lg.addColorStop(0,mix(col,'#000000',.35));lg.addColorStop(.35,col);lg.addColorStop(.6,mix(col,'#ffffff',.35));lg.addColorStop(1,mix(col,'#000000',.3));g.fillStyle=lg;g.fill();g.lineWidth=3;g.strokeStyle=mix(col,'#000000',.55);g.stroke();
  g.beginPath();g.ellipse(x,y-h,w*.5,h*.1,0,0,7);g.fillStyle=mix(col,'#ffffff',.5);g.fill();g.stroke();g.restore()}
ILL.cup=(t,cx,cy,s,step)=>{const th=TH();const w=92*s,h=108*s;const rows=[4,3,2,1];let k=0;const total=10;const shown=step>=0?(step>=1?10:Math.min(10,Math.floor(t*4))):Math.min(10,Math.floor(t*5));
  g.save();g.fillStyle=hexA('#000000',.3);g.beginPath();g.ellipse(cx,cy+8*s,w*2.4,22*s,0,0,7);g.fill();g.restore();
  rows.forEach((n,r)=>{for(let i=0;i<n;i++){const x=cx+(i-(n-1)/2)*w*1.02,y=cy-r*h*.98;if(k<shown){const age=t-(k*.2);const drop=step>=1?0:(1-eo(cl(age*2.5)))*-120*s;cupShape(x,y+drop,w,h,th.accent)}k++}});
  const hold=step>=3?cl((t%3)/2):0;if(step>=3){g.save();g.beginPath();g.arc(cx+w*2.8,cy-h*3.2,50*s,-Math.PI/2,-Math.PI/2+Math.PI*2*hold);g.strokeStyle=th.accent2;g.lineWidth=10*s;g.lineCap='round';g.stroke();g.font=F(46*s);g.fillStyle=th.ink;g.textAlign='center';g.textBaseline='middle';g.fillText(fa(Math.min(2,Math.floor(hold*2)+0)),cx+w*2.8,cy-h*3.2+4);g.restore()}
  if(step===1||step===2){g.save();const bx=cx-w*2.9,by=cy-h*2.4;vIcon('hand',bx,by,150*s,{col:TH().ink});if(step===2){g.strokeStyle='#ff3b3b';g.lineWidth=16*s;g.beginPath();g.arc(bx,by,85*s,0,7);g.moveTo(bx-60*s,by-60*s);g.lineTo(bx+60*s,by+60*s);g.stroke()}g.restore()}};
ILL.distance=(t,cx,cy,s,step)=>{const cols=[DIST.green,DIST.yellow,DIST.red];const base=cy+170*s;
  g.save();g.beginPath();g.moveTo(cx-560*s,base);g.lineTo(cx+560*s,base);g.lineTo(cx+260*s,cy-230*s);g.lineTo(cx-260*s,cy-230*s);g.closePath();g.fillStyle=hexA(TH().ink,.07);g.fill();g.restore();
  cols.forEach((d,i)=>{const k=eo(ph(t,.2+i*.25,.6));const y=base-(80+i*120)*s;const half=(520-i*85)*s;const on=step<0||step===0||step===1&&false||step>=0;g.save();g.globalAlpha=k*(step>=0&&step!==0&&step!==1?.55:1);g.fillStyle=d.col;g.fillRect(cx-half*k,y-9*s,half*2*k,18*s);
    const lx=cx+half+70*s;g.font=F(64*s);g.textAlign='center';g.textBaseline='middle';g.lineWidth=10*s;g.strokeStyle='#111';g.strokeText('+'+fa(d.sec),lx,y);g.fillStyle=d.col;g.fillText('+'+fa(d.sec),lx,y);g.restore()});
  const bx=cx,by=cy-300*s;g.save();g.strokeStyle='#ff7a1a';g.lineWidth=10*s;g.beginPath();g.ellipse(bx,by,70*s,18*s,0,0,7);g.stroke();g.strokeStyle=hexA('#ffffff',.6);g.lineWidth=3*s;for(let i=-3;i<=3;i++){g.beginPath();g.moveTo(bx+i*20*s,by+6*s);g.lineTo(bx+i*12*s,by+80*s);g.stroke()}g.restore();
  const bt=(t%2.2)/1.3;if(bt<=1){const sx=cx-120*s,sy=base-40*s;const x=sx+(bx-sx)*bt,y=sy+(by-sy)*bt-Math.sin(bt*Math.PI)*260*s;g.save();g.fillStyle='#ff8a3d';g.beginPath();g.arc(x,y,26*s,0,7);g.fill();g.strokeStyle='#5a2400';g.lineWidth=3*s;g.beginPath();g.moveTo(x-26*s,y);g.lineTo(x+26*s,y);g.stroke();g.restore()}
  if(step===1){vIcon('lock',cx-460*s,cy-200*s,150*s,{col:TH().accent2})}
  if(step===2){for(let i=0;i<3;i++){g.save();g.beginPath();g.arc(cx-120*s+i*120*s,cy+300*s,34*s,0,7);g.fillStyle=TH().accent;g.globalAlpha=eo(ph(t,i*.3,.4));g.fill();g.restore()}}};
function boxShape(x,y,w,n,col,open=0,res=null,wob=0){g.save();g.translate(x,y);g.rotate(wob);const h=w*.9;const lg=g.createLinearGradient(0,-h/2,0,h/2);lg.addColorStop(0,mix(col,'#ffffff',.18));lg.addColorStop(1,mix(col,'#000000',.35));g.fillStyle=lg;rr(-w/2,-h/2,w,h,w*.08);g.fill();g.lineWidth=4;g.strokeStyle=mix(col,'#000000',.6);g.stroke();
  g.fillStyle=TH().accent2;g.fillRect(-w*.07,-h/2,w*.14,h);g.save();g.translate(0,-h/2-open*w*.5);g.rotate(-open*.6);g.fillStyle=mix(col,'#ffffff',.3);rr(-w*.56,-w*.14,w*1.12,w*.2,w*.05);g.fill();g.stroke();g.restore();
  g.font=F(w*.46);g.textAlign='center';g.textBaseline='middle';g.lineWidth=w*.06;g.strokeStyle='#130a0c';g.strokeText(fa(n),0,h*.08);g.fillStyle=TH().ink;g.fillText(fa(n),0,h*.08);
  if(open>.3&&res){const txt=res.k==='gain'?'+'+fa(res.v):res.k==='steal'?'−'+fa(res.v)+' دزدی':'پوچ';const c=res.k==='gain'?'#39ff88':res.k==='steal'?'#ff5a5a':'#cccccc';g.globalAlpha=cl((open-.3)/.5);bigText(txt,0,-h*.9-open*w*.3,w*.42,{fill:c,depth:4})}g.restore()}
ILL.mystery=(t,cx,cy,s,step)=>{const w=190*s;for(let i=0;i<6;i++){const r=Math.floor(i/3),c=i%3;const x=cx+(1-c)*w*1.25,y=cy-110*s+r*w*1.15;const k=eo(ph(t,.1+i*.09,.5));if(k<=0)continue;
  const hi=step===1||step===2||step===3;let res=null;if(step===1&&(i===1||i===4))res={k:'gain',v:15};if(step===2&&i===3)res={k:'steal',v:5};if(step===3&&(i===0||i===2||i===5))res={k:'empty'};
  const open=res?eo(ph(t,.5,.6)):0;const wob=step<0||step===0?Math.sin(t*6+i)*.04*(Math.sin(t*1.3+i*2)>.6?1:0):0;g.save();g.globalAlpha=k*(hi&&!res?.45:1);g.translate(0,(1-k)*60);boxShape(x,y,w,i+1,TH().accent,open,res,wob);g.restore()}
  if(step<0||step===0){g.save();g.font=F(90*s);g.textAlign='center';g.fillStyle=hexA(TH().ink,.5+.5*Math.sin(t*4));g.fillText('؟',cx,cy-110*s-w*1.05);g.restore()}};
ILL.mitts=(t,cx,cy,s,step)=>{const th=TH();
  const mitt=(x,y,sc,rot)=>{g.save();g.translate(x,y);g.rotate(rot);g.scale(sc,sc);g.fillStyle='#e8e2d0';g.strokeStyle='#5b4a2e';g.lineWidth=6;g.beginPath();g.moveTo(-60,120);g.lineTo(-70,-20);g.quadraticCurveTo(-70,-110,0,-110);g.quadraticCurveTo(70,-110,70,-20);g.lineTo(60,120);g.closePath();g.fill();g.stroke();g.beginPath();g.ellipse(-78,10,30,48,-.5,0,7);g.fill();g.stroke();g.fillStyle=th.accent;g.fillRect(-62,95,124,26);
    for(let i=0;i<4;i++){g.strokeStyle=hexA('#5b4a2e',.35);g.beginPath();g.moveTo(-55,-60+i*35);g.lineTo(55,-60+i*35);g.stroke()}g.restore()};
  if(step<=0){mitt(cx-200*s,cy+Math.sin(t*3)*10*s,1.3*s,-.15);mitt(cx+200*s,cy+Math.cos(t*3)*10*s,1.3*s,.15)}
  if(step===1){const sh=Math.sin(t*20)*6*s*(t%2<1?1:0);g.save();g.translate(cx+sh,cy);g.fillStyle='#b98a4f';g.strokeStyle='#5e3f18';g.lineWidth=6*s;g.fillRect(-220*s,-140*s,440*s,280*s);g.strokeRect(-220*s,-140*s,440*s,280*s);g.fillStyle=hexA('#d9d2b8',.95);g.fillRect(-240*s,-20*s,480*s,44*s);g.restore()}
  if(step===2||step===3){const k=step===3?1:eo(ph(t,.3,1.4));const R=170*s;const q=[[-1,-1],[1,-1],[-1,1],[1,1]];q.forEach(([dx,dy],i)=>{const off=(1-k)*(240+i*40)*s;g.save();g.translate(cx+dx*off*1.3,cy+dy*off);g.beginPath();g.moveTo(cx*0,0);const a0=[Math.PI,1.5*Math.PI,.5*Math.PI,0][i];g.arc(0,0,R,a0,a0+Math.PI/2);g.closePath();g.fillStyle=[th.accent,th.accent2,mix(th.accent,'#ffffff',.3),mix(th.accent2,'#000000',.2)][i];g.fill();g.lineWidth=6*s;g.strokeStyle='#150c0e';g.stroke();g.restore()});
    if(k>=1){if(!drawLogo(cx,cy+10*s,300*s,1,true))vIcon('star',cx,cy+10*s,200*s,{col:TH().ink})}
    if(step===3){g.save();const fx=cx+330*s;g.fillStyle='#ffffff';g.fillRect(fx,cy-200*s,10*s,400*s);for(let r=0;r<5;r++)for(let c=0;c<4;c++){g.fillStyle=(r+c)%2?'#111':'#f5f5f5';g.fillRect(fx+10*s+c*30*s+Math.sin(t*5+r)*3*s,cy-200*s+r*30*s,30*s,30*s)}g.restore()}}
  if(step===4){g.save();g.translate(cx,cy);g.rotate(Math.sin(t*2)*.06);panel(-170*s,-230*s,340*s,460*s,26*s,th.bg1,th.accent2);g.font=F(64*s);g.fillStyle=th.accent2;g.textAlign='center';g.textBaseline='middle';g.fillText('کارت',0,-120*s);g.fillText('خرابکاری',0,-40*s);vIcon('skull',0,110*s,150*s,{col:th.accent2});g.restore()}};
ILL.powers=(t,cx,cy,s,step)=>{const th=TH();const n=POWERS.length;POWERS.forEach((p,i)=>{const a=(i-(n-1)/2)*.16;const k=eo(ph(t,.1+i*.08,.6));const hi=step<0||[[0,1],[2,3],[4],[5],[0,1,2,3,4,5]][step]?.includes(i);
    g.save();g.translate(cx,cy+420*s);g.rotate(a*k);g.translate(0,-520*s-(hi&&step>=0&&step<4?40*s:0));g.globalAlpha=k*(hi?1:.35);
    const cw=200*s,ch=290*s;const col=p.cat==='کمک'?'#3da5ff':p.cat==='حمله'?'#ff4d4d':th.accent2;panel(-cw/2,-ch/2,cw,ch,20*s,th.bg1,col);g.fillStyle=col;g.fillRect(-cw/2+8*s,-ch/2+8*s,cw-16*s,46*s);
    g.font=UF(24*s,900);g.fillStyle='#120a0c';g.textAlign='center';g.textBaseline='middle';g.direction='rtl';g.fillText(p.cat,0,-ch/2+32*s);
    const fs=fit(p.name,cw-24*s,40*s);g.font=F(fs);g.fillStyle=th.ink;g.fillText(p.name,0,-10*s);g.font=F(50*s);g.fillStyle=col;g.fillText(p.variable?'شرط':fa(p.cost)+'s',0,80*s);
    if(step===4&&i===5){vIcon('lock',0,0,130*s,{col:col})}g.restore()})};
ILL.vault=(t,cx,cy,s,step)=>{const th=TH();const gold='#f5b82e';g.save();g.translate(cx,cy+30*s);const open=step===3?eo(ph(t,.6,1)):0;
  g.fillStyle=mix(gold,'#000000',.35);rr(-80*s,-250*s,160*s,60*s,24*s);g.lineWidth=18*s;g.strokeStyle=mix(gold,'#000000',.25);g.stroke();
  const lg=g.createLinearGradient(0,-200*s,0,200*s);lg.addColorStop(0,mix(gold,'#ffffff',.35));lg.addColorStop(.5,gold);lg.addColorStop(1,mix(gold,'#000000',.4));g.fillStyle=lg;rr(-340*s,-200*s,680*s,380*s,30*s);g.fill();g.lineWidth=6*s;g.strokeStyle=mix(gold,'#000000',.55);g.stroke();
  if(open>0){g.save();g.globalCompositeOperation='lighter';rays(0,-10*s,t,open,'#fff3b0',14);g.restore()}
  const digits=[0,1,2].map(i=>step>i||step===3?['۷','۳','۹'][i]:fa(Math.floor((t*12+i*3)%10)));
  digits.forEach((d,i)=>{const x=(i-1)*120*s;panel(x-48*s,-60*s,96*s,120*s,14*s,'#1a1206',step>i||step===3?th.accent:'#6b5220');g.font=F(84*s);g.fillStyle=step>i||step===3?th.accent2:'#f1e2b8';g.textAlign='center';g.textBaseline='middle';g.fillText(d,x,4*s)});
  g.restore();
  const icons=['pencil','brain','puzzle'];icons.forEach((ic,i)=>{const x=cx+(1-i)*260*s,y=cy+330*s;const on=step===i||step===3||step===4;g.save();g.globalAlpha=eo(ph(t,.2+i*.15,.5))*(on||step<0?1:.4);g.beginPath();g.arc(x,y,62*s,0,7);g.fillStyle=on?th.accent:hexA(th.ink,.12);g.fill();vIcon(ic,x,y,76*s,{col:on?th.bg1:th.ink,glow:false});g.restore()})};
ILL.generic=(t,cx,cy,s)=>{const th=TH();rays(cx,cy,t,1,th.accent2,14);g.save();g.translate(cx,cy);g.rotate(Math.sin(t)*.05);g.font=F(300*s);g.textAlign='center';g.textBaseline='middle';g.fillText('🏆',0,0);g.restore()};
function illus(game,t,cx,cy,s,step,seg){(ILL[game]||ILL.generic)(t,cx,cy,s,step,seg)}

/* ================= scenes ================= */
const SC={};
SC.title=(t,seg)=>{const th=TH();const k=eo(ph(t,0,1.3));rays(960,logoImg?420:470,t,k,th.accent);
  const hasLogo=!!logoImg;if(hasLogo)drawLogo(960,400,470*(.35+.65*eo(ph(t,.1,1.1))),cl(t/.3));
  const ty=eo(ph(t,.7,.9));const ts=fit(seg.title,1600,hasLogo?150:220);bigText(seg.title,960,(hasLogo?745:500)+(1-ty)*90,ts,{alpha:ty});
  if(seg.subtitle)chip(seg.subtitle,960,hasLogo?885:690,36,th.accent,th.bg1,eo(ph(t,1.15,.6)));
  P.players.slice(0,2).forEach((p,i)=>{const k2=eo(ph(t,1.5+i*.15,.7));const x=i?1920-240+(1-k2)*400:240-(1-k2)*400;g.save();g.globalAlpha=k2;bigText(p.symbol,x,900,90,{fill:p.color,depth:6});g.font=F(60);g.fillStyle=th.ink;g.textAlign='center';g.fillText(p.name,x,990);g.restore()});
  const sw=(t-1.6)%5;if(t>1.6&&sw<.9){g.save();g.globalCompositeOperation='lighter';const x=2200-sw/.9*2600;const lg=g.createLinearGradient(x-200,0,x+200,0);lg.addColorStop(0,'rgba(255,255,255,0)');lg.addColorStop(.5,hexA(th.ink,.2));lg.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=lg;g.fillRect(0,0,1920,1080);g.restore()}
  if(t<.4){g.fillStyle=hexA(th.ink,(1-t/.4)*.85);g.fillRect(0,0,1920,1080)}};
/* FULL-SCREEN GAME INTRO: slam-in title, game illustration, marquee tickers */
SC.intro=(t,seg)=>{const th=TH();
  const tickY=[56,1024];tickY.forEach((y,j)=>{g.save();g.globalAlpha=eo(ph(t,.5,.5));g.fillStyle=j?th.accent:th.accent2;g.fillRect(0,y-30,1920,60);g.font=UF(28,900);g.fillStyle=th.bg1;g.textBaseline='middle';g.direction='rtl';const txt=`${seg.title}  ✦  ${seg.subtitle||P.name}  ✦  `;const w=g.measureText(txt).width;const off=((t*(j?-160:160))%w+w)%w;for(let x=-w+off;x<1920+w;x+=w)g.fillText(txt,x,y+2);g.restore()});
  const ik=eo(ph(t,1.1,1));if(ik>0){g.save();g.globalAlpha=ik;illus(seg.game,Math.max(0,t-1.1),1920*.3,560,.95,-1,seg);g.restore()}
  const band=eo(ph(t,.35,.7));g.save();g.translate(1920*.68,540);g.rotate(-.05);g.scale(band,1);g.fillStyle=th.accent;g.fillRect(-720,-150,1440,300);g.fillStyle=hexA(th.bg1,.28);g.fillRect(-720,110,1440,40);g.restore();
  if(seg.subtitle)chip(seg.subtitle,1920*.68,300-(1-eo(ph(t,.75,.6)))*60,42,th.bg1,th.accent2,eo(ph(t,.75,.5)));
  const pop=eo(ph(t,.55,.7));g.save();g.translate(1920*.68,550);const sc=1.6-.6*pop;g.scale(sc,sc);bigText(seg.title,0,0,fit(seg.title,1250,190),{alpha:pop,fill:th.ink,shade:th.shade});g.restore();
  if(seg.reward&&seg.type==='intro'){}
  [0,.08,.16].forEach((d,j)=>{const p=eq(ph(t,d,.6));if(p<=0||p>=1)return;const x=2300-p*3100;g.save();g.fillStyle=[th.accent2,th.accent,th.ink][j];g.beginPath();g.moveTo(x,0);g.lineTo(x+420,0);g.lineTo(x+120,1080);g.lineTo(x-300,1080);g.closePath();g.fill();g.restore()})};
function rulesState(seg,t){const n=seg.rules.length;if(st.live<0||P.segments[st.live]!==seg)return{rv:n,active:-1,idle:true};
  if(seg.lines.length){const off=seg.lines.length>n?1:0;const rv=cl(st.lineK-off+1,0,n);return{rv,active:st.line?st.lineK-off:-1}}
  return{rv:Math.min(n,Math.max(0,Math.floor((t-.8)/2.6)+1)),active:-1}}
/* ANIMATED RULES: illustration reacts to the rule being spoken, list builds in sync with the voice */
SC.rules=(t,seg)=>{const th=TH();const{rv,active,idle}=rulesState(seg,t);
  const hy=eo(ph(t,0,.7));bigText(seg.title||'قوانین',1920-110,140-(1-hy)*60,fit(seg.title||'قوانین',1100,88),{align:'right',alpha:hy});
  g.save();g.globalAlpha=hy;g.fillStyle=th.accent;g.fillRect(1920-110-260*hy,202,260*hy,10);g.restore();bug();
  const n=seg.rules.length;const step=idle?-1:active>=0?active:Math.max(-1,rv-1);
  if(!st.ruleStep||st.ruleStep.seg!==seg.id||st.ruleStep.step!==step)st.ruleStep={seg:seg.id,step,t0:t};
  g.save();g.globalAlpha=eo(ph(t,.3,.8));panel(90,250,760,700,40,hexA(th.bg1,.55),hexA(th.ink,.08));illus(seg.game,t-st.ruleStep.t0,470,600,.62,step,seg);g.restore();
  if(!n){chip('قانونی وارد نشده',1380,540,36,th.accent,th.bg1);return}
  const top=250,avail=700,rowH=Math.min(150,avail/n),gap=Math.min(22,rowH*.16);
  for(let i=0;i<n;i++){if(i>=rv)continue;if(!idle&&st.ruleT[i]===undefined)st.ruleT[i]=t;const a=idle?1:eo((t-st.ruleT[i])/.6);const y=top+i*rowH;const isA=i===active;const x=920,w=910,h=rowH-gap;
    g.save();g.globalAlpha=a*(active>=0&&!isA?.7:1);g.translate((1-a)*-160,0);const sc=isA?1.03:1;g.translate(x+w/2,y+h/2);g.scale(sc,sc);g.translate(-(x+w/2),-(y+h/2));
    rr(x,y,w,h,h/2);g.fillStyle=isA?th.accent:hexA(th.bg1,.85);g.fill();g.lineWidth=3;g.strokeStyle=hexA(isA?th.accent2:th.ink,isA?.9:.16);g.stroke();
    const cx=x+w-h/2;g.beginPath();g.arc(cx,y+h/2,h/2-8,0,7);g.fillStyle=isA?th.bg1:th.accent;g.fill();
    g.font=F(Math.round(h*.5));g.fillStyle=isA?th.accent2:th.bg1;g.textAlign='center';g.textBaseline='middle';g.fillText(fa(i+1),cx,y+h/2+h*.04);
    const fs=fit(seg.rules[i],w-h-70,Math.round(Math.min(52,h*.42)),s=>UF(s,900));g.font=UF(fs,900);g.direction='rtl';g.textAlign='right';g.fillStyle=isA?th.bg1:th.ink;g.fillText(seg.rules[i],cx-h/2-22,y+h/2+4);
    if(!isA&&active>i){g.font=UF(34,900);g.textAlign='left';g.fillStyle=th.accent2;g.fillText('✓',x+36,y+h/2)}g.restore()}};
SC.countdown=(t,seg)=>{const th=TH();const k=Math.floor(t-.3),p=(t-.3)-k;if(t<.3){bigText(seg.title||'آماده‌اید؟',960,540,130,{alpha:eo(t/.3)});return}
  const labels=['۳','۲','۱','شروع!'];const lab=labels[Math.min(3,k)];const isGo=k>=3;if(isGo)rays(960,540,t,1,th.accent2);
  g.save();g.globalCompositeOperation='lighter';for(let r=0;r<2;r++){const q=cl(p*1.3-r*.2);g.beginPath();g.arc(960,540,160+q*700,0,7);g.strokeStyle=hexA(isGo?th.accent2:th.accent,(1-q)*.6);g.lineWidth=14*(1-q)+2;g.stroke()}g.restore();
  if(!isGo){g.beginPath();g.arc(960,540,250,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-p));g.strokeStyle=th.accent;g.lineWidth=18;g.lineCap='round';g.stroke()}
  const sc=(isGo?1.25:1.7)-(isGo?.25:.7)*eo(p/.35);g.save();g.translate(960,550);g.scale(sc,sc);bigText(lab,0,0,isGo?260:330,{alpha:isGo?1:cl((1-p)*3),fill:isGo?th.accent2:th.ink,glow:hexA(th.accent,.6)});g.restore()};
function drawTimer(){const th=TH(),tm=st.timer;const corner=P.layout.timer==='corner';const cx=corner?1920-96-100:960,cy=54+100;const low=tm.remain<=10&&tm.remain>0;
  const pul=low?1+.07*Math.abs(Math.sin(performance.now()/1000*Math.PI)):1;g.save();g.translate(cx,cy);g.scale(pul,pul);
  g.beginPath();g.arc(0,0,96,0,7);g.fillStyle=hexA(th.bg1,.93);g.fill();g.beginPath();g.arc(0,0,80,0,7);g.strokeStyle=hexA(th.ink,.14);g.lineWidth=13;g.stroke();
  g.beginPath();g.arc(0,0,80,-Math.PI/2,-Math.PI/2+Math.PI*2*(tm.total?tm.remain/tm.total:0));g.strokeStyle=low?'#ff3b3b':th.accent;g.lineCap='round';g.stroke();
  g.font=F(tm.remain<=0?48:80);g.fillStyle=low?'#ff5a5a':th.ink;g.textAlign='center';g.textBaseline='middle';g.fillText(tm.remain<=0?'تمام!':fa(Math.ceil(tm.remain)),0,6);g.restore()}
/* TIME BANK cards (TV lower corners for 2 players, row for more) */
function bankCards(seg,opts={}){const th=TH(),ps=P.players,n=ps.length;if(!n)return;const top=P.layout.score==='top';const now=performance.now()/1000;const lead=leader();
  const W=n<=2?460:Math.min(380,(1920-192-24*(n-1))/n),h=170;
  ps.forEach((p,i)=>{let x;if(n<=2){x=i===0?1920-96-W:96}else{const total=W*n+24*(n-1);x=960+total/2-(i+1)*W-i*24}const y=top?54+(opts.shiftTop||0):1080-54-h;
    const pop=st.pops.filter(q=>q.pid===p.id&&now-q.t<1.3).pop();const bump=pop?1+.08*cl(1-(now-pop.t)/.35):1;
    g.save();g.translate(x+W/2,y+h/2);g.scale(bump,bump);g.translate(-(x+W/2),-(y+h/2));
    rr(x,y,W,h,30);g.fillStyle=hexA(th.bg1,.94);g.fill();g.lineWidth=5;g.strokeStyle=p.color;g.stroke();
    g.save();rr(x,y,W,h,30);g.clip();g.fillStyle=p.color;g.fillRect(x+W-150,y,150,h);g.fillStyle=hexA('#000000',.18);g.beginPath();g.moveTo(x+W-150,y);g.lineTo(x+W-120,y);g.lineTo(x+W-170,y+h);g.lineTo(x+W-200,y+h);g.closePath();g.fill();g.restore();
    g.font=F(88);g.fillStyle='#120a0c';g.textAlign='center';g.textBaseline='middle';g.fillText(p.symbol,x+W-75,y+h/2+4);
    g.font=UF(34,900);g.fillStyle=hexA(th.ink,.85);g.textAlign='right';g.direction='rtl';g.fillText(p.name,x+W-172,y+46);
    const val=Math.round(st.disp[p.id]??bankOf(p.id));g.font=F(96);g.fillStyle=th.ink;g.textAlign='right';g.fillText(fa(val),x+W-172,y+118);
    const vw=g.measureText(fa(val)).width;g.font=UF(28,800);g.fillStyle=hexA(th.ink,.6);g.fillText(P.unit,x+W-172-vw-14,y+128);
    if(lead&&!lead.tie&&lead.p.id===p.id&&bankOf(p.id)>0){chip('پیشتاز',x+70,y+36,20,th.accent2,th.bg1)}
    if(G().sabotage[p.id]){vIcon('skull',x+38,y+h-28,30,{col:'#ff8a8a',glow:false});g.font=UF(22,800);g.fillStyle='#ff8a8a';g.textAlign='left';g.fillText(G().sabotage[p.id],x+60,y+h-26)}
    g.restore();
    st.pops.filter(q=>q.pid===p.id&&now-q.t<1.3).forEach(q=>{const a=now-q.t;g.save();g.globalAlpha=cl(1.3-a);bigText((q.n>0?'+':'−')+fa(Math.abs(q.n)),x+W/2,(top?y+h+70:y-40)-a*80,78,{fill:q.n>0?th.accent2:'#ff5a5a',depth:4});g.restore()});
    gameHudFor(seg,p,x,y,W,h,top)})}
function gameHudFor(seg,p,x,y,W,h,top){if(!seg||seg.type!=='play')return;const th=TH();const ay=top?y+h+40:y-40;
  if(seg.game==='distance'){const d=G().distance[p.id];if(!d||!d.choice)return;const D=DIST[d.choice];chip('خط '+D.fa+' · +'+fa(D.sec),x+W-110,ay,24,D.col,'#111');const mx=distMax(p.id);for(let i=0;i<mx;i++){const v=d.att[i];const cx=x+60+i*62;g.beginPath();g.arc(cx,ay,24,0,7);g.fillStyle=v===1?'#22c55e':v===0?'#ef4444':hexA(th.ink,.18);g.fill();g.font=UF(26,900);g.fillStyle='#fff';g.textAlign='center';g.textBaseline='middle';g.fillText(v===1?'✓':v===0?'✕':'',cx,ay+2)}}
  if(seg.game==='powers'){const list=G().powers[p.id]||[];list.forEach((it,i)=>{const pw=POWERS.find(z=>z.id===it.id);const lab=pw.name+(it.resolved===true?' ✓':it.resolved===false?' ✕':' · قفل');const w=chip(lab,0,-999,22,th.accent,th.bg1,1,true);chip(lab,x+W-w/2-(i%2)*(w+10),ay-Math.floor(i/2)*52*(top?-1:1),22,it.resolved===false?'#555':th.accent,th.bg1)})}
  if(seg.game==='vault'){const n=G().vault.stage[p.id]||0;for(let i=0;i<3;i++){const cx=x+W-60-i*96;panel(cx-38,ay-40,76,80,14,i<n?th.accent:hexA(th.bg1,.9),i<n?th.accent2:hexA(th.ink,.2));g.font=F(56);g.fillStyle=i<n?th.bg1:hexA(th.ink,.35);g.textAlign='center';g.textBaseline='middle';g.fillText(i<n?fa(G().vault.codes[i]):'؟',cx,ay+4)}}
  if(seg.game==='mystery'){const m=G().mystery;const b=m.picks[p.id];if(b)chip('جعبه '+fa(b)+' · قفل',x+W-100,ay,24,p.color,'#111')}}
function mysteryStrip(){const m=G().mystery;const w=74,gap=14,total=6*w+5*gap;const x0=960+total/2-w/2,y=54+250;for(let i=0;i<6;i++){const box=i+1;const opened=m.opened[box];const res=opened&&m.dist?m.dist[i]:null;const picked=Object.entries(m.picks).find(([k,v])=>v===box);
  g.save();g.globalAlpha=opened?.55:1;boxShape(x0-i*(w+gap),y,w,box,picked?pl(picked[0]).color:TH().accent,opened?1:0,null,0);if(res){g.font=UF(22,900);g.fillStyle=res.k==='gain'?'#39ff88':res.k==='steal'?'#ff5a5a':'#ddd';g.textAlign='center';g.fillText(res.k==='gain'?'+'+fa(res.v):res.k==='steal'?'دزدی':'پوچ',x0-i*(w+gap),y+62)}g.restore()}}
SC.play=(t,seg)=>{const th=TH();bug();const lab=(seg.subtitle?seg.subtitle+' · ':'')+seg.title;const tw=chip(lab,0,-999,30,th.accent,th.bg1,1,true);chip(lab,1920-96-tw/2,54+50,30,th.accent,th.bg1,eo(ph(t,0,.5)));
  drawTimer();if(seg.game==='mystery'&&G().mystery.dist)mysteryStrip();bankCards(seg);
  if(st.hold){const a=(performance.now()/1000-st.hold.t0)/st.hold.dur;if(a>=1.4)st.hold=null;else{g.save();g.globalAlpha=a>1?cl((1.4-a)/.4):1;g.beginPath();g.arc(960,520,150,0,7);g.fillStyle=hexA(th.bg1,.9);g.fill();g.beginPath();g.arc(960,520,130,-Math.PI/2,-Math.PI/2+Math.PI*2*cl(a));g.strokeStyle=a>=1?'#22c55e':th.accent2;g.lineWidth=20;g.lineCap='round';g.stroke();bigText(a>=1?'✓':fa(Math.max(0,Math.ceil(st.hold.dur*(1-a)))),960,528,a>=1?140:150,{fill:a>=1?'#22c55e':th.ink,depth:4});g.restore()}}};
SC.bank=(t,seg)=>{const th=TH();bug();const hy=eo(ph(t,0,.7));bigText(seg.title||'بانک زمان',960,170-(1-hy)*60,fit(seg.title||'بانک زمان',1500,110),{alpha:hy});if(seg.subtitle)chip(seg.subtitle,960,275,34,th.accent,th.bg1,eo(ph(t,.3,.5)));
  const ps=P.players;const max=Math.max(P.startBank,...ps.map(p=>bankOf(p.id)),1);const n=ps.length;const colW=Math.min(420,1500/n);const base=920;
  ps.forEach((p,i)=>{const x=960+(n-1)*colW/2-i*colW;const v=bankOf(p.id);const k=eo(ph(t,.5+i*.2,1.4));const hh=(v/max)*460*k;
    const lg=g.createLinearGradient(0,base-hh,0,base);lg.addColorStop(0,mix(p.color,'#ffffff',.25));lg.addColorStop(1,mix(p.color,'#000000',.35));g.fillStyle=lg;rr(x-colW*.3,base-hh,colW*.6,Math.max(hh,4),24);g.fill();
    bigText(fa(Math.round(v*k)),x,base-hh-70,110,{fill:th.ink});g.font=UF(30,800);g.fillStyle=hexA(th.ink,.7);g.textAlign='center';g.fillText(P.unit,x,base-hh-5);
    bigText(p.symbol+'  '+p.name,x,base+70,64,{fill:p.color,depth:4})})};
SC.dialogue=(t,seg)=>{const th=TH();bug();const k=eo(ph(t,0,.7));if(seg.title)bigText(seg.title,960,420-(1-k)*50,fit(seg.title,1500,120),{alpha:k});if(seg.subtitle)chip(seg.subtitle,960,560,34,th.accent,th.bg1,eo(ph(t,.3,.6)))};
SC.card=(t,seg)=>{const th=TH();bug();const k=eo(ph(t,0,.8));bigText(seg.title||'',960,330-(1-k)*50,fit(seg.title||' ',1600,130),{alpha:k});
  if(seg.subtitle){const ls=wrap(seg.subtitle,1300,UF(48,700));g.save();g.globalAlpha=eo(ph(t,.4,.7));g.font=UF(48,700);g.fillStyle=th.ink;g.textAlign='center';g.direction='rtl';g.textBaseline='middle';ls.slice(0,5).forEach((l,i)=>g.fillText(l,960,500+i*76));g.restore()}};
SC.winner=(t,seg)=>{const th=TH();const R=2.8;let w=null;if(seg.winner)w=P.players.find(p=>p.name===seg.winner)||{name:seg.winner,color:th.accent,symbol:'★'};else if(G().champion)w=pl(G().champion);else{const l=leader();w=l&&l.p}
  const idle=st.live<0||P.segments[st.live]!==seg;const tt=idle?Math.max(t,R+2):t;g.fillStyle='rgba(0,0,0,.35)';g.fillRect(0,0,1920,1080);
  const sx=tt<R?960+Math.sin(tt*2.4)*560:960;g.save();g.globalCompositeOperation='lighter';const lg=g.createLinearGradient(0,0,0,1000);lg.addColorStop(0,hexA(th.ink,.35));lg.addColorStop(1,hexA(th.ink,0));g.fillStyle=lg;g.beginPath();g.moveTo(sx-60,-20);g.lineTo(sx+60,-20);g.lineTo(sx+(tt<R?300:520),1000);g.lineTo(sx-(tt<R?300:520),1000);g.closePath();g.fill();g.restore();
  if(tt<R){bigText(seg.title||'و برنده...',960,520,fit(seg.title||'و برنده...',1500,130),{alpha:.6+.4*Math.abs(Math.sin(tt*5))});return}
  const k=eo(ph(tt,R,.8));rays(960,500,tt,k,w?w.color:th.accent);chip(seg.title||'برنده',960,240,38,th.accent2,th.bg1,k);
  if(w){g.save();g.translate(960,500);const sc=1.6-.6*k;g.scale(sc,sc);bigText((w.symbol?w.symbol+' ':'')+w.name,0,0,fit(w.name,1400,230),{alpha:k,shade:w.color,glow:hexA(w.color,.6)});g.restore();
    if(w.id)bigText(fa(bankOf(w.id))+' '+P.unit,960,690,72,{alpha:eo(ph(tt,R+.5,.6)),fill:th.accent2,depth:5})}
  if(seg.subtitle)chip(seg.subtitle,960,810,40,th.accent,th.bg1,eo(ph(tt,R+.8,.6)));confetti(R,tt);
  if(!idle&&t>=R&&t<R+.35){g.fillStyle=hexA(th.ink,(1-(t-R)/.35)*.9);g.fillRect(0,0,1920,1080)}};

/* ================= overlays: event FX, VAR, subtitles, transitions ================= */
function drawFX(){const now=performance.now()/1000;const th=TH();st.fx=st.fx.filter(f=>now-f.t0<(f.kind==='vault'?9:f.kind==='mystery'?5.2:f.kind==='sabotage'?4.5:3));
  for(const f of st.fx){const a=now-f.t0;const p=f.data.pid?pl(f.data.pid):null;const col=p?p.color:th.accent;
    if(f.kind==='gain'||f.kind==='loss'){const inK=eo(a/.35),out=a>2.4?cl((3-a)/.6):1;g.save();g.globalAlpha=out;g.translate(0,(1-inK)*-160);const w=1100,h=150,x=960-w/2,y=250;g.save();g.translate(960,y+h/2);g.rotate(-.03);g.translate(-960,-(y+h/2));
      rr(x,y,w,h,30);g.fillStyle=f.kind==='gain'?col:'#2a0b0e';g.fill();g.lineWidth=6;g.strokeStyle=f.kind==='gain'?th.accent2:'#ff4d4d';g.stroke();g.restore();
      bigText(`${f.data.delta>0?'+':'−'}${fa(Math.abs(f.data.delta))} ${P.unit}`,960+170,y+h/2+4,96,{fill:f.kind==='gain'?th.ink:'#ff6b6b',depth:5});g.font=F(64);g.fillStyle=f.kind==='gain'?'#130a0c':th.ink;g.textAlign='center';g.textBaseline='middle';g.fillText((p?p.symbol+' '+p.name:''),960-300,y+h/2+4);
      if(f.data.reason){chip(f.data.reason,960,y+h+42,26,th.bg1,th.ink,1)}g.restore()}
    else if(f.kind==='lock'||f.kind==='power'||f.kind==='miss'){const out=a>2.2?cl((3-a)/.8):1;const k=eo(a/.3);g.save();g.globalAlpha=out;g.translate(960,400);g.scale(.8+.2*k,.8+.2*k);const txt=f.kind==='lock'?'قفل شد · '+f.data.text:f.kind==='power'?`قفل شد · ${p.name}: ${f.data.name}${f.data.cost?' (−'+fa(f.data.cost)+')':''}`:`✕  ${p?p.name:''}`;
      const w=chip(txt,0,-999,48,0,0,1,true);chip(txt,0,0,48,f.kind==='miss'?'#ef4444':(f.data.col||col),'#111');g.restore()}
    else if(f.kind==='mystery'){const it=f.data.res;const out=a>4.4?cl((5.2-a)/.8):1;g.save();g.globalAlpha=out;g.fillStyle='rgba(5,3,4,.72)';g.fillRect(0,0,1920,1080);const open=eo(ph(a,1.6,.7));const shake=a<1.6?Math.sin(a*40)*(a/1.6)*10:0;
      if(open>0)rays(960,560,a,open,it.k==='gain'?'#39ff88':it.k==='steal'?'#ff4d4d':'#888888',16);boxShape(960+shake,600,360,f.data.box,col,open,it,shake*.004);bigText(p.symbol+' '+p.name+' · جعبه '+fa(f.data.box),960,210,70,{fill:th.ink});
      if(open>.5)bigText(it.k==='gain'?'جایزه!':it.k==='steal'?'دزدی از حریف!':'پوچ!',960,920,110,{fill:it.k==='gain'?'#39ff88':it.k==='steal'?'#ff5a5a':'#dddddd',alpha:cl((open-.5)*2)});g.restore()}
    else if(f.kind==='sabotage'){const out=a>3.8?cl((4.5-a)/.7):1;const flip=eo(ph(a,.5,.8));g.save();g.globalAlpha=out;g.fillStyle='rgba(20,0,4,.7)';g.fillRect(0,0,1920,1080);g.translate(960,560);g.scale(Math.abs(Math.cos(Math.PI*(1-flip)/1))*1||.01,1);
      panel(-300,-380,600,760,40,flip>.5?'#1a0508':th.bg1,flip>.5?'#ff4d4d':th.accent2);if(flip>.5){vIcon('skull',0,-190,190,{col:'#ff4d4d'});g.textAlign='center';g.textBaseline='middle';const ls=wrap(f.data.card,520,F(72));ls.forEach((l,i)=>bigText(l,0,20+i*96,72,{fill:'#ff6b6b',depth:4}));g.font=UF(34,800);g.fillStyle=th.ink;g.fillText('برای '+p.name,0,310)}else{bigText('؟',0,0,300,{fill:th.accent2})}g.restore()}
    else if(f.kind==='code'){const out=a>2.4?cl((3-a)/.6):1;g.save();g.globalAlpha=out;g.translate(960,470);const k=eo(a/.4);g.scale(.6+.4*k,.6+.4*k);panel(-230,-190,460,380,36,th.bg1,th.accent2);g.font=UF(34,900);g.fillStyle=hexA(th.ink,.8);g.textAlign='center';g.textBaseline='middle';g.direction='rtl';g.fillText(`${p.name} · رمز ${fa(f.data.stage)}`,0,-120);bigText(fa(f.data.digit),0,40,230,{fill:th.accent2});g.restore()}
    else if(f.kind==='vault'){const out=a>8?cl(9-a):1;g.save();g.globalAlpha=out;g.fillStyle='rgba(8,5,0,.78)';g.fillRect(0,0,1920,1080);illus('vault',Math.min(a,2.2)+(a>2.2?a-2.2:0),960,470,1.1,a>1.2?3:Math.floor(a/.4));if(a>1.9){bigText('کیف طلایی باز شد!',960,930,100,{fill:'#ffd23f',alpha:eo(ph(a,1.9,.6))});bigText(p.symbol+' '+p.name,960,110,90,{fill:p.color,alpha:eo(ph(a,2.1,.6))})}confetti(1.8,a);g.restore()}
    else if(f.kind==='var-off'){const out=cl((3-a)/.8);g.save();g.globalAlpha=out;chip('✓ بازبینی تمام شد · تصمیم نهایی',960,190,40,'#22c55e','#081a0d');g.restore()}}
  if(G().var){const t=now;g.save();g.fillStyle='rgba(0,0,0,.25)';g.fillRect(0,0,1920,1080);g.globalCompositeOperation='lighter';const y=(t*420)%1180-50;const lg=g.createLinearGradient(0,y-60,0,y+60);lg.addColorStop(0,'rgba(0,200,255,0)');lg.addColorStop(.5,'rgba(0,200,255,.28)');lg.addColorStop(1,'rgba(0,200,255,0)');g.fillStyle=lg;g.fillRect(0,y-60,1920,120);g.restore();
    g.save();g.strokeStyle='rgba(0,220,255,.8)';g.lineWidth=8;const c=60;[[70,70,1,1],[1850,70,-1,1],[70,1010,1,-1],[1850,1010,-1,-1]].forEach(([x,y,sx,sy])=>{g.beginPath();g.moveTo(x,y+sy*c);g.lineTo(x,y);g.lineTo(x+sx*c,y);g.stroke()});g.restore();
    const blink=Math.sin(t*6)>0;chip((blink?'● ':'  ')+'بازبینی ویدیویی VAR · نتیجه واضح نیست',960,190,40,'#00b8e6','#001018')}}
function drawSub(seg){const ln=st.line;if(!ln||!ln.text)return;const th=TH();const size=P.layout.sub;const font=UF(size,800);const lines=wrap(ln.text,1500,font).slice(0,3);
  const lh=size*1.5,h=lines.length*lh+size*.9;const bottomBusy=(seg.type==='play')&&P.layout.score==='bottom'&&P.players.length;const y0=(bottomBusy?1080-54-170-34:1080-80)-h;
  const a=eo((st.vt-st.lineT0)/.3);g.save();g.globalAlpha=a;g.translate(0,(1-a)*24);g.font=font;const maxW=Math.max(...lines.map(l=>g.measureText(l).width));const bw=maxW+size*1.6;
  rr(960-bw/2,y0,bw,h,size*.45);g.fillStyle='rgba(10,6,8,.82)';g.fill();
  const sp=spk(ln.speaker);if(sp&&(P.speakers.length>1||seg.type==='dialogue')){g.font=UF(size*.6,900);const cw=g.measureText(sp.name).width+size*.9;rr(960+bw/2-cw-size*.4,y0-size*.62,cw,size*.95,size*.3);g.fillStyle=th.accent;g.fill();g.fillStyle=th.bg1;g.textAlign='center';g.textBaseline='middle';g.fillText(sp.name,960+bw/2-cw/2-size*.4,y0-size*.14)}
  const prog=cl((st.vt-st.lineT0)/Math.max(.5,st.lineDur));const total=lines.reduce((s,l)=>s+l.length,0);let acc=0;
  g.font=font;g.textAlign='center';g.textBaseline='middle';g.direction='rtl';
  lines.forEach((l,i)=>{const y=y0+size*.45+lh*i+lh/2;const w=g.measureText(l).width;const lp=cl((prog*total-acc)/l.length);acc+=l.length;
    g.fillStyle=hexA(th.ink,.55);g.fillText(l,960,y);g.save();g.beginPath();g.rect(960+w/2-w*lp-2,y-lh/2,w*lp+4,lh);g.clip();g.fillStyle=th.ink;g.fillText(l,960,y);g.restore()});g.restore()}
function drawWipe(t){const th=TH();const p=eq(t/.45);if(p>=1)return;[[th.accent2,0],[th.accent,120]].forEach(([c,o])=>{const x=1920+500+o-p*(1920+1300);g.fillStyle=c;g.beginPath();g.moveTo(x,0);g.lineTo(x+380,0);g.lineTo(x+80,1080);g.lineTo(x-300,1080);g.closePath();g.fill()})}
function draw(){const s=cv.width/1920;g.setTransform(s,0,0,s,0,0);g.globalAlpha=1;g.globalCompositeOperation='source-over';g.direction='rtl';
  const i=st.live>=0?st.live:st.sel;const seg=P.segments[i];const t=st.live>=0?st.vt-st.segT0:(seg&&(seg.type==='intro'||seg.type==='title')?4:3.6);
  if(!seg){drawBG(0);bigText('یک مرحله اضافه کنید',960,540,90);return}
  drawBG(t,P.layout.green&&seg.type==='play');(SC[seg.type]||SC.card)(t,seg);drawFX();if(st.live>=0){drawSub(seg);if(seg.type!=='countdown'&&seg.type!=='title'&&seg.type!=='intro')drawWipe(t)}}
