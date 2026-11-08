const CACHE_NAME = 'french-bac-v1';
const urlsToCache = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './app.js',
  './bac.js',
  './chansons.js',
  './chat.js',
  './exams.js',
  './phrase.js',
  './france.js',
  './lexique.js',
  './phonetique.js',
  './dialogues.js',
  './contes.js',
  './zoza.js',
  './splash.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // إذا وجدنا الملف في الكاش نعيده، وإلا نطلبه من الشبكة
        return response || fetch(event.request).catch(() => {
          // يمكن هنا إضافة صفحة بديلة للاتصال المقطوع إن رغبتِ
        });
      })
  );
});
