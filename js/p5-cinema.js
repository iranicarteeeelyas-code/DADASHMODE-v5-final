/* DADASHMODE v5 · PHASE 5 · cinematic looks + two output modes
   LOOKS (switchable per episode and per segment; «کلاسیک» = the original v4 look, untouched):
     cinema   · golden volumetric light, haze, bokeh depth, reflective stage
     arena    · 3D perspective grid, rotating wireframe, lasers (canvas, light on CPU)
     broadcast· LED wall, glass panels, light sweeps
     noir     · single spotlight, drifting fog, heartbeat pulse
     studio3d · real-time WebGL 3D studio (three.js, bundled offline): mirror floor, PBR gold, bloom, animated hero objects
   CINEMA POST (only on the full-screen output): virtual camera push-in, whip + light-leak transitions,
     anamorphic flare on every flash, colour grade, film grain, vignette, optional letterbox.
   OUTPUT:
     full   · what you have now (full-screen animation)
     chroma · key-colour background for CapCut (green or blue, auto-picked so no player/theme colour gets keyed out)
     dual   · ONE live run → TWO files at once: chroma (main take) + full-screen (…FULL…). Live games cannot be repeated,
              so this is the safe way to get both. Uses a GPU keyer; falls back to chroma-only if WebGL is missing. */
'use strict';
(function(){
const D=DM5,fa=D.fa,esc=D.esc;
const STYLES={classic:'کلاسیک (نسخهٔ فعلی)',cinema:'سینمایی طلایی',arena:'آرنای نئونی سه‌بعدی',broadcast:'استودیو پخش زنده',noir:'تریلر تعلیق',studio3d:'استودیو سه‌بعدی واقعی (WebGL)'};
const OUTS={full:'تمام‌صفحه (فعلی)',chroma:'کروما برای کپ‌کات',dual:'دوگانه: کروما + تمام‌صفحه هم‌زمان'};
const KEYS={green:['#00b140','سبز'],blue:['#0047bb','آبی']};
const DEF={style:'classic',perSeg:{},output:'full',key:'auto',keepFull:false,camera:.8,grain:.35,vignette:.55,grade:.6,flare:true,trans:true,letterbox:false,q3d:.66,post:'auto'};
const C=()=>{const p=D.P();if(!p)return Object.assign({},DEF);if(!p.cine)p.cine=Object.assign({},DEF);for(const k in DEF)if(p.cine[k]===undefined)p.cine[k]=DEF[k];return p.cine};
const nowS=()=>performance.now()/1000;
const hexRgb=h=>{h=(h||'#000').replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16);return[n>>16&255,n>>8&255,n&255]};
const rgba=(h,a)=>{const[r,g2,b]=hexRgb(h);return `rgba(${r},${g2},${b},${a})`};
const lerpHex=(a,b,k)=>{const A=hexRgb(a),B=hexRgb(b);return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*k).toString(16).padStart(2,'0')).join('')};
const ease=x=>{x=Math.max(0,Math.min(1,x));return x<.5?8*x**4:1-(-2*x+2)**4/2};
const rr=(i)=>{const x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x)};
const TH_=()=>{try{return TH()}catch(e){return (D.P()&&D.P().theme)||{bg1:'#12060a',bg2:'#4f0d1c',accent:'#ff3b3b',accent2:'#ffd23f',ink:'#fff7ec',shade:'#7a0f1f'}}};

/* ---------- which key colour is safe for this episode ---------- */
function keyInfo(){const c=C(),p=D.P();const th=TH_();const cols=[th.accent,th.accent2,th.ink,th.shade,...(p?p.players.map(x=>x.color):[])];
 const dist=k=>Math.min(...cols.map(h=>{const a=hexRgb(h),b=hexRgb(KEYS[k][0]);return Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2])}));
 const pick=c.key!=='auto'&&KEYS[c.key]?c.key:(dist('green')>=dist('blue')?'green':'blue');const d=dist(pick);
 const clash=cols.filter(h=>{const a=hexRgb(h),b=hexRgb(KEYS[pick][0]);return Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2])<110});return{name:pick,hex:KEYS[pick][0],label:KEYS[pick][1],min:d,clash}}
const outMode=()=>C().output||'full';
const styleFor=seg=>{const c=C();return (seg&&c.perSeg[seg.id])||c.style||'classic'};
const keyedScene=seg=>outMode()==='dual'||!(C().keepFull&&seg&&['title','intro'].includes(seg.type));

