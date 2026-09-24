/* DADASHMODE v4 · broadcast VFX
   - CICON: vector icon library drawn on the canvas (replaces emoji, looks identical on every device, sharp at 4K)
   - visual BLUEPRINTS: any new challenge the AI reads from a script gets its own animated illustration (not single-use)
   - per-challenge THEME override
   - camera shake, flash, particle bursts, pseudo-bloom glow, stinger transitions tied to game events */
'use strict';
const CICON={
trophy:'M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z',
cup:'M5 4h14l-2 16a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 4ZM6 9h12',
ball:'M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20M2.5 9.5c5 1 14 1 19 0M2.5 14.5c5-1 14-1 19 0M12 2c-3 5-3 15 0 20M12 2c3 5 3 15 0 20',
hoop:'M3 7h18M5 7l2 12h10l2-12M9 7l1 12M15 7l-1 12M5.5 11h13',
box:'M21 8l-9-5-9 5v8l9 5 9-5V8ZM3 8l9 5 9-5M12 13v8',
gift:'M3 8h18v4H3zM12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5',
hand:'M18 11V6a2 2 0 0 0-4 0M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15',
glove:'M7 22h9v-3c2.5-1.5 4-4.5 4-8a3 3 0 0 0-6 0V5a3 3 0 0 0-6 0v9l-1.8-1.8a2 2 0 0 0-2.9 2.8L7 19v3ZM7 19h9',
puzzle:'M19.44 7.85c-.05.32.06.65.29.88l1.57 1.57c.47.47.7 1.09.7 1.7s-.23 1.24-.7 1.71l-1.61 1.61a.98.98 0 0 1-.84.28c-.47-.07-.8-.48-.97-.93a2.5 2.5 0 1 0-3.21 3.22c.45.16.85.5.92.97a.98.98 0 0 1-.27.83l-1.61 1.61a2.4 2.4 0 0 1-3.41 0l-1.57-1.57a1.03 1.03 0 0 0-.88-.29c-.49.07-.84.5-1.02.97a2.5 2.5 0 1 1-3.24-3.24c.46-.18.9-.53.97-1.02a1.03 1.03 0 0 0-.29-.88l-1.57-1.57A2.4 2.4 0 0 1 2 12c0-.62.24-1.23.7-1.7L4.23 8.77c.24-.24.58-.35.92-.3.51.07.88.53 1.07 1.01a2.5 2.5 0 1 0 3.26-3.26c-.48-.2-.93-.56-1.01-1.07-.05-.34.06-.68.3-.92l1.53-1.53A2.4 2.4 0 0 1 12 2c.62 0 1.23.24 1.7.7l1.57 1.57c.23.23.56.34.88.29.49-.07.84-.5 1.02-.97a2.5 2.5 0 1 1 3.24 3.24c-.46.18-.9.53-.97 1.02Z',
lock:'M5 11h14v11H5zM7 11V7a5 5 0 0 1 10 0v4M12 15v3',
unlock:'M5 11h14v11H5zM7 11V7a5 5 0 0 1 9.9-1M12 15v3',
briefcase:'M3 7h18v13H3zM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M3 13h18M11 12h2v3h-2z',
brain:'M12 5a3 3 0 1 0-6 .13 4 4 0 0 0-2.53 5.77 4 4 0 0 0 .56 6.59A4 4 0 1 0 12 18ZM12 5a3 3 0 1 1 6 .13 4 4 0 0 1 2.53 5.77 4 4 0 0 1-.56 6.59A4 4 0 1 1 12 18ZM12 5v13',
pencil:'M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5zM15 5l4 4',
eye:'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12ZM12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6',
blind:'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12ZM3 3l18 18M2 9h20',
clock:'M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20M12 6v6l4 2',
zap:'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
skull:'M12 2a8 8 0 0 0-8 8c0 3 1.5 5 3 6v4h10v-4c1.5-1 3-3 3-6a8 8 0 0 0-8-8ZM9 10.5h.01M15 10.5h.01M10 20v-3M14 20v-3M11 14l1-1.5 1 1.5',
card:'M5 3h14v18H5zM9 8h6M9 12h6M9 16h3',
star:'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
bottle:'M10 2h4v4l2 3v12a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9l2-3V2zM8 13h8',
target:'M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20M12 6a6 6 0 1 0 0 12a6 6 0 1 0 0-12M12 10a2 2 0 1 0 0 4a2 2 0 1 0 0-4',
dice:'M4 4h16v16H4zM8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01',
food:'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3v7',
key:'M2 15.5a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0-11 0M11.4 11.6L21 2M15.5 7.5l3 3M18 5l3 3',
crown:'M2 19h20M3 19l-1-12 6 4 4-8 4 8 6-4-1 12',
flame:'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z',
heart:'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z',
mic:'M9 2h6v11a3 3 0 0 1-6 0zM5 10v1a7 7 0 0 0 14 0v-1M12 18v4',
camera:'M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3zM12 10a3 3 0 1 0 0 6a3 3 0 1 0 0-6',
run:'M14 3a2 2 0 1 0 0 .01M5 20l3-5 3 2 1-5 4 3 3-1M8 11l3-3 3 1 2 3',
question:'M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01',
check:'M20 6L9 17l-5-5',x:'M18 6L6 18M6 6l12 12',
music:'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0a3 3 0 1 1 6 0M21 16a3 3 0 1 1-6 0a3 3 0 1 1 6 0',
sword:'M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2',
shield:'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
sparkle:'M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3z',
gavel:'M14 13l-7.5 7.5a2.12 2.12 0 0 1-3-3L11 10M16 16l6-6M8 8l6-6M9 7l8 8M21 11l-8-8',
robot:'M12 8V4H8M4 8h16v12H4zM2 14h2M20 14h2M9 13v2M15 13v2',
coin:'M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20M15 8.5a3 3 0 0 0-3-1.5c-1.7 0-3 .9-3 2.2 0 3 6 1.6 6 4.6 0 1.3-1.3 2.2-3 2.2a3.3 3.3 0 0 1-3-1.6M12 5v2M12 17v2'};
const _PATH={};
function vIcon(name,x,y,size,o={}){const d=CICON[name]||CICON.star;const p=_PATH[name]||(_PATH[name]=new Path2D(d));const s=size/24;
  g.save();g.translate(x-size/2,y-size/2);g.scale(s,s);g.lineCap='round';g.lineJoin='round';g.lineWidth=o.lw||2.2;
  if(o.glow!==false){g.shadowColor=o.glowCol||hexA(o.col||'#fff',.55);g.shadowBlur=o.blur||10}
  if(o.fill){g.fillStyle=o.fill;g.fill(p)}g.strokeStyle=o.col||TH().ink;g.stroke(p);g.restore()}
