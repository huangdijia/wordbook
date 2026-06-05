const CACHE_NAME = 'wordbook-pwa-v3'
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/assets/css/style.css',
  '/assets/js/app.js',
  '/data/config.json',
  '/data/words/grade_1a.json',
  '/data/words/grade_1b.json',
  '/data/words/grade_2a.json',
  '/data/words/grade_2b.json',
  '/data/words/grade_3a.json',
  '/data/words/grade_3b.json',
  '/data/words/grade_4a.json',
  '/data/words/grade_4b.json',
  '/data/words/grade_5a.json',
  '/data/words/grade_5b.json',
  '/data/words/grade_6a.json',
  '/data/words/grade_6b.json',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png'
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const responseCopy = response.clone()
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseCopy))
        return response
      })
      .catch(() => caches.match(event.request).then(cachedResponse => cachedResponse || caches.match('/index.html')))
  )
})
