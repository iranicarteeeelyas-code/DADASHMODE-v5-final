/* DADASHMODE v4 · sound design upgrade
   - stereo room reverb on every effect, layered impacts, risers, stingers, shimmer reveals, crowd cheer, applause, heartbeat, glitch
   - rhythmic music beds (play = driving pulse, suspense = heartbeat + tension drone) that duck under the host voice
   - PRO SFX BANK: drop your own licensed WAV/MP3 into any slot (stored offline); your file replaces the synthesized sound */
'use strict';
function makeIR(c,dur=2.3,decay=2.4){const n=Math.floor(c.sampleRate*dur),b=c.createBuffer(2,n,c.sampleRate);for(let ch=0;ch<2;ch++){const d=b.getChannelData(ch);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,decay)*(i<c.sampleRate*.012?i/(c.sampleRate*.012):1)}return b}
const _aeInit=AE.init.bind(AE);
AE.init=function(){if(this.ctx)return;_aeInit();const c=this.ctx;try{this.rev=c.createConvolver();this.rev.buffer=makeIR(c);this.revIn=c.createGain();this.revIn.gain.value=.3;const ro=c.createGain();ro.gain.value=.85;this.sfx.connect(this.revIn);this.revIn.connect(this.rev);this.rev.connect(ro);ro.connect(this.master);
  this.custom={};decodeCustomSfx()}catch(e){console.warn(e)}};
