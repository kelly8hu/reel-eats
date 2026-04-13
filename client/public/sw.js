const CACHE = 'reel-eats-v2'

// On activate, delete all old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Never intercept API calls — always go to the network
  if (url.pathname.startsWith('/api/')) return

  // Network-first for navigation requests so fresh HTML is always served
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request))
    return
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then(
      (cached) => cached ?? fetch(event.request)
    )
  )
})