function badge(x,y,r,icon,col,o={}){const th=TH();g.save();if(o.alpha!=null)g.globalAlpha*=o.alpha;
  if(o.hl){g.save();g.globalCompositeOperation='lighter';const gl=g.createRadialGradient(x,y,r*.6,x,y,r*1.8);gl.addColorStop(0,hexA(col,.55));gl.addColorStop(1,hexA(col,0));g.fillStyle=gl;g.beginPath();g.arc(x,y,r*1.8,0,7);g.fill();g.restore()}
  const gr=g.createLinearGradient(x,y-r,x,y+r);gr.addColorStop(0,mix(col,'#ffffff',.28));gr.addColorStop(1,mix(col,'#000000',.45));
  g.beginPath();g.arc(x,y+r*.08,r,0,7);g.fillStyle=hexA('#000000',.35);g.fill();g.beginPath();g.arc(x,y,r,0,7);g.fillStyle=gr;g.fill();
  g.lineWidth=Math.max(3,r*.07);g.strokeStyle=o.hl?th.accent2:hexA('#ffffff',.35);g.stroke();
  g.beginPath();g.ellipse(x,y-r*.45,r*.7,r*.32,0,0,7);g.fillStyle=hexA('#ffffff',.12);g.fill();
  vIcon(icon,x,y,r*1.15,{col:o.ink||th.ink,lw:2.1,blur:12});
  if(o.label){g.font=F(Math.round(r*.46));g.textAlign='center';g.textBaseline='middle';g.lineWidth=r*.1;g.strokeStyle='#120a0c';g.strokeText(o.label,x,y+r*1.45);g.fillStyle=o.hl?th.accent2:th.ink;g.fillText(o.label,x,y+r*1.45)}
  g.restore()}