/* helpers with stereo pan */
AE.pan=function(node,from,to,dur,when=0){const c=this.ctx;if(!c.createStereoPanner)return node;const p=c.createStereoPanner();const t=c.currentTime+when;p.pan.setValueAtTime(from,t);p.pan.linearRampToValueAtTime(to,t+dur);node.connect(p);return p};
AE.nz=function(dur,{type='bandpass',f0=800,f1=800,q=1,peak=.6,att=.3,when=0,pan=null,dest=null}={}){const c=this.ctx,t=c.currentTime+when,n=c.createBufferSource();n.buffer=this.noiseBuf;n.loop=true;const f=c.createBiquadFilter();f.type=type;f.Q.value=q;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);const gg=c.createGain();this.env(gg,t,Math.max(.003,dur*att),peak,dur*(1-att));n.connect(f);f.connect(gg);let out=gg;if(pan)out=this.pan(gg,pan[0],pan[1],dur,when);out.connect(dest||this.sfx);n.start(t,Math.random());n.stop(t+dur+.05)};
AE.osc=function(freq,dur,{type='sine',peak=.4,when=0,slide=0,att=.006,dest=null,detune=0}={}){const c=this.ctx,t=c.currentTime+when,o=c.createOscillator(),gg=c.createGain();o.type=type;o.detune.value=detune;o.frequency.setValueAtTime(freq,t);if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+dur);this.env(gg,t,att,peak,dur);o.connect(gg);gg.connect(dest||this.sfx);o.start(t);o.stop(t+dur+.05)};
const SYN={
  impact(){AE.osc(95,1.3,{peak:.95,slide:28});AE.osc(55,.9,{type:'triangle',peak:.5,slide:35});AE.nz(.45,{type:'lowpass',f0:4500,f1:180,peak:.55,att:.02});AE.nz(1.6,{type:'lowpass',f0:500,f1:60,peak:.25,att:.05})},
  boom(){SYN.impact();AE.nz(2.2,{type:'lowpass',f0:260,f1:40,peak:.3,att:.1})},
  hit(){AE.osc(80,.6,{peak:.85,slide:38});AE.nz(.22,{type:'highpass',f0:2500,f1:900,peak:.45,att:.02})},
  whoosh(){AE.nz(.7,{f0:300,f1:6000,q:1.4,peak:.75,att:.55,pan:[-.9,.9]});AE.nz(.7,{type:'highpass',f0:2000,f1:9000,peak:.2,att:.6,pan:[.9,-.9]})},
  riser(d=2.2){AE.nz(d,{type:'highpass',f0:250,f1:9000,peak:.5,att:.95});AE.osc(110,d,{type:'sawtooth',peak:.09,slide:880,att:d*.9});AE.osc(111,d,{type:'sawtooth',peak:.07,slide:890,att:d*.9,detune:12})},
  sweepUp(){SYN.riser(1.1)},
  stinger(){[261.6,329.6,392,523.3].forEach((f,i)=>{AE.osc(f,1.4,{type:'sawtooth',peak:.09,att:.01});AE.osc(f*1.004,1.4,{type:'square',peak:.04})});SYN.impact()},
  reveal(){[1046.5,1318.5,1568,2093,2637].forEach((f,i)=>AE.osc(f,1.6,{peak:.16,when:i*.06,att:.004}));AE.nz(1.4,{type:'highpass',f0:6000,f1:12000,peak:.18,att:.1})},
  ding(){[1,2.76,5.4].forEach((r,i)=>AE.osc(1175*r,1.4/(i+1),{peak:.3/(i+1),att:.002}))},
  coin(){AE.osc(988,.09,{type:'square',peak:.16});AE.osc(1319,.45,{type:'square',peak:.14,when:.08});AE.osc(2637,.4,{peak:.06,when:.08})},
  lose(){[392,330,262,196].forEach((f,i)=>AE.osc(f,.45,{type:'triangle',peak:.3,when:i*.22,slide:f*.97}));AE.osc(98,1.2,{type:'sawtooth',peak:.08,when:.66,slide:70})},
  tick(){AE.osc(2100,.04,{type:'square',peak:.15});AE.nz(.03,{type:'highpass',f0:5000,f1:5000,peak:.2,att:.1})},
  lock(){AE.osc(180,.08,{type:'square',peak:.35});AE.nz(.12,{f0:4000,f1:1500,peak:.5,when:.04});AE.osc(90,.3,{peak:.5,when:.05,slide:60});AE.osc(3200,.25,{peak:.05,when:.05})},
  buzzer(){AE.osc(140,.8,{type:'sawtooth',peak:.33});AE.osc(147,.8,{type:'sawtooth',peak:.28});AE.osc(70,.8,{type:'square',peak:.1})},
  siren(){for(let i=0;i<3;i++){AE.osc(700,.28,{type:'sawtooth',peak:.14,when:i*.32,slide:1100});AE.osc(1100,.28,{type:'sawtooth',peak:.12,when:i*.32+.16,slide:700})}},
  fanfare(){const ch=[[523.3,659.3,784],[587.3,740,880],[659.3,830.6,987.8,1318.5]];ch.forEach((c,k)=>c.forEach(f=>{AE.osc(f,k===2?1.6:.32,{type:'sawtooth',peak:.075,when:k*.26,att:.02});AE.osc(f/2,k===2?1.6:.32,{type:'square',peak:.035,when:k*.26})}));setTimeout(()=>SYN.impact(),520);setTimeout(()=>SYN.reveal(),560)},
  heartbeat(n=4){for(let i=0;i<n;i++){AE.osc(62,.18,{peak:.8,when:i*.85,slide:40});AE.osc(55,.2,{peak:.6,when:i*.85+.22,slide:38})}},
  cheer(d=3.2){for(let i=0;i<14;i++){const f=500+Math.random()*2200;AE.nz(d*(.6+Math.random()*.4),{f0:f,f1:f*(.8+Math.random()*.5),q:3,peak:.09,att:.2,when:Math.random()*.4,pan:[Math.random()*2-1,Math.random()*2-1]})}for(let i=0;i<3;i++)AE.osc(2400+Math.random()*900,.5,{peak:.05,when:.3+Math.random()*1.5,slide:3200})},
  applause(d=3){for(let i=0;i<d*38;i++)AE.nz(.03,{type:'bandpass',f0:1200+Math.random()*2500,f1:1500,q:.8,peak:.14*Math.random()+.05,att:.1,when:Math.random()*d,pan:[Math.random()*2-1,Math.random()*2-1]})},
  glitch(){for(let i=0;i<9;i++)AE.osc(120+Math.random()*2400,.035,{type:'square',peak:.14,when:i*.045});AE.nz(.4,{type:'highpass',f0:3000,f1:8000,peak:.15,att:.05})}};
