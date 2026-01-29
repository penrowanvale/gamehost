

const CACHE_NAME = 'gameblast-mobile-v1';
const urlsToCache = [
  '/',
  '/css/style.css',
  '/css/auth.css',
  '/css/games.css',
  '/css/game-details.css',
  '/js/app.js',
  '/js/auth.js',
  '/js/games.js',
  '/js/game-details.js',
  '/images/default-game.jpg',
  '/images/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        
        return response || fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});