const VERSION='hifz-app-v1.1';
const APP=['./','./index.html','./style.css','./app.js','./engine.js','./orthography.json','./quran.json','./reciters.json','./AmiriQuran-Regular.ttf','./icon.svg','./icon-192.png','./icon-512.png','./manifest.webmanifest'];
self.addEventListener('install',e=>e.waitUntil(caches.open(VERSION).then(c=>c.addAll(APP)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('hifz-app-')&&k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(VERSION).then(c=>c.put(e.request,copy));}return r;}).catch(async()=>await caches.match(e.request)||new Response('Offline. Open the app online once to save it.',{status:503,headers:{'Content-Type':'text/plain'}})));});
