// LifeQuest Service Worker (поддерживает английскую и русскую версии)
const CACHE = 'lifequest-v1.4.0';
const ASSETS = [
  './',
  './index.html',
  './app.html',
  './app-ru.html',
  './manifest.json',
  './manifest-ru.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Inter:wght@400;600;700&display=swap'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => {
      console.log('Caching assets');
      return cache.addAll(ASSETS).catch((err) => console.warn('Failed to cache some assets:', err));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  e.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req).then((res) => {
        if (res && res.status === 200) {
          const url = new URL(req.url);
          if (url.origin === location.origin || url.host.includes('fonts.g')) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
        }
        return res;
      }).catch(() => {
        if (req.headers.get('accept').includes('text/html')) {
          return caches.match(req).then(cached => cached || caches.match('./index.html'));
        }
        return new Response('Нет соединения с интернетом', { status: 503 });
      });
    })
  );
});
