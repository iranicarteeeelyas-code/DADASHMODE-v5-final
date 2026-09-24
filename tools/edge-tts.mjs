/* DADASHMODE v4 · Microsoft Edge "Read Aloud" neural TTS client (fa-IR-DilaraNeural = Persian female, no API key).
   Zero dependencies: a tiny WebSocket client written on node:tls, so it runs on any Node 18+ without npm install.
   Protocol follows the open-source edge-tts project (github.com/rany2/edge-tts). Microsoft can change it at any time;
   if it stops working the app automatically falls back to the next voice engine. */
import tls from 'node:tls';import net from 'node:net';import crypto from 'node:crypto';

const TRUSTED='6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const CHROME=process.env.EDGE_CHROMIUM_VERSION||'130.0.2849.68';
const HOST='speech.platform.bing.com';
export const EDGE_VOICES={'fa-IR-DilaraNeural':'دلارا · زن','fa-IR-FaridNeural':'فرید · مرد'};

function secMsGec(){let t=Date.now()/1000+11644473600;t-=t%300;const ticks=BigInt(Math.floor(t))*10000000n;
  return crypto.createHash('sha256').update(ticks.toString()+TRUSTED,'ascii').digest('hex').toUpperCase()}
const xmlEsc=s=>String(s).replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
const stamp=()=>new Date().toUTCString().replace('GMT','GMT+0000 (Coordinated Universal Time)');
const reqId=()=>crypto.randomUUID().replace(/-/g,'');

/* SSML: emotion → prosody; "..." → dramatic pause; "،" → short pause */
export function buildSSML(text,{voice='fa-IR-DilaraNeural',rate='+0%',pitch='+0Hz',volume='+0%'}={}){
  const full=voice.includes('(')?voice:`Microsoft Server Speech Text to Speech Voice (${voice.split('-').slice(0,2).join('-')}, ${voice.split('-').slice(2).join('-')})`;
  const body=xmlEsc(text.trim()).replace(/\s*(\.\.\.|…)\s*/g,' <break time="450ms"/> ');
  return `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='fa-IR'><voice name='${full}'><prosody pitch='${pitch}' rate='${rate}' volume='${volume}'>${body}</prosody></voice></speak>`}

/* ---- minimal WebSocket client (RFC 6455) ---- */
function wsConnect({host,port=443,path,headers,secure=true,timeout=10000}){return new Promise((resolve,reject)=>{
  const key=crypto.randomBytes(16).toString('base64');
  const sock=secure?tls.connect({host,port,servername:host}):net.connect({host,port});
  const to=setTimeout(()=>{sock.destroy();reject(new Error('edge-tts: connection timeout'))},timeout);
  let buf=Buffer.alloc(0),open=false;const ws={onText:null,onBinary:null,onClose:null,
    send(data,binary=false){const payload=Buffer.isBuffer(data)?data:Buffer.from(data,'utf8');const mask=crypto.randomBytes(4);let hdr;const n=payload.length;
      if(n<126){hdr=Buffer.alloc(2);hdr[1]=0x80|n}else if(n<65536){hdr=Buffer.alloc(4);hdr[1]=0x80|126;hdr.writeUInt16BE(n,2)}else{hdr=Buffer.alloc(10);hdr[1]=0x80|127;hdr.writeBigUInt64BE(BigInt(n),2)}
      hdr[0]=0x80|(binary?2:1);const masked=Buffer.alloc(n);for(let i=0;i<n;i++)masked[i]=payload[i]^mask[i&3];sock.write(Buffer.concat([hdr,mask,masked]))},
    close(){try{sock.write(Buffer.from([0x88,0x80,0,0,0,0]))}catch(e){}sock.end();clearTimeout(to)}};
  let frag=null,fragOp=0;
  function parse(){while(true){if(buf.length<2)return;const fin=buf[0]&0x80,op=buf[0]&0x0f,masked=buf[1]&0x80;let len=buf[1]&0x7f,off=2;
      if(len===126){if(buf.length<4)return;len=buf.readUInt16BE(2);off=4}else if(len===127){if(buf.length<10)return;len=Number(buf.readBigUInt64BE(2));off=10}
      let mk=null;if(masked){if(buf.length<off+4)return;mk=buf.subarray(off,off+4);off+=4}
      if(buf.length<off+len)return;let pl=buf.subarray(off,off+len);if(mk){pl=Buffer.from(pl);for(let i=0;i<pl.length;i++)pl[i]^=mk[i&3]}buf=buf.subarray(off+len);
      if(op===8){clearTimeout(to);ws.onClose&&ws.onClose(pl.length>=2?pl.readUInt16BE(0):1005);sock.end();return}
      if(op===9){const h=Buffer.from([0x8a,0x80|pl.length]);const m=Buffer.alloc(4);sock.write(Buffer.concat([h,m,pl]));continue}
      if(op===10)continue;
      if(op===0){frag=Buffer.concat([frag||Buffer.alloc(0),pl]);if(!fin)continue;pl=frag;frag=null}else if(!fin){frag=Buffer.from(pl);fragOp=op;continue}
      const kind=op===0?fragOp:op;if(kind===1)ws.onText&&ws.onText(pl.toString('utf8'));else if(kind===2)ws.onBinary&&ws.onBinary(pl)}}
  sock.on('connect',()=>{if(secure)return;hello()});sock.on('secureConnect',hello);
  function hello(){const h=[`GET ${path} HTTP/1.1`,`Host: ${host}`,'Upgrade: websocket','Connection: Upgrade',`Sec-WebSocket-Key: ${key}`,'Sec-WebSocket-Version: 13',...Object.entries(headers||{}).map(([k,v])=>`${k}: ${v}`),'',''].join('\r\n');sock.write(h)}
  sock.on('data',d=>{buf=Buffer.concat([buf,d]);if(!open){const i=buf.indexOf('\r\n\r\n');if(i<0)return;const head=buf.subarray(0,i).toString();buf=buf.subarray(i+4);
      if(!/^HTTP\/1\.1 101/.test(head)){clearTimeout(to);sock.destroy();return reject(new Error('edge-tts handshake: '+head.split('\r\n')[0]))}open=true;resolve(ws)}parse()});
  sock.on('error',e=>{clearTimeout(to);if(!open)reject(e);else ws.onClose&&ws.onClose(1006,e)});
  sock.on('close',()=>{clearTimeout(to);if(!open)reject(new Error('edge-tts: closed before handshake'))})})}