/* =============== background looks (ctx-agnostic so the dual compositor can reuse them) =============== */
const PARTS2=Array.from({length:80},(_,i)=>({x:rr(i)*1920,y:rr(i+99)*1080,r:1.5+rr(i+7)*4,s:12+rr(i+3)*40,a:.15+rr(i+5)*.45}));
function classicBG(x,t,th){/* faithful copy of v4 drawBG so the dual output can show the original look too */
 const rg=x.createRadialGradient(960,440,40,960,540,1250);rg.addColorStop(0,th.bg2);rg.addColorStop(1,th.bg1);x.fillStyle=rg;x.fillRect(0,0,1920,1080);
 x.save();x.globalCompositeOperation='lighter';x.translate(960,1200);for(let i=0;i<11;i++){const a=(i-5)*.17+Math.sin(t*.35+i*1.3)*.1;x.save();x.rotate(a);const lg=x.createLinearGradient(0,0,0,-1500);lg.addColorStop(0,rgba(i%2?th.accent:th.accent2,.15));lg.addColorStop(1,rgba(th.accent,0));x.fillStyle=lg;x.beginPath();x.moveTo(-18,0);x.lineTo(18,0);x.lineTo(140,-1500);x.lineTo(-140,-1500);x.closePath();x.fill();x.restore()}x.restore();
 x.save();x.strokeStyle=rgba(th.accent,.12);x.lineWidth=2;for(let i=-12;i<=12;i++){x.beginPath();x.moveTo(960+i*40,760);x.lineTo(960+i*260,1080);x.stroke()}for(let k=0;k<7;k++){const y=760+Math.pow(k/6,1.8)*320+((t*30)%46)*(k/6);x.beginPath();x.moveTo(0,y);x.lineTo(1920,y);x.stroke()}x.restore();
 x.save();for(const p of PARTS2){const y=(p.y-t*p.s)%1080;const yy=y<0?y+1080:y;x.fillStyle=rgba(th.ink,p.a*.55);x.beginPath();x.arc(p.x+Math.sin(t+p.x)*14,yy,p.r,0,7);x.fill()}x.restore();
 const vg=x.createRadialGradient(960,540,520,960,540,1150);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(4,2,3,.62)');x.fillStyle=vg;x.fillRect(0,0,1920,1080)}
const BOKEH=Array.from({length:38},(_,i)=>({x:rr(i+3)*1920,y:rr(i+41)*1080,z:rr(i+77),s:.2+rr(i+9)*.8,c:i%3}));
const DUST=Array.from({length:90},(_,i)=>({x:rr(i+501)*1920,y:rr(i+601)*1080,s:4+rr(i+701)*18,r:.8+rr(i+801)*2.2}));
function floor(x,th,y0=770,glow=.14){const fg=x.createLinearGradient(0,y0,0,1080);fg.addColorStop(0,rgba(th.shade,.55));fg.addColorStop(.2,rgba('#000000',.55));fg.addColorStop(1,'rgba(0,0,0,.9)');x.fillStyle=fg;x.fillRect(0,y0,1920,1080-y0);
 const pg=x.createRadialGradient(960,y0+40,10,960,y0+40,760);pg.addColorStop(0,rgba(th.accent2,glow));pg.addColorStop(1,rgba(th.accent2,0));x.save();x.globalCompositeOperation='lighter';x.fillStyle=pg;x.fillRect(0,y0-200,1920,600);x.fillStyle=rgba(th.ink,.22);x.fillRect(0,y0,1920,2);x.restore()}
function vignette(x,a){const vg=x.createRadialGradient(960,540,420,960,540,1180);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,`rgba(0,0,0,${a})`);x.fillStyle=vg;x.fillRect(0,0,1920,1080)}
const LOOK={};
LOOK.cinema=(x,t,th)=>{const rg=x.createRadialGradient(960,360,60,960,560,1350);rg.addColorStop(0,lerpHex(th.bg2,'#ffffff',.05));rg.addColorStop(.55,th.bg1);rg.addColorStop(1,'#000000');x.fillStyle=rg;x.fillRect(0,0,1920,1080);
 x.save();x.globalCompositeOperation='lighter';
 for(let i=0;i<4;i++){const cx=960+Math.sin(t*.07+i*1.7)*650,cy=320+Math.cos(t*.05+i)*140;const h=x.createRadialGradient(cx,cy,0,cx,cy,720);h.addColorStop(0,rgba(i%2?th.accent:th.accent2,.06));h.addColorStop(1,rgba(th.accent,0));x.fillStyle=h;x.fillRect(0,0,1920,1080)}
 for(let i=0;i<6;i++){const ox=260+i*280,a=-.42+i*.17+Math.sin(t*.28+i*1.9)*.06;x.save();x.translate(ox,-90);x.rotate(a);const lg=x.createLinearGradient(0,0,0,1500);lg.addColorStop(0,rgba(i%2?th.accent2:th.ink,.13));lg.addColorStop(.6,rgba(th.accent2,.035));lg.addColorStop(1,rgba(th.accent2,0));x.fillStyle=lg;x.beginPath();x.moveTo(-30,0);x.lineTo(30,0);x.lineTo(210,1500);x.lineTo(-210,1500);x.closePath();x.fill();x.restore()}
 x.restore();floor(x,th,770,.16);
 x.save();x.globalCompositeOperation='lighter';for(const b of BOKEH){const r=8+b.z*70;const px=(b.x+Math.sin(t*.1*b.s+b.x)*40-t*8*(1-b.z))%2020;const py=((b.y-t*b.s*14)%1180+1180)%1180-50;const col=[th.accent,th.accent2,th.ink][b.c];const gr=x.createRadialGradient(px,py,r*.1,px,py,r);gr.addColorStop(0,rgba(col,.05+.12*(1-b.z)));gr.addColorStop(.7,rgba(col,.03+.05*(1-b.z)));gr.addColorStop(1,rgba(col,0));x.fillStyle=gr;x.beginPath();x.arc(px<0?px+2020:px,py,r,0,7);x.fill()}
 for(const p of DUST){const y=((p.y-t*p.s)%1080+1080)%1080;x.fillStyle=rgba(th.ink,.22);x.fillRect(p.x+Math.sin(t*.7+p.x)*12,y,p.r,p.r)}x.restore();vignette(x,.7)};
