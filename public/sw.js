// Service Worker básico para PWA do NegociaPro
const CACHE_NAME = 'negociapro-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through padrão para navegação fluida
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
