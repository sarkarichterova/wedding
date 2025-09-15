// v2 – do NOT cache navigation requests (HTML)
const MEDIA_CACHE = 'media-v2';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => !['media-v2'].includes(k)).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Don’t cache navigations (HTML) – always get fresh code
  if (event.request.mode === 'navigate') return;

  const isMedia =
    url.href.includes('/storage/v1/object/public/photos/') ||
    url.href.includes('/storage/v1/object/public/audio-');

  if (isMedia) {
    event.respondWith((async () => {
      const cache = await caches.open(MEDIA_CACHE);
      const cached = await cache.match(event.request);
      if (cached) return cached;
      try {
        const resp = await fetch(event.request);
        if (resp.ok) cache.put(event.request, resp.clone());
        return resp;
      } catch {
        return cached || Response.error();
      }
    })());
  }
});