const ICO=(()=>{const f=(1+Math.sqrt(5))/2;const v=[[-1,f,0],[1,f,0],[-1,-f,0],[1,-f,0],[0,-1,f],[0,1,f],[0,-1,-f],[0,1,-f],[f,0,-1],[f,0,1],[-f,0,-1],[-f,0,1]];const e=[];for(let i=0;i<12;i++)for(let j=i+1;j<12;j++){const d=Math.hypot(v[i][0]-v[j][0],v[i][1]-v[j][1],v[i][2]-v[j][2]);if(Math.abs(d-2)<.01)e.push([i,j])}return{v,e}})();
LOOK.arena=(x,t,th)=>{const bg=x.createLinearGradient(0,0,0,1080);bg.addColorStop(0,'#000000');bg.addColorStop(.55,th.bg1);bg.addColorStop(.56,lerpHex(th.bg1,'#000000',.4));bg.addColorStop(1,'#000000');x.fillStyle=bg;x.fillRect(0,0,1920,1080);
 const hz=600;x.save();x.globalCompositeOperation='lighter';const sg=x.createRadialGradient(960,hz,0,960,hz,900);sg.addColorStop(0,rgba(th.accent2,.35));sg.addColorStop(.25,rgba(th.accent,.12));sg.addColorStop(1,rgba(th.accent,0));x.fillStyle=sg;x.fillRect(0,0,1920,1080);
 x.lineWidth=2;const vgr=x.createLinearGradient(0,hz,0,1080);vgr.addColorStop(0,rgba(th.accent,0));vgr.addColorStop(1,rgba(th.accent,.55));x.strokeStyle=vgr;x.beginPath();for(let i=-22;i<=22;i++){x.moveTo(960+i*14,hz);x.lineTo(960+i*190,1080)}x.stroke()
 const off=(t*1.1)%1;x.strokeStyle=vgr;x.beginPath();for(let i=0;i<16;i++){const d=i-off;if(d<0)continue;const y=hz+480/(1+d*.85);x.moveTo(0,y);x.lineTo(1920,y)}x.stroke()
 const R=250,cz=900,fl=900,ay=t*.25,ax=t*.17;const P2=ICO.v.map(([a,b,c])=>{let X=a*R/1.9,Y=b*R/1.9,Z=c*R/1.9;let x1=X*Math.cos(ay)+Z*Math.sin(ay),z1=-X*Math.sin(ay)+Z*Math.cos(ay);let y1=Y*Math.cos(ax)-z1*Math.sin(ax),z2=Y*Math.sin(ax)+z1*Math.cos(ax);const k=fl/(cz+z2);return[960+x1*k,370+y1*k]});
 x.strokeStyle=rgba(th.accent2,.28);x.lineWidth=2.5;x.beginPath();ICO.e.forEach(([i,j])=>{x.moveTo(P2[i][0],P2[i][1]);x.lineTo(P2[j][0],P2[j][1])});x.stroke();
 for(let k=0;k<4;k++){const sx=k<2?0:1920,sy=1080;const a=(k%2?-1:1)*(.35+Math.sin(t*.8+k*1.3)*.25)+(k<2?-Math.PI/2+.5:-Math.PI/2-.5);const lg=x.createLinearGradient(sx,sy,sx+Math.cos(a)*1800,sy+Math.sin(a)*1800);lg.addColorStop(0,rgba(k%2?th.accent:th.accent2,.45));lg.addColorStop(1,rgba(th.accent,0));x.strokeStyle=lg;x.lineWidth=4;x.beginPath();x.moveTo(sx,sy);x.lineTo(sx+Math.cos(a)*1800,sy+Math.sin(a)*1800);x.stroke()}
 x.restore();vignette(x,.65)};
let LED=null;function ledMask(){if(LED)return LED;const m=document.createElement('canvas');m.width=960;m.height=340;const x=m.getContext('2d');x.fillStyle='#fff';for(let yi=0;yi<28;yi++)for(let xi=0;xi<80;xi++)x.fillRect(xi*12+2,yi*12,7.5,7.5);const l=document.createElement('canvas');l.width=960;l.height=340;LED={m,l,lx:l.getContext('2d')};return LED}
LOOK.broadcast=(x,t,th)=>{const bg=x.createLinearGradient(0,0,1920,1080);bg.addColorStop(0,th.bg1);bg.addColorStop(1,lerpHex(th.bg2,'#000000',.35));x.fillStyle=bg;x.fillRect(0,0,1920,1080);
 const L=ledMask(),lx=L.lx;lx.globalCompositeOperation='copy';const o=(t*70)%320;const wg=lx.createLinearGradient(-320+o,0,o+640,340);for(let k=0;k<=6;k++){wg.addColorStop(k/6,k%2?rgba(th.accent,.38):rgba(th.accent2,.08))}lx.fillStyle=wg;lx.fillRect(0,0,960,340);
 lx.globalCompositeOperation='destination-in';lx.drawImage(L.m,0,0);x.save();x.globalAlpha=.6;x.drawImage(L.l,0,70,1920,680);x.restore();
 x.save();for(let i=0;i<3;i++){const ox=((i*700+t*25)%2600)-400;x.save();x.translate(ox,0);x.transform(1,0,-.28,1,0,0);x.fillStyle='rgba(255,255,255,.035)';x.fillRect(0,120,360,640);x.strokeStyle=rgba(th.accent,.3);x.lineWidth=2;x.strokeRect(0,120,360,640);x.fillStyle=rgba(th.ink,.12);x.fillRect(0,120,360,4);x.restore()}x.restore();
 const sw=(t%5)/5;x.save();x.globalCompositeOperation='lighter';const sx=-600+sw*3200;const lg=x.createLinearGradient(sx-240,0,sx+240,0);lg.addColorStop(0,'rgba(255,255,255,0)');lg.addColorStop(.5,rgba(th.ink,.1));lg.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=lg;x.fillRect(0,0,1920,1080);x.restore();
 floor(x,th,790,.1);vignette(x,.5)};
