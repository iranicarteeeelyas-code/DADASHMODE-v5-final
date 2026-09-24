/* DADASHMODE v5 · phases 3-5 shared core
   - side dock + drawers + floating HUD, injected at runtime (no existing markup is touched or removed)
   - tiny event bus: 'live' (segment went live), 'frame'
   - safe helpers that fall back gracefully if an older build lacks a global */
'use strict';
(function(){
const DM5=window.DM5=window.DM5||{};
DM5.version='5.3.0';
const has=n=>{try{return typeof window[n]!=='undefined'||eval('typeof '+n)!=='undefined'}catch(e){return false}};
DM5.has=has;
DM5.fa=n=>String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);
DM5.en=s=>String(s??'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));
DM5.esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
DM5.id=()=>Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-3);
DM5.toast=(m,ms)=>{try{toast(m,ms)}catch(e){console.log('[DM5]',m)}};
DM5.P=()=>{try{return P}catch(e){return null}};
DM5.st=()=>{try{return st}catch(e){return null}};
DM5.save=()=>{try{save()}catch(e){console.warn('[DM5] save',e)}};
DM5.bag=(key,def)=>{const p=DM5.P();if(!p)return def();if(!p[key]||typeof p[key]!=='object')p[key]=def();return p[key]};
DM5.curIndex=()=>{const s=DM5.st(),p=DM5.P();if(!s||!p)return -1;return s.live>=0?s.live:s.sel};
DM5.curSeg=()=>{const p=DM5.P(),i=DM5.curIndex();return p&&p.segments?p.segments[i]:null};
DM5.lines=()=>{try{return allLines()}catch(e){const p=DM5.P();return p?p.segments.flatMap((s,i)=>(s.lines||[]).map(l=>({l,s,i}))):[]}};
DM5.typeName=t=>{try{return TYPES[t]||t}catch(e){return t}};
DM5.gameName=g=>{try{return GAMES[g]||g}catch(e){return g}};
DM5.emoName=e=>{try{return (EMO[e]&&EMO[e].fa)||e}catch(e2){return e}};

/* ---------- event bus ---------- */
const bus={};DM5.on=(e,f)=>{(bus[e]=bus[e]||[]).push(f)};DM5.emit=(e,d)=>{(bus[e]||[]).forEach(f=>{try{f(d)}catch(err){console.warn('[DM5]',e,err)}})};

/* ---------- wait until the v4 engine globals exist (works with plain or deferred script tags) ---------- */
DM5.whenReady=(names,fn)=>{let n=0;const ok=()=>names.every(has);const tryIt=()=>{if(ok()){try{fn()}catch(e){console.error('[DM5] init failed',e)}return}if(++n>100){console.warn('[DM5] engine globals missing:',names.filter(x=>!has(x)).join(','));return}setTimeout(tryIt,100)};tryIt()};

/* ---------- styles ---------- */
const css=`
.dm5-dock{position:fixed;left:0;top:50%;transform:translateY(-50%);z-index:9000;display:flex;flex-direction:column;gap:6px;font-family:Vazirmatn,Tahoma,sans-serif}
.dm5-dock button{all:unset;cursor:pointer;background:#16121a;color:#fff;border:1px solid #3a3040;border-left:0;border-radius:0 12px 12px 0;padding:10px 9px;writing-mode:vertical-rl;font-size:13px;font-weight:800;letter-spacing:.3px;box-shadow:0 4px 16px #0008}
.dm5-dock button:hover,.dm5-dock button.on{background:#ff3b3b;border-color:#ff3b3b}
.dm5-dock .dm5-mode{background:#0d3b1e;border-color:#1f8a47;writing-mode:vertical-rl;font-size:11px}
.dm5-dock .dm5-mode.chroma{background:#00b140;color:#001a08}.dm5-dock .dm5-mode.dual{background:#1d4ed8}
.dm5-drawer{position:fixed;left:44px;top:12px;bottom:12px;width:min(520px,calc(100vw - 60px));z-index:9001;background:#120e15f2;color:#f4eef6;border:1px solid #3a3040;border-radius:16px;box-shadow:0 20px 60px #000c;display:none;flex-direction:column;direction:rtl;font:14px/1.7 Vazirmatn,Tahoma,sans-serif;backdrop-filter:blur(10px)}
.dm5-drawer.open{display:flex}
.dm5-drawer header{display:flex;align-items:center;gap:8px;padding:12px 14px;border-bottom:1px solid #2c2432}
.dm5-drawer header h3{margin:0;font-size:16px;flex:1}
.dm5-drawer .dm5-tabs{display:flex;gap:4px;padding:8px 10px;border-bottom:1px solid #2c2432;flex-wrap:wrap}
.dm5-drawer .dm5-tabs button{all:unset;cursor:pointer;padding:5px 11px;border-radius:999px;background:#221b27;font-size:13px}
.dm5-drawer .dm5-tabs button.on{background:#ff3b3b;color:#fff}
.dm5-body{flex:1;overflow:auto;padding:12px 14px}
.dm5-x{all:unset;cursor:pointer;padding:2px 10px;border-radius:8px;background:#2a2230}
.dm5-btn{all:unset;cursor:pointer;display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:10px;background:#2a2230;font-size:13px;font-weight:700;margin:2px}
.dm5-btn:hover{background:#3a3040}.dm5-btn.pri{background:#ff3b3b}.dm5-btn.ok{background:#15803d}.dm5-btn.warn{background:#b45309}.dm5-btn:disabled,.dm5-btn[disabled]{opacity:.45;pointer-events:none}
.dm5-card{background:#1b161f;border:1px solid #2c2432;border-radius:12px;padding:10px 12px;margin:0 0 10px}
.dm5-card h4{margin:0 0 6px;font-size:14px}
.dm5-muted{color:#a99bb0;font-size:12px}
.dm5-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.dm5-in,.dm5-drawer select,.dm5-drawer textarea{background:#0e0b10;color:#fff;border:1px solid #3a3040;border-radius:8px;padding:4px 8px;font:inherit;font-size:13px}
.dm5-drawer textarea{width:100%;box-sizing:border-box;min-height:120px;direction:rtl}
.dm5-pill{display:inline-block;padding:1px 8px;border-radius:999px;font-size:11px;font-weight:800;background:#2a2230}
.dm5-pill.red{background:#7f1d1d}.dm5-pill.yel{background:#78350f}.dm5-pill.grn{background:#14532d}.dm5-pill.blu{background:#1e3a8a}
.dm5-list{list-style:none;margin:0;padding:0}.dm5-list li{display:flex;gap:8px;align-items:flex-start;padding:5px 0;border-bottom:1px dashed #2c2432}
.dm5-list li:last-child{border-bottom:0}.dm5-list .grow{flex:1}
.dm5-chk{width:18px;height:18px;accent-color:#22c55e;margin-top:3px}
.dm5-hud{position:fixed;right:14px;top:70px;z-index:8999;width:340px;max-height:70vh;overflow:auto;direction:rtl;background:#0d0a10ee;color:#fff;border:2px solid #ff3b3b;border-radius:14px;padding:10px 12px;font:13px/1.65 Vazirmatn,Tahoma,sans-serif;box-shadow:0 10px 40px #000b;display:none}
.dm5-hud.on{display:block}.dm5-hud h5{margin:0 0 4px;font-size:15px;display:flex;gap:6px;align-items:center}
.dm5-hud .big{font-size:17px;font-weight:900}.dm5-hud .next{border-top:1px solid #3a3040;margin-top:8px;padding-top:6px;color:#d8cfe0}
.dm5-hud .alert{background:#7f1d1d;border-radius:8px;padding:4px 8px;margin:4px 0;font-weight:800}
.dm5-hud .flash{animation:dm5f .6s 3}@keyframes dm5f{50%{background:#ff3b3b}}
.dm5-hud .drag{cursor:move;user-select:none}
.dm5-meter{height:10px;background:#221b27;border-radius:6px;overflow:hidden}.dm5-meter i{display:block;height:100%;background:linear-gradient(90deg,#22c55e,#facc15,#ef4444);width:0}
.dm5-wave{width:100%;height:56px;background:#0e0b10;border-radius:8px;display:block}
.dm5-bar{height:8px;border-radius:5px;background:#221b27;overflow:hidden}.dm5-bar i{display:block;height:100%;background:#22c55e}
`;
DM5.css=extra=>{const s=document.createElement('style');s.textContent=extra;document.head.appendChild(s)};
DM5.css(css);

/* ---------- dock + drawers ---------- */
let dock=null;const drawers={};
function ensureDock(){if(dock)return dock;dock=document.createElement('div');dock.className='dm5-dock';document.body.appendChild(dock);return dock}
DM5.dockButton=(id,label,onClick,cls='')=>{const b=document.createElement('button');b.id='dm5b-'+id;b.textContent=label;if(cls)b.className=cls;b.onclick=e=>{onClick(e);setTimeout(()=>b.blur(),0)};ensureDock().appendChild(b);return b};
DM5.drawer=(id,title,tabs)=>{if(drawers[id])return drawers[id];const el=document.createElement('div');el.className='dm5-drawer';el.id='dm5d-'+id;
 el.innerHTML=`<header><h3>${title}</h3><button class="dm5-x" data-x>✕</button></header>${tabs?`<div class="dm5-tabs">${tabs.map(([k,n],i)=>`<button data-tab="${k}" class="${i?'':'on'}">${n}</button>`).join('')}</div>`:''}<div class="dm5-body"></div>`;
 document.body.appendChild(el);const d={el,body:el.querySelector('.dm5-body'),tab:tabs?tabs[0][0]:null,render:()=>{},
  open(){Object.values(drawers).forEach(o=>o!==d&&o.close());el.classList.add('open');const b=document.getElementById('dm5b-'+id);b&&b.classList.add('on');d.render()},
  close(){el.classList.remove('open');const b=document.getElementById('dm5b-'+id);b&&b.classList.remove('on')},
  toggle(){el.classList.contains('open')?d.close():d.open()},isOpen:()=>el.classList.contains('open')};
 el.querySelector('[data-x]').onclick=()=>d.close();
 if(tabs)el.querySelector('.dm5-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(!b)return;d.tab=b.dataset.tab;el.querySelectorAll('.dm5-tabs button').forEach(x=>x.classList.toggle('on',x===b));d.render()});
 /* keep the show's single-key shortcuts (Space, arrows, A/L…) from firing while typing in our panels */
 el.addEventListener('keydown',e=>{if(e.target.matches('input,textarea,select'))e.stopPropagation()});
 el.addEventListener('click',e=>{const b=e.target.closest('button');if(b)setTimeout(()=>b.blur(),0)});
 drawers[id]=d;return d};

/* ---------- floating HUD (never drawn on the canvas, so it is never recorded) ---------- */
DM5.hud=(()=>{let el=null;return{get el(){if(!el){el=document.createElement('div');el.className='dm5-hud';document.body.appendChild(el);
 let drag=null;el.addEventListener('mousedown',e=>{if(!e.target.closest('.drag'))return;const r=el.getBoundingClientRect();drag={dx:e.clientX-r.left,dy:e.clientY-r.top};e.preventDefault()});
 addEventListener('mousemove',e=>{if(!drag)return;el.style.left=(e.clientX-drag.dx)+'px';el.style.top=(e.clientY-drag.dy)+'px';el.style.right='auto'});addEventListener('mouseup',()=>drag=null);
 el.addEventListener('click',e=>{const b=e.target.closest('button');if(b)setTimeout(()=>b.blur(),0)})}return el},
 show(html){const e=this.el;e.innerHTML=html;e.classList.add('on')},hide(){el&&el.classList.remove('on')}}})();

/* ---------- hook: segment goes live ---------- */
DM5.whenReady(['goLive'],()=>{if(window.__dm5Live)return;window.__dm5Live=1;const _gl=goLive;goLive=async function(i){const r=await _gl.apply(this,arguments);DM5.emit('live',i);return r}});

/* ---------- small audio helpers shared by phase 4 ---------- */
DM5.wav=(ab)=>{if(typeof audioBufferToWav==='function')return audioBufferToWav(ab);const ch=ab.numberOfChannels,rate=ab.sampleRate,n=ab.length;const buf=new ArrayBuffer(44+n*ch*2),v=new DataView(buf);const w=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i))};
 w(0,'RIFF');v.setUint32(4,36+n*ch*2,true);w(8,'WAVE');w(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,ch,true);v.setUint32(24,rate,true);v.setUint32(28,rate*ch*2,true);v.setUint16(32,ch*2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,n*ch*2,true);
 let o=44;for(let i=0;i<n;i++)for(let c=0;c<ch;c++){const s=Math.max(-1,Math.min(1,ab.getChannelData(c)[i]));v.setInt16(o,s<0?s*0x8000:s*0x7fff,true);o+=2}return new Blob([buf],{type:'audio/wav'})};
DM5.kvGet=async k=>{try{return await DB.get('kv',k)}catch(e){try{return JSON.parse(localStorage.getItem('dm5:'+k))}catch(e2){return null}}};
DM5.kvPut=async(k,v)=>{try{await DB.put('kv',k,v)}catch(e){try{localStorage.setItem('dm5:'+k,JSON.stringify(v))}catch(e2){}}};
})();
