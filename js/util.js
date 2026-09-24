/* DADASHMODE SHOW ENGINE v3 · utilities, storage, settings */
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const uid=()=>Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-4);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fa=n=>String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);
const enNum=s=>String(s??'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));
const cl=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const eo=x=>{x=cl(x);return x===1?1:1-Math.pow(2,-10*x)};           // ease-out expo
const eq=x=>{x=cl(x);return 1-Math.pow(1-x,4)};                      // ease-out quart
const eio=x=>{x=cl(x);return x<.5?8*x*x*x*x:1-Math.pow(-2*x+2,4)/2}; // in-out quart
const ph=(t,a,d)=>cl((t-a)/d);
const rnd=s=>{const x=Math.sin(s*127.1+311.7)*43758.5453;return x-Math.floor(x)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function hexA(h,a){h=(h||'#000').replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16);return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`}
function mix(h1,h2,k){const p=h=>{h=h.replace('#','');const n=parseInt(h,16);return[n>>16&255,n>>8&255,n&255]};const a=p(h1),b=p(h2);return '#'+a.map((v,i)=>Math.round(v+(b[i]-v)*k).toString(16).padStart(2,'0')).join('')}
/* Stable FNV-1a 53-bit hash, identical in tools/build-voicepack.mjs */
function hash53(str){let h1=0xdeadbeef^0,h2=0x41c6ce57^0;for(let i=0;i<str.length;i++){const ch=str.charCodeAt(i);h1=Math.imul(h1^ch,2654435761);h2=Math.imul(h2^ch,1597334677)}h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);return (4294967296*(2097151&h2)+(h1>>>0)).toString(36)}
let toastT;function toast(m,ms=2800){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),ms)}
function blobToData(b){return new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(b)})}
async function dataToBlob(d){return (await fetch(d)).blob()}
function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000)}
const fmtSize=b=>b>1e9?fa((b/1e9).toFixed(2))+' گیگ':fa((b/1e6).toFixed(1))+' مگ';
const safeName=s=>String(s).replace(/[\\/:*?"<>|\n\r]/g,'').slice(0,80).trim()||'file';
function srtTime(s){s=Math.max(0,s);const h=Math.floor(s/3600),m=Math.floor(s%3600/60),sec=Math.floor(s%60),ms=Math.round((s%1)*1000);const p=(n,l=2)=>String(n).padStart(l,'0');return `${p(h)}:${p(m)}:${p(sec)},${p(ms,3)}`}
function secureRandInt(n){const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]%n}
function shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=secureRandInt(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}

/* IndexedDB */
const DB={db:null,
  open(){return new Promise((res,rej)=>{const r=indexedDB.open('dadashmode-engine-3',1);r.onupgradeneeded=()=>{const d=r.result;['projects','audio','takes','kv'].forEach(n=>{if(!d.objectStoreNames.contains(n))d.createObjectStore(n)})};r.onsuccess=()=>{this.db=r.result;res()};r.onerror=()=>rej(r.error)})},
  tx(store,mode,fn){return new Promise((res,rej)=>{const t=this.db.transaction(store,mode);const req=fn(t.objectStore(store));t.oncomplete=()=>res(req&&req.result);t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error)})},
  get(s,k){return this.tx(s,'readonly',o=>o.get(k))},put(s,k,v){return this.tx(s,'readwrite',o=>o.put(v,k))},
  del(s,k){return this.tx(s,'readwrite',o=>o.delete(k))},all(s){return this.tx(s,'readonly',o=>o.getAll())},keys(s){return this.tx(s,'readonly',o=>o.getAllKeys())}};

/* Settings (device-local) */
const DEF_S={aiProvider:'gemini',geminiKey:'',geminiChat:'gemini-2.5-flash',geminiTts:'gemini-2.5-flash-preview-tts',
  openaiKey:'',openaiBase:'https://api.openai.com/v1',openaiChat:'gpt-4o-mini',openaiTts:'gpt-4o-mini-tts',
  quality:'1080p',fps:60,autoDl:false,devTts:true,step:10,normalize:true,sfxVol:.55,voiceVol:1.1,musicBed:true,wake:true};
let S=Object.assign({},DEF_S,JSON.parse(localStorage.getItem('dm3-settings')||'{}'));
const saveS=()=>localStorage.setItem('dm3-settings',JSON.stringify(S));