Object.assign(SFX_LIST,{impact:'ضربهٔ سینمایی',riser:'اوج‌گیری بلند',stinger:'استینگر',reveal:'افشا (درخشش)',heartbeat:'ضربان قلب',cheer:'تشویق جمعیت',applause:'دست زدن',glitch:'گلیچ'});
const BED_SLOTS={bed_play:'موسیقی زمینهٔ بازی',bed_suspense:'موسیقی زمینهٔ تعلیق'};
/* custom file bank */
async function decodeCustomSfx(){if(!AE.ctx)return;for(const k of [...Object.keys(SFX_LIST),...Object.keys(BED_SLOTS)]){try{const blob=await DB.get('kv','sfx:'+k);if(blob)AE.custom[k]=await AE.ctx.decodeAudioData(await blob.arrayBuffer())}catch(e){}}}
function playCustom(k){const b=AE.custom&&AE.custom[k];if(!b)return false;const s=AE.ctx.createBufferSource();s.buffer=b;s.connect(AE.sfx);s.start();return true}
for(const k of Object.keys(SFX_LIST)){const syn=SYN[k]||AE[k]&&AE[k].bind(AE);AE[k]=function(...a){if(!this.ctx)return;if(playCustom(k))return;syn&&syn(...a)}}
AE.vault=function(){if(!this.ctx)return;if(playCustom('vault'))return;SYN.riser(1.1);[0,.35,.7].forEach(w=>setTimeout(()=>AE.lock(),w*1000));setTimeout(()=>AE.fanfare(),1150)};
AE.drumroll=function(d){if(!this.ctx)return;for(let i=0;i<d*24;i++){const w=i/24;this.noiseAt(w,.05,.1+.5*(w/d))}AE.osc(60,d,{peak:.15,att:.9,slide:90})};
/* rhythmic beds */
AE.bedOn=function(kind){if(!S.musicBed||!this.ctx)return;this.bedOff();const c=this.ctx;const bed=kind==='play'?'bed_play':'bed_suspense';const t0=c.currentTime;
  const k=this.bed;k.gain.cancelScheduledValues(t0);k.gain.setValueAtTime(k.gain.value,t0);k.gain.linearRampToValueAtTime(kind==='play'?.09:.08,t0+1);
  if(this.custom&&this.custom[bed]){const s=c.createBufferSource();s.buffer=this.custom[bed];s.loop=true;s.connect(k);s.start();this._bed=[s];return}
  const nodes=[];const drone=(f,type,g0)=>{const o=c.createOscillator(),gg=c.createGain(),fl=c.createBiquadFilter();o.type=type;o.frequency.value=f;fl.type='lowpass';fl.frequency.value=kind==='play'?700:420;gg.gain.value=g0;o.connect(fl);fl.connect(gg);gg.connect(k);o.start();nodes.push(o)};
  if(kind==='play'){drone(55,'sawtooth',.25);drone(82.4,'sawtooth',.12)}else{drone(49,'sawtooth',.25);drone(73.4,'sine',.2);drone(51.9,'sawtooth',.08)}
  const bpm=kind==='play'?124:66,beat=60/bpm;let next=c.currentTime+.05,n=0;
  const kick=(t,p)=>{const o=c.createOscillator(),gg=c.createGain();o.frequency.setValueAtTime(140,t);o.frequency.exponentialRampToValueAtTime(42,t+.18);gg.gain.setValueAtTime(p,t);gg.gain.exponentialRampToValueAtTime(.001,t+.3);o.connect(gg);gg.connect(k);o.start(t);o.stop(t+.32)};
  const hat=(t,p)=>{const s=c.createBufferSource(),f=c.createBiquadFilter(),gg=c.createGain();s.buffer=this.noiseBuf;f.type='highpass';f.frequency.value=7000;gg.gain.setValueAtTime(p,t);gg.gain.exponentialRampToValueAtTime(.001,t+.05);s.connect(f);f.connect(gg);gg.connect(k);s.start(t,Math.random());s.stop(t+.06)};
  const iv=setInterval(()=>{while(next<c.currentTime+.2){if(kind==='play'){kick(next,1);hat(next+beat/2,.35);if(n%4===3)hat(next+beat*.75,.25)}else{kick(next,.9);kick(next+.22,.6)}next+=beat;n++}},60);
  this._bed=nodes;this._bedIv=iv};
AE.bedOff=function(){if(this._bedIv){clearInterval(this._bedIv);this._bedIv=null}if(!this._bed)return;const t=this.ctx.currentTime;this.bed.gain.cancelScheduledValues(t);this.bed.gain.setValueAtTime(this.bed.gain.value,t);this.bed.gain.linearRampToValueAtTime(0,t+.5);const b=this._bed;this._bed=null;setTimeout(()=>b.forEach(o=>{try{o.stop()}catch(e){}}),700)};
AE.duck=function(on){if(!this._bed)return;const t=this.ctx.currentTime;this.bed.gain.cancelScheduledValues(t);this.bed.gain.setValueAtTime(this.bed.gain.value,t);this.bed.gain.linearRampToValueAtTime(on?.022:.085,t+.25)};