/* ---------- blueprint illustration for any challenge ---------- */
ILL.generic=(t,cx,cy,s,step,seg)=>{const th=TH();const v=(seg&&seg.visual)||{icon:'trophy',layout:'single',count:1,labels:[]};const col=v.accent||th.accent;const n=cl(v.count||1,1,12);const L=v.labels||[];
  const hl=i=>step>=0&&(i===step%n);const idle=st.live<0;const pop=i=>idle?1:eo(ph(t,.08+i*.09,.5));
  const lay=v.layout||'single';
  if(lay==='single'){rays(cx,cy,t,1,th.accent2,14);const k=eo(ph(t,0,.6));g.save();g.translate(cx,cy);g.rotate(Math.sin(t*1.2)*.04);g.scale(.6+.4*k,.6+.4*k);badge(0,0,150*s,v.icon,col,{hl:true,label:L[0]});g.restore();if(v.icon2)badge(cx+170*s,cy-130*s,60*s,v.icon2,th.accent2,{alpha:eo(ph(t,.5,.5))});return}
  if(lay==='row'||lay==='grid'){const per=lay==='row'?n:Math.min(4,Math.ceil(Math.sqrt(n)));const rows=Math.ceil(n/per);const r=Math.min(80,430/per/2.3,300/rows/2.3)*s*1.3;
    for(let i=0;i<n;i++){const row=Math.floor(i/per),colI=i%per,inRow=Math.min(per,n-row*per);const x=cx+((inRow-1)/2-colI)*r*2.35;const y=cy+(row-(rows-1)/2)*r*2.8-(L.length?r*.3:0);const k=pop(i);
      g.save();g.translate(x,y+(1-k)*80*s);g.scale(k,k);badge(0,Math.sin(t*2+i)*4*s,r,i%2&&v.icon2?v.icon2:v.icon,hl(i)?th.accent2:col,{hl:hl(i),label:L[i]});g.restore()}return}
  if(lay==='tower'){const rows=[];let left=n,w=1;while(left>0){rows.unshift(Math.min(w,left));left-=w;w++}rows.reverse();const base=Math.max(...rows);const r=Math.min(70,480/base/2.1)*s*1.5;let k=0;
    rows.forEach((cnt,ri)=>{for(let i=0;i<cnt;i++){const x=cx+((cnt-1)/2-i)*r*2.1,y=cy+130*s-ri*r*1.95;const a=idle?1:eo(ph(t,.1+k*.12,.45));g.save();g.translate(x,y-(1-a)*160*s);g.globalAlpha*=a;badge(0,0,r,v.icon,hl(k)?th.accent2:col,{hl:hl(k)});g.restore();k++}});return}
  if(lay==='ring'){const R=230*s;badge(cx,cy,95*s,v.icon2||v.icon,th.accent2,{hl:true});for(let i=0;i<n;i++){const a=t*.35+i/n*Math.PI*2;const k=pop(i);badge(cx+Math.cos(a)*R*k,cy+Math.sin(a)*R*.72*k,52*s,v.icon,hl(i)?th.accent2:col,{hl:hl(i),label:L[i],alpha:k})}return}
  if(lay==='versus'){const ps=P.players.slice(0,2);const k=eo(ph(t,0,.6));[0,1].forEach(i=>{const p=ps[i]||{color:col,name:''};const x=cx+(i?-1:1)*(260*s)*(1-(1-k)*.6);badge(x,cy,130*s,v.icon,p.color,{hl:hl(i),label:L[i]||p.name})});
    const vk=eo(ph(t,.4,.4));g.save();g.translate(cx,cy);g.scale(1.6-.6*vk,1.6-.6*vk);g.globalAlpha*=vk;bigText('VS',0,0,120*s,{fill:th.accent2,glow:hexA(th.accent2,.6)});g.restore();return}
  if(lay==='cards'){for(let i=0;i<n;i++){const a=(i-(n-1)/2)*.15;const k=pop(i);g.save();g.translate(cx,cy+380*s);g.rotate(a*k);g.translate(0,-470*s-(hl(i)?40*s:0));g.globalAlpha*=k*(step<0||hl(i)?1:.45);
      const cw=170*s,ch=250*s;panel(-cw/2,-ch/2,cw,ch,18*s,th.bg1,hl(i)?th.accent2:col);vIcon(v.icon,0,-30*s,90*s,{col:hl(i)?th.accent2:th.ink});if(L[i]){const fs=fit(L[i],cw-20*s,40*s);g.font=F(fs);g.fillStyle=th.ink;g.textAlign='center';g.textBaseline='middle';g.fillText(L[i],0,70*s)}g.restore()}return}
  if(lay==='timer'){const R=190*s;const p=1-((t*.18)%1);g.save();g.beginPath();g.arc(cx,cy,R,0,7);g.strokeStyle=hexA(th.ink,.12);g.lineWidth=26*s;g.stroke();g.beginPath();g.arc(cx,cy,R,-Math.PI/2,-Math.PI/2+Math.PI*2*p);g.strokeStyle=col;g.lineCap='round';g.stroke();g.restore();
    badge(cx,cy,110*s,v.icon,col,{hl:true});L.slice(0,4).forEach((l,i)=>chip(l,cx+(i%2?-1:1)*(R+150*s),cy+(i<2?-1:1)*90*s,30*s,th.accent,th.bg1,eo(ph(t,.4+i*.15,.4))));return}
  if(lay==='path'){const pts=[];for(let i=0;i<n;i++){const u=n===1?.5:i/(n-1);pts.push([cx+(.5-u)*640*s,cy+Math.sin(u*Math.PI*2)*110*s])}
    g.save();g.strokeStyle=hexA(th.ink,.25);g.lineWidth=10*s;g.setLineDash([18*s,16*s]);g.lineDashOffset=-t*60;g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();g.restore();
    pts.forEach(([x,y],i)=>{const k=pop(i);g.save();g.translate(x,y);g.scale(k,k);badge(0,0,62*s,i===n-1&&v.icon2?v.icon2:v.icon,hl(i)||(step>i)?th.accent2:col,{hl:hl(i),label:L[i]||fa(i+1)});g.restore()});return}};