let FOG=null;function fogTex(){if(FOG)return FOG;FOG=document.createElement('canvas');FOG.width=1024;FOG.height=512;const f=FOG.getContext('2d');for(let i=0;i<70;i++){const cx=rr(i+3)*1024,cy=160+rr(i+9)*240,r=60+rr(i+13)*180;const gr=f.createRadialGradient(cx,cy,0,cx,cy,r);gr.addColorStop(0,'rgba(255,255,255,.07)');gr.addColorStop(1,'rgba(255,255,255,0)');f.fillStyle=gr;f.fillRect(0,0,1024,512);for(const dx of[-1024,1024]){f.save();f.translate(dx,0);f.fillStyle=gr;f.fillRect(0,0,1024,512);f.restore()}}return FOG}
LOOK.noir=(x,t,th)=>{const bg=x.createRadialGradient(960,420,40,960,540,1300);bg.addColorStop(0,lerpHex(th.bg1,'#000000',.2));bg.addColorStop(1,'#000000');x.fillStyle=bg;x.fillRect(0,0,1920,1080);
 const f=fogTex();x.save();x.globalAlpha=.5;for(let k=0;k<2;k++){const o=((t*(k?14:-9))%1920+1920)%1920;x.drawImage(f,o-1920,260+k*120,1920,900);x.drawImage(f,o,260+k*120,1920,900)}x.restore();
 x.save();x.globalCompositeOperation='lighter';const cone=x.createLinearGradient(0,-60,0,880);cone.addColorStop(0,'rgba(255,255,255,.2)');cone.addColorStop(1,'rgba(255,255,255,.03)');x.fillStyle=cone;x.beginPath();x.moveTo(930,-60);x.lineTo(990,-60);x.lineTo(1500,870);x.lineTo(420,870);x.closePath();x.fill();
 const pool=x.createRadialGradient(960,870,10,960,870,560);pool.addColorStop(0,'rgba(255,255,255,.22)');pool.addColorStop(1,'rgba(255,255,255,0)');x.save();x.scale(1,.2);x.fillStyle=pool;x.fillRect(0,3500,1920,1600);x.restore();
 for(const p of DUST){const y=((p.y-t*p.s*.4)%900+900)%900;const w=(y+60)/930;const xx=960+(p.x/1920-.5)*1080*w;x.fillStyle='rgba(255,255,255,.28)';x.fillRect(xx+Math.sin(t+p.x)*8,y,p.r,p.r)}
 const pulse=Math.exp(-((t%1.15)*5))+.6*Math.exp(-(((t+.25)%1.15)*6));const eg=x.createRadialGradient(960,540,480,960,540,1150);eg.addColorStop(0,rgba(th.accent,0));eg.addColorStop(1,rgba(th.accent,.16*pulse));x.fillStyle=eg;x.fillRect(0,0,1920,1080);x.restore();vignette(x,.8)};

/* ---------- real 3D studio (lazy-loaded bundle) ---------- */
let three={state:'idle'};
function load3D(){if(three.state!=='idle')return;three.state='loading';const s=document.createElement('script');s.src='js/p5-three.js';s.onload=()=>{try{window.DM3D.init();three.state='ready'}catch(e){console.warn(e);three.state='failed';D.toast('سه‌بعدی واقعی روی این دستگاه اجرا نشد؛ از سبک «سینمایی طلایی» استفاده می‌شود',5000)}};s.onerror=()=>{three.state='failed'};document.head.appendChild(s)}
LOOK.studio3d=(x,t,th,seg)=>{if(three.state!=='ready'){load3D();return LOOK.cinema(x,t,th)}try{window.DM3D.setQuality(C().q3d);window.DM3D.render(t,th,seg?seg.type:'',seg?seg.game:'');x.drawImage(window.DM3D.canvas,0,0,1920,1080)}catch(e){console.warn(e);three.state='failed';LOOK.cinema(x,t,th)}};
function renderLook(x,t,th,seg,style){if(style==='classic'||!LOOK[style])return classicBG(x,t,th);return LOOK[style](x,t,th,seg)}

