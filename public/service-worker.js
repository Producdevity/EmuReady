// Service Worker for EmuReady PWA
const CACHE_NAME = 'emuready-v1'
const urlsToCache = [
  '/',
  '/favicon/favicon-16x16.png',
  '/favicon/favicon-32x32.png',
  '/favicon/apple-touch-icon.png',
]

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache')
      // Handle each URL separately to prevent failing the entire batch
      return Promise.allSettled(
        urlsToCache.map((url) =>
          cache.add(url).catch((error) => {
            console.error(`Failed to cache ${url}:`, error)
            // Continue despite error
            return Promise.resolve()
          }),
        ),
      )
    }),
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
})

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  // Only handle HTTP and HTTPS requests
  if (
    !event.request.url.startsWith('http://') &&
    !event.request.url.startsWith('https://')
  ) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) return response

      // Clone the request because it's a stream that can only be consumed once
      const fetchRequest = event.request.clone()

      return fetch(fetchRequest)
        .then((response) => {
          // Check if we received a valid response
          if (
            !response ||
            response.status !== 200 ||
            response.type !== 'basic'
          ) {
            return response
          }

          // Clone the response because it's a stream that can only be consumed once
          const responseToCache = response.clone()

          caches
            .open(CACHE_NAME)
            .then((cache) => {
              // Don't cache API calls or other dynamic content
              if (!event.request.url.includes('/api/')) {
                cache.put(event.request, responseToCache)
              }
            })
            .catch((error) => console.error('Failed to cache response:', error))

          return response
        })
        .catch((error) => {
          console.error('Fetch failed:', error)
          // Could return a custom offline page here
          return new Response('Network error occurred', {
            status: 503,
            statusText: 'Service Unavailable',
          })
        })
    }),
  )
})

// Handle push notifications
self.addEventListener('push', (event) => {
  const data = event.data.json()
  const options = {
    body: data.body,
    icon: '/favicon/android-chrome-192x192.png',
    badge: '/favicon/android-chrome-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(clients.openWindow(event.notification.data.url))
})
