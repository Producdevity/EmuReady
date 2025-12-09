/* eslint-env serviceworker */
/* global self, caches, clients */
// @ts-check
/// <reference lib="webworker" />

/* ------------------------------------------------------------------ */
/* Custom typedefs so the IDE knows about Service-Worker-only fields. */
/* ------------------------------------------------------------------ */

/**
 * Base event for Service Worker listeners (adds waitUntil).
 * @typedef {Event & { waitUntil(promise: Promise<any>): void }} SWExtendableEvent
 */

/**
 * Fetch event (adds request and respondWith).
 * @typedef {SWExtendableEvent & {
 *   request: Request,
 *   respondWith(value: Response|Promise<Response>): void
 * }} SWFetchEvent
 */

/**
 * Push event (adds data with json()).
 * @typedef {SWExtendableEvent & {
 *   data: { json(): any } | null
 * }} SWPushEvent
 */

/**
 * Notification-click event (adds notification).
 * @typedef {SWExtendableEvent & {
 *   notification: Notification
 * }} SWNotificationClickEvent
 */

/* ------------------------------------------------------------------ */
/* EmuReady Service Worker.                                           */
/* ------------------------------------------------------------------ */

/** Name of the runtime cache used by this Service Worker. */
const CACHE_NAME = 'emuready_v0.12.4'

/** URLs cached during the installation step */
const urlsToCache = [
  '/favicon/favicon-16x16.png',
  '/favicon/favicon-32x32.png',
  '/favicon/apple-touch-icon.png',
  '/favicon/android-chrome-192x192.png',
  '/favicon/android-chrome-512x512.png',
]

/** Cache duration for different asset types (in seconds) */
const CACHE_DURATIONS = {
  images: 7 * 24 * 60 * 60, // 604800 seconds
  scripts: 0, // Do not cache Next.js chunks to avoid stale JS
  api: 0, // No caching
  default: 60, // 60 seconds
}

/**
 * Install event: pre-cache static assets.
 * Fails the installation if **any** listed asset cannot be cached so that
 * a bad deploy rolls back automatically.
 * @param {SWExtendableEvent} event
 */
self.addEventListener(
  'install',
  /** @param {SWExtendableEvent} event */ (event) => {
    self.skipWaiting()
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)))
  },
)

/**
 * Activate event: delete old caches and take control immediately.
 * @param {SWExtendableEvent} event
 */
self.addEventListener(
  'activate',
  /** @param {SWExtendableEvent} event */ (event) => {
    event.waitUntil(
      (async () => {
        const cacheNames = await caches.keys()
        await Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName)),
        )
        await clients.claim()
      })(),
    )
  },
)

/**
 * Determine cache duration based on resource type
 * @param {string} url - The URL to check
 * @returns {number} Cache duration in seconds
 */
function getCacheDuration(url) {
  // API and tRPC endpoints must not be cached
  if (url.includes('/api/') || url.includes('/trpc/')) return CACHE_DURATIONS.api

  // Image file extensions
  if (/\.(png|jpg|jpeg|gif|webp|svg|ico)$/i.test(url)) return CACHE_DURATIONS.images

  // Next.js static assets with content hashing: bypass SW cache
  if (url.includes('/_next/static/')) return CACHE_DURATIONS.scripts

  // Default cache duration for unmatched resources
  return CACHE_DURATIONS.default
}

/**
 * Check if cached response is still fresh
 * @param {Response} response - The cached response
 * @param {number} maxAge - Maximum age in seconds
 * @returns {boolean} Whether the cache is still fresh
 */
function isCacheFresh(response, maxAge) {
  if (maxAge === 0) return false

  const cachedAt = response.headers.get('sw-cached-at')
  if (!cachedAt) return false

  const age = (Date.now() - parseInt(cachedAt)) / 1000
  return age < maxAge
}

/**
 * Fetch event handler with time-based cache expiration.
 * Implements cache policies based on resource type to prevent stale data.
 * @param {SWFetchEvent} event - The fetch event triggered by the browser.
 */
self.addEventListener(
  'fetch',
  /** @param {SWFetchEvent} event */ (event) => {
    // Process only GET requests
    if (event.request.method !== 'GET') return

    const url = new URL(event.request.url)

    // Process only same-origin requests
    if (url.origin !== self.location.origin) return

    // Bypass all Next.js internals and RSC/flight requests to avoid UI staleness
    const accept = event.request.headers.get('accept') || ''
    // - React Server Components / Flight payloads
    if (accept.includes('text/x-component')) return
    // - Next data requests (used by App Router)
    if (url.searchParams.has('__nextDataReq')) return
    // - Any Next internal asset or runtime path (not only /_next/static)
    if (url.pathname.startsWith('/_next/')) return

    // Special handling for API and tRPC routes - pass through without interference
    if (url.pathname.includes('/api/') || url.pathname.includes('/trpc/')) {
      // Let the browser handle API requests normally
      return
    }

    // Exclude HTML navigation requests from caching
    if (event.request.mode === 'navigate') return

    // Exclude HTML documents based on Accept header
    if (event.request.headers.get('accept')?.includes('text/html')) return

    const cacheDuration = getCacheDuration(url.pathname)

    // Bypass cache for zero-duration resources
    if (cacheDuration === 0) return

    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request)

        // Return cache if within validity period
        if (cached && isCacheFresh(cached, cacheDuration)) {
          return cached
        }

        // Fetch from network
        const fetchPromise = fetch(event.request.clone()).then((response) => {
          // Cache only successful basic responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }

          // Add timestamp header for cache expiration tracking
          const responseToCache = response.clone()
          const headers = new Headers(responseToCache.headers)
          headers.set('sw-cached-at', Date.now().toString())

          const modifiedResponse = new Response(responseToCache.body, {
            status: responseToCache.status,
            statusText: responseToCache.statusText,
            headers: headers,
          })

          // Asynchronously update cache
          cache.put(event.request, modifiedResponse).catch(() => {})

          return response
        })

        // Implement stale-while-revalidate pattern
        if (cached) return cached

        // Await network response when no cache exists
        return fetchPromise
      }),
    )
  },
)

/**
 * Push event: display a notification (no‑op if payload missing).
 * @param {SWPushEvent} event
 */
self.addEventListener(
  'push',
  /** @param {SWPushEvent} event */ (event) => {
    if (!event.data) return

    /** @type {{title: string, body: string, url?: string}} */
    const data = event.data.json()

    /** @type {NotificationOptions} */
    const options = {
      body: data.body,
      icon: '/favicon/android-chrome-192x192.png',
      badge: '/favicon/android-chrome-192x192.png',
      vibrate: [100, 50, 100],
      data: { url: data.url || '/' },
    }

    event.waitUntil(self.registration.showNotification(data.title, options))
  },
)

/**
 * Notification‑click event: focus an existing window if one is open, else open
 * a new one.
 * @param {SWNotificationClickEvent} event
 */
self.addEventListener(
  'notificationclick',
  /** @param {SWNotificationClickEvent} event */ (event) => {
    event.notification.close()
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
        for (const winClient of wins) {
          if (winClient.url === event.notification.data.url) return winClient.focus()
        }
        return clients.openWindow(event.notification.data.url)
      }),
    )
  },
)
