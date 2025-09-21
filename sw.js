const CACHE_NAME = 'the-game-cache-v4';
const urlsToCache = [
  '/',
  '/index.html',
  '/logo.png',
  'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap'
];


// --- Service Worker Lifecycle ---

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  // Clean up old caches
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('push', event => {
  if (!event.data) {
    console.log('Push event but no data');
    return;
  }
  const data = event.data.json();
  console.log('Push received:', data);

  const title = data.title || 'The Game Reminder';
  const options = {
    body: data.body,
    icon: '/logo.png',
    badge: '/logo.png',
  };

  event.waitUntil(self.registration.showNotification(title, options));
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