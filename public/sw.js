self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Pass-through fetch event: required for PWA installation, but doesn't cache anything
self.addEventListener('fetch', (event) => {
  // Let the browser fetch from the network directly
  return;
});
