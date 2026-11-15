/* Atomic offline package. Caches and activation are scoped to this app path. */
'use strict';
const VERSION='5.0.0';
const ROOT=new URL('./',self.location.href);
const PREFIX='mathe-mission-scoped:'+ROOT.pathname+':';
const CACHE=PREFIX+VERSION;
const FILES=['index.html','bank.js','app.js','manifest.webmanifest','icon-192.png','icon-512.png','aktualisieren.html'];
const urls=FILES.map(f=>new URL(f,ROOT).href);
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  // Obtain the entire release before writing anything or taking control.
  const responses=await Promise.all(urls.map(async url=>{
   const r=await fetch(new Request(url,{cache:'reload',credentials:'same-origin'}));
   if(!r.ok)throw new Error('Incomplete app release: '+url);
   if(url.endsWith('index.html')&&!(await r.clone().text()).includes('bank.js?v='+VERSION))throw new Error('HTML version does not match.');
   if(url.endsWith('bank.js')&&!(await r.clone().text()).includes("VERSION = '"+VERSION+"'"))throw new Error('Task bank version does not match.');
   return r;
  }));
  const cache=await caches.open(CACHE);
  await Promise.all(urls.map((url,i)=>cache.put(url,responses[i])));
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const keys=await caches.keys();
 await Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)));
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 if(url.origin!==ROOT.origin||!url.pathname.startsWith(ROOT.pathname))return;
 let file=url.pathname.slice(ROOT.pathname.length);
 if(file===''||file==='index.html')file='index.html';
 if(!FILES.includes(file))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  const stored=await cache.match(new URL(file,ROOT).href);
  if(stored)return stored;
  return fetch(event.request);
 })());
});
self.addEventListener('message',event=>{
 if(event.data?.type==='STATUS')event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  const checks=await Promise.all(urls.map(url=>cache.match(url)));
  const result={type:'STATUS',version:VERSION,ready:checks.every(Boolean)};
  if(event.ports?.[0])event.ports[0].postMessage(result);
  else event.source?.postMessage(result);
 })());
 if(event.data?.type==='SKIP_WAITING')self.skipWaiting();
});
