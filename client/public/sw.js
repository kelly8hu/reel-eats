const CACHE = 'reel-eats-v1'

// Cache the app shell on install so the share target opens instantly
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(['/']))
  )
  self.skipWaiting()
})

self.addEventListener('activate', () => {
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Never intercept API calls — always go to the network
  if (url.pathname.startsWith('/api/')) return

  // Cache-first for app shell assets; fall back to network
  event.respondWith(
    caches.match(event.request).then(
      (cached) => cached ?? fetch(event.request)
    )
  )
})