/* ---------- per-challenge theme ---------- */
const _thc={};TH=()=>{const i=st.live>=0?st.live:st.sel;const s=P&&P.segments[i];const name=s&&s.theme;if(!name)return P.theme;const key=name+'|'+P.theme.font;if(_thc.key!==key||_thc.base!==P.theme){const t=THEMES.find(x=>x.name===name);_thc.key=key;_thc.base=P.theme;_thc.val=t?Object.assign({},P.theme,t,{font:P.theme.font}):P.theme}return _thc.val};

/* ---------- post FX ---------- */
const VFX={sh:{a:0,t0:0,d:.4},fl:{c:'#fff',a:0,t0:0,d:.3},parts:[],small:null};
const nowS=()=>performance.now()/1000;
function vfxShake(a=18,d=.45){if(S.bloom===false)a*=.5;VFX.sh={a,t0:nowS(),d}}
function vfxFlash(c='#ffffff',a=.8,d=.35){VFX.fl={c,a,t0:nowS(),d}}
function vfxBurst(x,y,col,n=70,power=1){const th=TH();const cols=[col||th.accent,th.accent2,th.ink];for(let i=0;i<n;i++){const ang=Math.random()*Math.PI*2,sp=(300+Math.random()*900)*power;VFX.parts.push({x,y,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp-300*power,r:3+Math.random()*7,c:cols[i%3],t0:nowS(),life:.9+Math.random()*.9,rot:Math.random()*6,sq:Math.random()<.5})}if(VFX.parts.length>900)VFX.parts.splice(0,VFX.parts.length-900)}
function vfxPre(){const e=nowS()-VFX.sh.t0;if(e<VFX.sh.d&&VFX.sh.a>0){const k=(1-e/VFX.sh.d)**2;const a=VFX.sh.a*k;const dx=(Math.random()*2-1)*a,dy=(Math.random()*2-1)*a,r=(Math.random()*2-1)*a*.0009;const sc=1+a/700;g.translate(960,540);g.rotate(r);g.scale(sc,sc);g.translate(-960+dx,-540+dy)}}
function vfxPost(){const now=nowS();
  if(VFX.parts.length){g.save();g.globalCompositeOperation='lighter';VFX.parts=VFX.parts.filter(p=>now-p.t0<p.life);for(const p of VFX.parts){const a=now-p.t0;const x=p.x+p.vx*a,y=p.y+p.vy*a+700*a*a;g.globalAlpha=cl(1-a/p.life);g.fillStyle=p.c;if(p.sq){g.save();g.translate(x,y);g.rotate(p.rot+a*8);g.fillRect(-p.r,-p.r*.6,p.r*2,p.r*1.2);g.restore()}else{g.beginPath();g.arc(x,y,p.r*(1-a/p.life*.5),0,7);g.fill()}}g.restore()}
  if(S.bloom!==false){try{if(!VFX.small){VFX.small=document.createElement('canvas');VFX.small.width=480;VFX.small.height=270;VFX.sctx=VFX.small.getContext('2d')}const sx=VFX.sctx;sx.globalCompositeOperation='copy';sx.filter='brightness(.85) contrast(2.4) blur(7px)';sx.drawImage(cv,0,0,480,270);sx.filter='none';
      g.save();g.setTransform(cv.width/1920,0,0,cv.width/1920,0,0);g.globalCompositeOperation='screen';g.globalAlpha=.32;g.drawImage(VFX.small,0,0,1920,1080);g.restore()}catch(e){}}
  const fe=now-VFX.fl.t0;if(fe<VFX.fl.d&&VFX.fl.a>0){g.save();g.setTransform(cv.width/1920,0,0,cv.width/1920,0,0);g.globalCompositeOperation='screen';g.globalAlpha=VFX.fl.a*(1-fe/VFX.fl.d)**1.5;g.fillStyle=VFX.fl.c;g.fillRect(0,0,1920,1080);g.restore()}}
