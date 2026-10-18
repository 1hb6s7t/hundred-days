const CACHE='hundred-v5';
const ASSETS=['./','./index.html','./style.css','./app.js?v=4','./core.js','./plan.js?v=4','./routine.js?v=4','./daily-body.js?v=4','./views.js?v=4','./practice.js','./sync.js?v=2','./config.js?v=2','./icon.svg','./manifest.webmanifest'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('hundred-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||!ASSETS.some(path=>new URL(path,self.registration.scope).href===url.href))return;
 // Network first keeps deployed code current. Only app files are cached, never personal API responses.
 event.respondWith(fetch(event.request,{cache:'no-cache'}).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));}return response;}).catch(()=>caches.match(event.request)));
});