/* =============== post FX on the full output =============== */
const FX={segT0:0,tr0:-9,flare:-9,grainC:null,grainI:0};
function grainTiles(){if(FX.grainC)return FX.grainC;FX.grainC=[0,1,2,3].map(()=>{const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');const d=x.createImageData(256,256);for(let i=0;i<d.data.length;i+=4){const v=128+(Math.random()-.5)*255;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255}x.putImageData(d,0,0);return c});return FX.grainC}
const GRADE={cinema:['#ffb347',.18],arena:['#6b5bff',.16],broadcast:['#9ad7ff',.1],noir:['#8aa0b8',.22],studio3d:['#ffcc80',.12],classic:['#ffffff',0]};
function postActive(style){const c=C();return c.post==='on'||(c.post==='auto'&&style!=='classic')}
function post(seg,style){const c=C(),th=TH_(),now=nowS(),s=cv.width/1920;g.save();g.setTransform(s,0,0,s,0,0);
 const age=now-FX.segT0;
 if(c.camera>0){const z=1+c.camera*.035*ease(age/8),dx=Math.sin(now*.23)*6*c.camera;if(z>1.0008){const sw=cv.width/z,sh=cv.height/z;g.imageSmoothingQuality='high';g.drawImage(cv,(cv.width-sw)/2+dx*s,(cv.height-sh)/2,sw,sh,0,0,1920,1080)}}
 if(c.trans){const e=now-FX.tr0;if(e<.22){const k=1-e/.22;g.globalAlpha=.22*k;for(let i=1;i<=4;i++)g.drawImage(cv,-i*28*k*s,0,cv.width,cv.height,0,0,1920,1080);g.globalAlpha=1}
  if(e<.75){const k=e/.75;g.globalCompositeOperation='screen';const lx=-400+k*2700;const lg=g.createRadialGradient(lx,420,0,lx,420,900);lg.addColorStop(0,rgba(th.accent2,.45*(1-k)));lg.addColorStop(.5,rgba(th.accent,.18*(1-k)));lg.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=lg;g.fillRect(0,0,1920,1080);g.globalCompositeOperation='source-over'}}
 const fe=now-FX.flare;if(c.flare&&fe<.7){const k=1-fe/.7;g.globalCompositeOperation='lighter';const lg=g.createLinearGradient(0,0,1920,0);lg.addColorStop(0,'rgba(80,160,255,0)');lg.addColorStop(.5,`rgba(200,230,255,${.55*k})`);lg.addColorStop(1,'rgba(80,160,255,0)');g.fillStyle=lg;g.fillRect(0,531,1920,18);g.fillStyle=`rgba(120,180,255,${.18*k})`;g.fillRect(0,536,1920,8);
  [[.3,90],[.62,40],[.8,130]].forEach(([u,r],i)=>{const cx=960+(u-.5)*900,cy=540+(u-.5)*380;const gr=g.createRadialGradient(cx,cy,0,cx,cy,r);gr.addColorStop(0,rgba(i%2?th.accent2:'#7fb8ff',.12*k));gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(cx-r,cy-r,r*2,r*2)});g.globalCompositeOperation='source-over'}
 const gr=GRADE[style]||GRADE.classic;if(c.grade>0&&gr[1]>0){g.globalCompositeOperation='soft-light';g.globalAlpha=gr[1]*c.grade*2;g.fillStyle=gr[0];g.fillRect(0,0,1920,1080);g.globalAlpha=1;g.globalCompositeOperation='source-over'}
 if(c.vignette>0)vignette(g,.55*c.vignette);
 if(c.grain>0){const tiles=grainTiles();FX.grainI=(FX.grainI+1)%4;g.globalCompositeOperation='overlay';g.globalAlpha=.14*c.grain;const pat=g.createPattern(tiles[FX.grainI],'repeat');g.translate(Math.random()*256,Math.random()*256);g.fillStyle=pat;g.fillRect(-256,-256,2200,1400);g.setTransform(s,0,0,s,0,0);g.globalAlpha=1;g.globalCompositeOperation='source-over'}
 if(c.letterbox&&seg&&['title','intro','winner'].includes(seg.type)){const h=64*ease(age/.8);g.fillStyle='#000';g.fillRect(0,0,1920,h);g.fillRect(0,1080-h,1920,h)}
 g.restore()}

/* =============== dual output: GPU keyer + second recorder =============== */
const DUAL={gl:null,cvs:null,bg:null,bx:null,rec:null,fail:false};
function initDual(){if(DUAL.gl||DUAL.fail)return !!DUAL.gl;try{const c=document.createElement('canvas');const gl=c.getContext('webgl',{preserveDrawingBuffer:true,alpha:false,antialias:false});if(!gl)throw new Error('no webgl');
 const vs=`attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}`;
 const fs=`precision mediump float;varying vec2 uv;uniform sampler2D fg,bg;uniform vec3 key;uniform float sim,sm,spill,zoom,dx,vig,grain,tm,lb,isG;uniform vec4 flash;uniform vec4 tint;
 vec2 cc(vec3 c){return vec2(-.1687*c.r-.3313*c.g+.5*c.b,.5*c.r-.4187*c.g-.0813*c.b);}
 void main(){vec2 u=(uv-.5)/zoom+.5+vec2(dx,0.);vec4 f=texture2D(fg,u);vec3 b=texture2D(bg,u).rgb;float d=distance(cc(f.rgb),cc(key));float a=smoothstep(sim,sim+sm,d);vec3 c=f.rgb;
 if(isG>.5){c.g=mix(c.g,min(c.g,max(c.r,c.b)),spill);}else{c.b=mix(c.b,min(c.b,max(c.r,c.g)),spill);}
 vec3 col=mix(b,c,a);col=1.-(1.-col)*(1.-flash.rgb*flash.a);
 vec3 sl=mix(2.*col*tint.rgb+col*col*(1.-2.*tint.rgb),sqrt(col)*(2.*tint.rgb-1.)+2.*col*(1.-tint.rgb),step(.5,tint.rgb));col=mix(col,sl,tint.a);
 float v=smoothstep(1.05,.35,length((uv-.5)*vec2(1.,.75)));col*=mix(1.,v,vig);
 float n=fract(sin(dot(uv*(tm+1.),vec2(12.9898,78.233)))*43758.5453)-.5;col+=n*grain*.07;
 if(uv.y<lb||uv.y>1.-lb)col=vec3(0.);gl_FragColor=vec4(col,1.);}`;
 const sh=(t,s)=>{const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(o));return o};
 const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,vs));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(pr);if(!gl.getProgramParameter(pr,gl.LINK_STATUS))throw new Error('link');gl.useProgram(pr);
 const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);const loc=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
 const tex=u=>{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t};
 DUAL.tf=tex();DUAL.tb=tex();gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
 const U={};['fg','bg','key','sim','sm','spill','zoom','dx','vig','grain','tm','lb','isG','flash','tint'].forEach(n=>U[n]=gl.getUniformLocation(pr,n));gl.uniform1i(U.fg,0);gl.uniform1i(U.bg,1);
 DUAL.gl=gl;DUAL.cvs=c;DUAL.U=U;DUAL.bg=document.createElement('canvas');DUAL.bg.width=1280;DUAL.bg.height=720;DUAL.bx=DUAL.bg.getContext('2d',{alpha:false});return true}catch(e){console.warn('[DM5] dual keyer unavailable',e);DUAL.fail=true;return false}}
