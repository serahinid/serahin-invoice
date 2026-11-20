/* Serahin.id Invoice — service worker (offline) */
const VERSION = "serahin-v3";
const SHELL = ["./", "./index.html", "./config.js", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png"];
const CDN = /^https:\/\/(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)\//;

self.addEventListener("install", e=>{ e.waitUntil(caches.open(VERSION).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())); });
self.addEventListener("activate", e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener("fetch", e=>{
  const req = e.request;
  if(req.method !== "GET") return;                                   // sinkron ke Apps Script tidak di-cache
  const url = new URL(req.url);
  if(url.hostname.endsWith("script.google.com") || url.hostname.endsWith("googleusercontent.com")) return;
  if(url.origin === location.origin){
    // aplikasi: ambil versi baru kalau online, pakai cache kalau offline
    e.respondWith(fetch(req).then(r=>{ const cp = r.clone(); caches.open(VERSION).then(c=>c.put(req, cp)); return r; }).catch(()=>caches.match(req).then(r=>r || caches.match("./index.html"))));
  }else if(CDN.test(req.url)){
    // pustaka (jsPDF, Chart.js) & font: cache dulu
    e.respondWith(caches.match(req).then(r=>r || fetch(req).then(res=>{ const cp = res.clone(); caches.open(VERSION).then(c=>c.put(req, cp)); return res; })));
  }
});