/* synthesize → Buffer (MP3 24 kHz). opts: voice, rate, pitch, volume. _test: {host,port,secure} for local tests */
export async function edgeSynth(text,opts={},_test=null){
  if(!text||!text.trim())throw new Error('empty text');
  const path=`/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED}&Sec-MS-GEC=${secMsGec()}&Sec-MS-GEC-Version=1-${CHROME}&ConnectionId=${reqId()}`;
  const ws=await wsConnect({host:_test?_test.host:HOST,port:_test?_test.port:443,secure:_test?_test.secure:true,path,headers:{
    'Pragma':'no-cache','Cache-Control':'no-cache','Origin':'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold','Accept-Encoding':'gzip, deflate, br','Accept-Language':'en-US,en;q=0.9',
    'User-Agent':`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROME.split('.')[0]}.0.0.0 Safari/537.36 Edg/${CHROME.split('.')[0]}.0.0.0`,
    'Cookie':'muid='+crypto.randomBytes(16).toString('hex').toUpperCase()+';'}});
  return new Promise((resolve,reject)=>{const chunks=[];let done=false;const kill=setTimeout(()=>{if(done)return;done=true;ws.close();reject(new Error('edge-tts: no audio (timeout)'))},45000);
    ws.onBinary=b=>{if(b.length<2)return;const hl=b.readUInt16BE(0);const head=b.subarray(2,2+hl).toString();if(/Path:audio/i.test(head)){const a=b.subarray(2+hl);if(a.length)chunks.push(a)}};
    ws.onText=t=>{if(/Path:turn\.end/i.test(t)&&!done){done=true;clearTimeout(kill);ws.close();const out=Buffer.concat(chunks);out.length?resolve(out):reject(new Error('edge-tts: empty audio'))}};
    ws.onClose=code=>{if(done)return;done=true;clearTimeout(kill);chunks.length?resolve(Buffer.concat(chunks)):reject(new Error('edge-tts: closed ('+code+')'))};
    ws.send(`X-Timestamp:${stamp()}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}\r\n`);
    ws.send(`X-RequestId:${reqId()}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${stamp()}Z\r\nPath:ssml\r\n\r\n${buildSSML(text,opts)}`)})}

/* emotion presets shared by app + voice-pack builder (Dilara has no speaking styles, so prosody carries the emotion) */
export const EDGE_EMO={excited:{rate:'+12%',pitch:'+18Hz'},warm:{rate:'+2%',pitch:'+6Hz'},suspense:{rate:'-14%',pitch:'-10Hz'},whisper:{rate:'-10%',pitch:'-4Hz',volume:'-25%'},
  serious:{rate:'-4%',pitch:'-4Hz'},referee:{rate:'+6%',pitch:'+4Hz',volume:'+10%'},playful:{rate:'+8%',pitch:'+20Hz'},taunt:{rate:'+5%',pitch:'+12Hz'},
  calm:{rate:'-6%',pitch:'+2Hz'},epic:{rate:'-12%',pitch:'-12Hz',volume:'+10%'},celebrate:{rate:'+14%',pitch:'+24Hz',volume:'+10%'},shock:{rate:'+6%',pitch:'+24Hz'}};
