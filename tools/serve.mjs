#!/usr/bin/env node
/* DADASHMODE v4 · zero-dependency local server (no npm install needed).
   - serves the app (full offline install via service worker)
   - /api/config                → tells the app which engines this computer offers
   - /api/ai/json               → Gemini text/PDF understanding proxy (key from app or GEMINI_API_KEY env)
   - /api/ai/tts                → Gemini TTS proxy (female voices with emotion)
   - /api/tts/edge              → Microsoft Edge neural voice fa-IR-DilaraNeural (female, NO API key)
   - /api/voices/save           → writes every generated voice as a real file into ./voices (physically installed)
   Usage: node tools/serve.mjs [port]   then open http://localhost:8080  (phones on same Wi-Fi: http://<computer-ip>:8080) */
import http from 'node:http';import fs from 'node:fs';import fsp from 'node:fs/promises';import path from 'node:path';import os from 'node:os';import {fileURLToPath} from 'node:url';
import {edgeSynth,EDGE_EMO} from './edge-tts.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');const PORT=+process.argv[2]||+process.env.PORT||3000;const HOST=process.env.HOST||'0.0.0.0';
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml','.ttf':'font/ttf','.wav':'audio/wav','.mp3':'audio/mpeg','.ogg':'audio/ogg','.webm':'audio/webm','.md':'text/markdown; charset=utf-8','.pdf':'application/pdf'};
const VOICES=path.join(ROOT,'voices');

function body(req,limit=60e6){return new Promise((res,rej)=>{let n=0;const c=[];req.on('data',d=>{n+=d.length;if(n>limit){rej(new Error('too large'));req.destroy()}else c.push(d)});req.on('end',()=>{try{res(JSON.parse(Buffer.concat(c).toString('utf8')||'{}'))}catch(e){rej(e)}});req.on('error',rej)})}
const json=(res,code,obj)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(obj))};
function wav(pcm,rate=24000){const h=Buffer.alloc(44);h.write('RIFF',0);h.writeUInt32LE(36+pcm.length,4);h.write('WAVE',8);h.write('fmt ',12);h.writeUInt32LE(16,16);h.writeUInt16LE(1,20);h.writeUInt16LE(1,22);h.writeUInt32LE(rate,24);h.writeUInt32LE(rate*2,28);h.writeUInt16LE(2,32);h.writeUInt16LE(16,34);h.write('data',36);h.writeUInt32LE(pcm.length,40);return Buffer.concat([h,pcm])}
async function gemini(model,key,payload){const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify(payload)});
  const t=await r.text();if(!r.ok){const e=new Error(`Gemini ${r.status}: ${t.slice(0,300)}`);e.status=r.status;throw e}return JSON.parse(t)}

const API={
  'GET /api/config':async(req,res)=>json(res,200,{server:'dadashmode-v4',gemini:!!process.env.GEMINI_API_KEY,edge:true,voicesWritable:true}),
  'POST /api/ai/json':async(req,res)=>{const b=await body(req);const key=b.apiKey||process.env.GEMINI_API_KEY;if(!key)return json(res,400,{error:'کلید Gemini نه در اپ وارد شده و نه روی سرور.'});
    const parts=Array.isArray(b.parts)&&b.parts.length?b.parts:[{text:b.user||''}];
    const j=await gemini(b.model||'gemini-2.5-flash',key,{systemInstruction:{parts:[{text:b.system||''}]},contents:[{role:'user',parts}],generationConfig:{responseMimeType:'application/json',temperature:b.temperature??.6,maxOutputTokens:b.maxTokens||65536}});
    json(res,200,{text:(j.candidates?.[0]?.content?.parts||[]).map(p=>p.text||'').join(''),finish:j.candidates?.[0]?.finishReason})},
  'POST /api/ai/tts':async(req,res)=>{const b=await body(req);const key=b.apiKey||process.env.GEMINI_API_KEY;if(!key)return json(res,400,{error:'کلید Gemini موجود نیست.'});
    const j=await gemini(b.model||'gemini-2.5-flash-preview-tts',key,{contents:[{parts:[{text:b.text||''}]}],generationConfig:{responseModalities:['AUDIO'],speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:b.voiceName||'Leda'}}}}});
    const part=j.candidates?.[0]?.content?.parts?.find(p=>p.inlineData);if(!part)return json(res,502,{error:'Gemini صدایی برنگرداند'});
    const rate=+((part.inlineData.mimeType||'').match(/rate=(\d+)/)||[])[1]||24000;const out=wav(Buffer.from(part.inlineData.data,'base64'),rate);res.writeHead(200,{'Content-Type':'audio/wav','Content-Length':out.length});res.end(out)},
  'POST /api/tts/edge':async(req,res)=>{const b=await body(req);const pro=Object.assign({},EDGE_EMO[b.emotion]||{},b.prosody||{});
    const mp3=await edgeSynth(b.text||'',{voice:b.voice||'fa-IR-DilaraNeural',...pro});res.writeHead(200,{'Content-Type':'audio/mpeg','Content-Length':mp3.length});res.end(mp3)},
  'POST /api/voices/save':async(req,res)=>{const b=await body(req);if(!/^[a-z0-9]{4,20}$/.test(b.key||''))return json(res,400,{error:'bad key'});const ext=['wav','mp3','webm','ogg'].includes(b.ext)?b.ext:'wav';
    await fsp.mkdir(VOICES,{recursive:true});await fsp.writeFile(path.join(VOICES,b.key+'.'+ext),Buffer.from(b.data||'','base64'));
    const ip=path.join(VOICES,'index.json');let idx={format:'dadashmode-voicepack-index/3',items:{}};try{idx=JSON.parse(await fsp.readFile(ip,'utf8'))}catch(e){}
    idx.items[b.key]={file:b.key+'.'+ext,text:b.text||'',emotion:b.emotion||'',direction:b.direction||'',voice:b.voice||'',source:b.source||'',created:Date.now()};await fsp.writeFile(ip,JSON.stringify(idx,null,1));json(res,200,{ok:true,count:Object.keys(idx.items).length})}};

http.createServer(async(req,res)=>{const u=new URL(req.url,'http://x');const route=API[`${req.method} ${u.pathname}`];
  if(route){try{await route(req,res)}catch(e){console.warn(u.pathname,e.message);if(!res.headersSent)json(res,e.status||500,{error:e.message})}return}
  if(u.pathname.startsWith('/api/'))return json(res,404,{error:'unknown api'});
  let p=decodeURIComponent(u.pathname);if(p.endsWith('/'))p+='index.html';const f=path.join(ROOT,path.normalize(p).replace(/^(\.\.[\/\\])+/,''));
  if(!f.startsWith(ROOT)){res.writeHead(403);return res.end()}fs.readFile(f,(err,data)=>{if(err){res.writeHead(404);return res.end('not found')}res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data)})})
.listen(PORT,HOST,()=>{console.log(`\n  DADASHMODE v4 → http://localhost:${PORT}`);for(const n of Object.values(os.networkInterfaces()).flat())if(n&&n.family==='IPv4'&&!n.internal)console.log(`  same Wi-Fi (phone): http://${n.address}:${PORT}`);
  console.log('  voice engines on this computer: Gemini (with key) · Microsoft Dilara (no key) · saved voices go to ./voices\n')});
