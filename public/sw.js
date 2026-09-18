// Service Worker com auto-limpeza de cache e bypass para navegação
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Sempre buscar versão fresca da rede para navegação
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch((err) => {
        return caches.match(event.request);
      })
    );
    return;
  }
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
