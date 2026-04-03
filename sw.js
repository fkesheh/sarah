const CACHE_NAME = 'sarah-games-v1';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/games/tamagotchi/',
  '/games/tamagotchi/index.html',
  '/games/tamagotchi/js/config.js',
  '/games/tamagotchi/js/pets.js',
  '/games/tamagotchi/js/sprites.js',
  '/games/tamagotchi/js/state.js',
  '/games/tamagotchi/js/animation.js',
  '/games/tamagotchi/js/simulation.js',
  '/games/tamagotchi/js/input.js',
  '/games/tamagotchi/js/render.js',
  '/games/tamagotchi/js/main.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
