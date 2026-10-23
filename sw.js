/* Offline support: keeps the app's own files so it opens without a signal.
   The page comes from the network when it answers within 2.5 s (so updates
   show up), otherwise from the cache. Sync requests to Google are never touched. */
const CACHE = "headset-batteries-v1";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon.svg", "icon-192.png", "icon-512.png", "icon-maskable-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if(req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  const net = fetch(req).then(res => {
    if(res.ok){ const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  });
  const slow = new Promise((_, reject) => setTimeout(reject, 2500));
  e.respondWith(
    Promise.race([net, slow]).catch(() =>
      caches.match(req, { ignoreSearch:true })
        .then(hit => hit || (req.mode === "navigate" ? caches.match("index.html") : null))
        .then(hit => hit || net)
    )
  );
});
