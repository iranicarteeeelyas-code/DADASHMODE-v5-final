const VERSION='dadashmode-v5-all';
const CORE=['./','index.html','manifest.webmanifest','sw.js','css/app.css',
 'fonts/Vazirmatn-Variable.ttf','fonts/Lalezar-Regular.ttf','fonts/Estedad-Variable.ttf','fonts/Marhey-Variable.ttf','fonts/NotoKufiArabic-Variable.ttf',
 'icons/icon-192.png','icons/icon-512.png',
 'js/util.js','js/data.js','js/audio.js','js/voice4.js','js/ai.js','js/icons.js',
 'js/game.js','js/script4.js','js/stage.js','js/show.js','js/vfx4.js','js/sfx4.js','js/ui.js','js/control4.js',
 'js/p1-persist.js','js/p2-live-graphics.js','js/p345-core.js','js/p3-director.js','js/p4-voicecapture.js','js/p5-cinema.js','js/p5-three.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request).then(r=>{if(!r||r.status!==200||r.type==='error')return r;const c=r.clone();caches.open(VERSION).then(ca=>ca.put(e.request,c));return r}).catch(()=>caches.match('index.html'))))});