const _draw=draw;draw=function(){const s=cv.width/1920;g.setTransform(s,0,0,s,0,0);vfxPre();const _st=g.setTransform.bind(g);g.setTransform=function(){};try{_draw()}finally{g.setTransform=_st}g.setTransform(s,0,0,s,0,0);vfxPost()};

/* ---------- tie effects to show events ---------- */
function bankXY(pid){const i=P.players.findIndex(p=>p.id===pid);const n=P.players.length;const top=P.layout.score==='top';const W=n<=2?460:Math.min(380,(1920-192-24*(n-1))/n);let x;if(n<=2)x=i===0?1920-96-W:96;else{const total=W*n+24*(n-1);x=960+total/2-(i+1)*W-i*24}return [x+W/2,top?54+85:1080-54-85]}
const _fxPush=fxPush;fxPush=function(kind,data){_fxPush(kind,data);const p=data&&data.pid?pl(data.pid):null;const col=p?p.color:TH().accent;
  if(kind==='gain'){const[x,y]=bankXY(data.pid);vfxBurst(x,y,col,60,.8);vfxBurst(960,320,col,40,.6);vfxShake(7,.3)}
  else if(kind==='loss'){vfxShake(16,.45);vfxFlash('#ff2030',.22,.35)}
  else if(kind==='lock'||kind==='power'){vfxShake(9,.3);vfxBurst(960,400,data.col||col,36,.6)}
  else if(kind==='miss'){vfxShake(18,.45);vfxFlash('#ff1a1a',.28,.3)}
  else if(kind==='mystery'){setTimeout(()=>{vfxBurst(960,560,data.res&&data.res.k==='gain'?'#39ff88':data.res&&data.res.k==='steal'?'#ff4d4d':'#aaaaaa',110,1.1);vfxFlash('#ffffff',.5,.3);vfxShake(20,.5)},1600)}
  else if(kind==='sabotage'){setTimeout(()=>{vfxShake(22,.55);vfxFlash('#ff0030',.35,.4)},900)}
  else if(kind==='code'){vfxBurst(960,470,TH().accent2,80,.9);vfxShake(10,.35)}
  else if(kind==='vault'){setTimeout(()=>{vfxFlash('#fff3c0',.9,.6);vfxShake(28,.7);[[760,470],[960,420],[1160,470]].forEach(([x,y])=>vfxBurst(x,y,'#ffc53d',120,1.3))},1900)}
  else if(kind==='var'){vfxFlash('#00c8ff',.3,.4)}};
const _goLive=goLive;goLive=async function(i){await _goLive(i);const seg=P.segments[i];if(!seg)return;const th=TH();
  ({title:()=>{vfxFlash(th.ink,.75,.45);vfxShake(22,.6)},intro:()=>{at(.42,()=>{vfxShake(28,.6);vfxFlash(th.accent,.35,.3);vfxBurst(1920*.68,550,th.accent2,90,1.1)});at(1.15,()=>vfxShake(12,.35))},
    countdown:()=>{[.3,1.3,2.3].forEach(d=>at(d,()=>vfxShake(6,.2)));at(3.3,()=>{vfxFlash(th.accent2,.7,.4);vfxShake(26,.6);vfxBurst(960,540,th.accent2,140,1.3)})},
    winner:()=>at(2.8,()=>{vfxFlash('#ffffff',.85,.5);vfxShake(24,.6);vfxBurst(960,500,th.accent2,160,1.4)}),bank:()=>at(.4,()=>vfxShake(8,.3)),play:()=>vfxShake(10,.3),rules:()=>vfxShake(6,.25)}[seg.type]||(()=>{}))()};