function renderDual(seg,style){if(!initDual())return;const gl=DUAL.gl,U=DUAL.U,c=C(),th=TH_(),t=nowS();
 if(DUAL.cvs.width!==cv.width||DUAL.cvs.height!==cv.height){DUAL.cvs.width=cv.width;DUAL.cvs.height=cv.height;gl.viewport(0,0,cv.width,cv.height)}
 let bgSrc=DUAL.bg;if(style==='studio3d'&&three.state==='ready'){try{window.DM3D.setQuality(c.q3d);window.DM3D.render(t,th,seg?seg.type:'',seg?seg.game:'');bgSrc=window.DM3D.canvas}catch(e){}}
 if(bgSrc===DUAL.bg){const x=DUAL.bx;x.setTransform(1280/1920,0,0,1280/1920,0,0);renderLook(x,t,th,seg,style==='studio3d'?'cinema':style)}
 gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,DUAL.tf);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,cv);
 gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,DUAL.tb);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,bgSrc);
 const k=keyInfo();const kc=hexRgb(k.hex).map(v=>v/255);gl.uniform3f(U.key,kc[0],kc[1],kc[2]);gl.uniform1f(U.sim,.085);gl.uniform1f(U.sm,.07);gl.uniform1f(U.spill,.85);gl.uniform1f(U.isG,k.name==='green'?1:0);
 const pa=postActive(style);const age=t-FX.segT0;gl.uniform1f(U.zoom,pa&&c.camera>0?1+c.camera*.035*ease(age/8):1);gl.uniform1f(U.dx,pa?Math.sin(t*.23)*.003*c.camera:0);
 gl.uniform1f(U.vig,pa?.55*c.vignette:0);gl.uniform1f(U.grain,pa?c.grain:0);gl.uniform1f(U.tm,t%100);gl.uniform1f(U.lb,pa&&c.letterbox&&seg&&['title','intro','winner'].includes(seg.type)?64/1080*ease(age/.8):0);
 let fl=[0,0,0,0];try{const fe=t-VFX.fl.t0;if(fe<VFX.fl.d&&VFX.flA>0){const rgb=hexRgb(VFX.fl.c).map(v=>v/255);fl=[...rgb,VFX.flA*(1-fe/VFX.fl.d)**1.5]}}catch(e){}gl.uniform4f(U.flash,...fl);
 const gr=GRADE[style]||GRADE.classic;const tc=hexRgb(gr[0]).map(v=>v/255);gl.uniform4f(U.tint,tc[0],tc[1],tc[2],pa?gr[1]*c.grade*2:0);
 gl.drawArrays(gl.TRIANGLE_STRIP,0,4)}
function syncDualRec(){const stt=D.st();const r=stt&&stt.rec;const on=r&&r.state==='recording';
 if(on&&!DUAL.rec&&outMode()==='dual'&&DUAL.gl){try{const tracks=[...DUAL.cvs.captureStream(+S.fps||60).getVideoTracks(),...AE.dest.stream.getAudioTracks()];const mime=pickMime();const q=QUAL[S.quality]||QUAL['1080p'];
  const rec=new MediaRecorder(new MediaStream(tracks),{mimeType:mime,videoBitsPerSecond:Math.round(q.br*(S.fps==60?1.3:1)),audioBitsPerSecond:320000});const chunks=[];rec.ondataavailable=e=>e.data.size&&chunks.push(e.data);
  const t0=performance.now();rec.onstop=async()=>{try{const blob=new Blob(chunks,{type:mime.split(';')[0]});const ext=mime.includes('mp4')?'mp4':'webm';const p=D.P();const stamp=new Date().toLocaleString('fa-IR').replace(/[\/:,،]/g,'-');
   const name=safeName(`${p.name} - FULL تمام‌صفحه - ${stamp}`)+'.'+ext;const srt=DUAL.srt||'';const id=uid();await DB.put('takes',id,{id,name,blob,srt,size:blob.size,mime,dur:(performance.now()-t0)/1000,date:Date.now(),project:p.name,res:S.quality,fps:S.fps,variant:'full'});
   D.toast('نسخهٔ تمام‌صفحه هم ذخیره شد · '+fmtSize(blob.size),4000);if(S.autoDl){download(blob,name);if(srt)download(new Blob([srt],{type:'text/plain'}),name.replace(/\.\w+$/,'.srt'))}try{await saveToFolder(blob,name,srt)}catch(e){}try{renderTakes()}catch(e){}}catch(e){console.error(e);D.toast('ذخیرهٔ نسخهٔ تمام‌صفحه خطا داد: '+e.message,6000)}};
  rec.start(1000);DUAL.rec=rec;D.toast('ضبط دوگانه: کروما (اصلی) + تمام‌صفحه',3000)}catch(e){console.warn(e);D.toast('ضبط دوم شروع نشد: '+e.message,5000)}}
 if(DUAL.rec&&!on){try{DUAL.srt=(stt.recSub||[]).map((c,i)=>`${i+1}\n${srtTime(c.s)} --> ${srtTime(c.e)}\n${c.text}\n`).join('\n')}catch(e){DUAL.srt=''}const r2=DUAL.rec;DUAL.rec=null;try{r2.state!=='inactive'&&r2.stop()}catch(e){}}}

