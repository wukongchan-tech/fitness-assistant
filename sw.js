// Service Worker for 悟空在健身 PWA
const CACHE_NAME = 'wukong-fitness-v7';

// Files to cache on install
const CACHE_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-wukong.jpg',
  './icon.svg'
];

// Install: cache all static files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CACHE_FILES))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first strategy for local files, network-first for everything else
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Only handle same-origin and GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      // Return cached version if available
      if (cached) return cached;

      // Otherwise fetch from network and cache it
      return fetch(event.request).then(response => {
        // Don't cache non-ok responses or non-same-origin
        if (!response || response.status !== 200 || url.origin !== location.origin) {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => {
        // Offline fallback: return index.html for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