/* =============== install hooks =============== */
D.whenReady(['draw','drawBG','cv','g'],()=>{
 const _bg=drawBG;
 drawBG=function(t,green){const seg=D.curSeg();const m=outMode();
  if(m!=='full'&&keyedScene(seg)){g.fillStyle=keyInfo().hex;g.fillRect(0,0,1920,1080);return}
  if(green)return _bg.apply(this,arguments);const style=styleFor(seg);if(style==='classic')return _bg.apply(this,arguments);
  try{renderLook(g,t,TH_(),seg,style)}catch(e){console.warn('[DM5] look',e);_bg.call(this,t,false)}};
 const _draw=draw;
 draw=function(){const seg=D.curSeg();const m=outMode();const keyed=m!=='full'&&keyedScene(seg);let bl,fa0;
  if(keyed){try{bl=S.bloom;S.bloom=false;if(typeof VFX!=='undefined'){fa0=VFX.fl.a;VFX.flA=fa0;VFX.fl.a=0}}catch(e){}}
  try{_draw.apply(this,arguments)}finally{if(keyed){try{S.bloom=bl;if(typeof VFX!=='undefined'){VFX.fl.a=fa0}}catch(e){}}}
  const style=styleFor(seg);
  if(!keyed&&postActive(style)){try{post(seg,style)}catch(e){console.warn('[DM5] post',e)}}
  if(m==='dual'&&keyed){try{renderDual(seg,style)}catch(e){console.warn('[DM5] dual',e)}}
  syncDualRec()};
 try{const _fp=fxPush;fxPush=function(k){const r=_fp.apply(this,arguments);if(k==='gain'&&window.DM3D&&three.state==='ready')window.DM3D.pulse('gain');return r}}catch(e){}
 try{const _vf=vfxFlash;vfxFlash=function(){FX.flare=nowS();return _vf.apply(this,arguments)}}catch(e){}
 D.on('live',()=>{FX.segT0=nowS();FX.tr0=nowS()});
 if(Object.values((D.P()&&D.P().cine&&D.P().cine.perSeg)||{}).includes('studio3d')||C().style==='studio3d')load3D();
 badge();setInterval(badge,1500)});

/* =============== UI =============== */
function badge(){if(!document.body)return;const b=document.getElementById('dm5b-cine-mode')||D.dockButton('cine-mode','',()=>dr.open(),'dm5-mode');const m=outMode();b.className='dm5-mode '+(m==='full'?'':m);b.textContent=m==='full'?'خروجی: تمام‌صفحه':m==='chroma'?'خروجی: کروما':'خروجی: دوگانه'}
const dr=D.drawer('cine','✨ سبک سینمایی و خروجی',[['look','سبک'],['out','خروجی و کروما'],['fx','جلوه‌های دوربین']]);
dr.render=()=>{const p=D.P();if(!p){dr.body.innerHTML='<p>قسمتی باز نیست.</p>';return}const c=C();const k=keyInfo();
 if(dr.tab==='look'){dr.body.innerHTML=`<div class="dm5-card"><h4>سبک اصلی این قسمت</h4><div class="dm5-row">${Object.entries(STYLES).map(([v,n])=>`<button class="dm5-btn ${c.style===v?'pri':''}" data-style="${v}">${n}</button>`).join('')}</div>
  <div class="dm5-muted">«کلاسیک» همان ظاهر فعلی است و هیچ چیزش عوض نشده. بقیه فقط پس‌زمینه و جلوه‌های دوربین را اضافه می‌کنند؛ متن‌ها، امتیازها، تایمر و همهٔ انیمیشن‌های فعلی دست‌نخورده روی آن اجرا می‌شوند.${three.state==='failed'?' <b style="color:#fca5a5">سه‌بعدی واقعی روی این دستگاه اجرا نشد.</b>':three.state==='loading'?' در حال بارگذاری سه‌بعدی…':''}</div></div>
  <div class="dm5-card"><h4>سبک جدا برای هر مرحله (اختیاری)</h4>${p.segments.map((s,i)=>`<div class="dm5-row"><span style="flex:1">${fa(i+1)} · ${esc(D.typeName(s.type))} ${esc(s.title||'')}</span><select data-seg="${s.id}"><option value="">مثل سبک اصلی</option>${Object.entries(STYLES).map(([v,n])=>`<option value="${v}" ${c.perSeg[s.id]===v?'selected':''}>${n}</option>`).join('')}</select></div>`).join('')}</div>`;return}
 if(dr.tab==='out'){dr.body.innerHTML=`<div class="dm5-card"><h4>حالت خروجی ضبط</h4>${Object.entries(OUTS).map(([v,n])=>`<label class="dm5-row"><input type="radio" name="dm5out" value="${v}" ${c.output===v?'checked':''}> ${n}</label>`).join('')}
  <div class="dm5-muted">«دوگانه» از یک اجرای زنده دو فایل می‌سازد: ضبط اصلی = کروما برای کپ‌کات، و فایل دوم با «FULL» در اسم = تمام‌صفحهٔ سینمایی. بازی زنده تکرارشدنی نیست، پس این امن‌ترین راه است. روی سیستم ضعیف، ۱۰۸۰p و ۳۰ فریم را انتخاب کنید.${DUAL.fail?' <b style="color:#fca5a5">این مرورگر WebGL ندارد؛ فقط کروما ضبط می‌شود.</b>':''}</div></div>
  <div class="dm5-card"><h4>رنگ کروما</h4><div class="dm5-row"><label><input type="radio" name="dm5key" value="auto" ${c.key==='auto'?'checked':''}> خودکار</label><label><input type="radio" name="dm5key" value="green" ${c.key==='green'?'checked':''}> سبز</label><label><input type="radio" name="dm5key" value="blue" ${c.key==='blue'?'checked':''}> آبی</label>
  <span class="dm5-pill" style="background:${k.hex}">${k.label} ${k.hex}</span></div>
  ${k.clash.length?`<div class="dm5-muted" style="color:#fbbf24">⚠ رنگ ${k.clash.map(h=>`<span class="dm5-pill" style="background:${h}">${h}</span>`).join(' ')} به رنگ کروما نزدیک است و در کپ‌کات پاک می‌شود. رنگ کروما را عوض کنید یا رنگ بازیکن/تم را.</div>`:'<div class="dm5-muted">هیچ رنگ بازیکن یا تمی به این رنگ نزدیک نیست ✓</div>'}
  <label class="dm5-row" style="margin-top:6px"><input type="checkbox" class="dm5-chk" data-c="keepFull" ${c.keepFull?'checked':''}> افتتاحیه و معرفی بازی در حالت کروما هم تمام‌صفحه بمانند</label></div>
  <div class="dm5-card dm5-muted"><b>در کپ‌کات:</b> ویدیوی دوربین روی لایهٔ اصلی، فایل کروما روی لایهٔ «Overlay»، بعد Cutout › Chroma key › رنگ را با قطره‌چکان روی پس‌زمینه بزنید، Intensity حدود ۱۵ تا ۲۵ و Shadow کم. در حالت کروما درخشش (Bloom) و فلاش تمام‌صفحه خودکار خاموش می‌شوند تا لبه‌ها سبز نزنند؛ در نسخهٔ تمام‌صفحه روشن‌اند.</div>`;return}
 dr.body.innerHTML=`<div class="dm5-card"><h4>جلوه‌های سینمایی روی خروجی تمام‌صفحه</h4>
  <div class="dm5-row">اعمال: <select data-c="post"><option value="auto" ${c.post==='auto'?'selected':''}>خودکار (همه‌جا جز سبک کلاسیک)</option><option value="on" ${c.post==='on'?'selected':''}>همیشه (حتی کلاسیک)</option><option value="off" ${c.post==='off'?'selected':''}>خاموش</option></select></div>
  ${[['camera','حرکت دوربین مجازی (push-in آرام)'],['grain','دانهٔ فیلم'],['vignette','تاریکی لبه‌ها'],['grade','رنگ‌بندی سینمایی'],['q3d','کیفیت سه‌بعدی (کمتر = روان‌تر)']].map(([key,n])=>`<label class="dm5-row"><span style="flex:1">${n}</span><input type="range" min="${key==='q3d'?.35:0}" max="1" step=".05" data-c="${key}" value="${c[key]}"></label>`).join('')}
  <label class="dm5-row"><input type="checkbox" class="dm5-chk" data-c="flare" ${c.flare?'checked':''}> شعلهٔ لنز آنامورفیک روی هر فلاش</label>
  <label class="dm5-row"><input type="checkbox" class="dm5-chk" data-c="trans" ${c.trans?'checked':''}> گذار سینمایی بین مراحل (whip + نشت نور)</label>
  <label class="dm5-row"><input type="checkbox" class="dm5-chk" data-c="letterbox" ${c.letterbox?'checked':''}> نوار سینمایی بالا و پایین در افتتاحیه، معرفی و اعلام برنده</label></div>`};
dr.el.addEventListener('click',e=>{const b=e.target.closest('[data-style]');if(!b)return;C().style=b.dataset.style;if(b.dataset.style==='studio3d')load3D();D.save();dr.render()});
dr.el.addEventListener('change',e=>{const t=e.target,c=C();
 if(t.name==='dm5out'){c.output=t.value;if(t.value==='dual')initDual();badge()}else if(t.name==='dm5key')c.key=t.value;
 else if(t.dataset.seg){if(t.value)c.perSeg[t.dataset.seg]=t.value;else delete c.perSeg[t.dataset.seg];if(t.value==='studio3d')load3D()}
 else if(t.dataset.c){const k=t.dataset.c;c[k]=t.type==='checkbox'?t.checked:t.type==='range'?+t.value:t.value}
 D.save();if(t.type!=='range')dr.render()});
D.dockButton('cine','✨ سبک و خروجی',()=>dr.toggle());
D.cinema={keyInfo,STYLES,LOOK,classicBG,renderLook,initDual,DUAL,three:()=>three.state,load3D};
})();
