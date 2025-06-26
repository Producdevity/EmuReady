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
 *   data: { json(): any }
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
const CACHE_NAME = 'emuready-v1'

/** URLs cached during the installation step. */
const urlsToCache = [
  '/',
  '/favicon/favicon-16x16.png',
  '/favicon/favicon-32x32.png',
  '/favicon/apple-touch-icon.png',
]

/**
 * Install event: pre-cache static assets.
 * @param {SWExtendableEvent} event
 */
self.addEventListener(
  'install',
  /** @param {SWExtendableEvent} event */ (event) => {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        console.log('Opened cache')
        return Promise.allSettled(
          urlsToCache.map((url) =>
            cache.add(url).catch((error) => {
              console.error(`Failed to cache ${url}:`, error)
              return Promise.resolve()
            }),
          ),
        )
      }),
    )
  },
)

/**
 * Activate event: delete old caches.
 * @param {SWExtendableEvent} event
 */
self.addEventListener(
  'activate',
  /** @param {SWExtendableEvent} event */ (event) => {
    event.waitUntil(
      caches
        .keys()
        .then((cacheNames) =>
          Promise.all(
            cacheNames.map((cacheName) =>
              cacheName !== CACHE_NAME ? caches.delete(cacheName) : undefined,
            ),
          ),
        ),
    )
  },
)

/**
 * Fetch event: serve from cache, else network, then cache result.
 * Handles same-origin GET over HTTP(S) only.
 * @param {SWFetchEvent} event
 */
self.addEventListener(
  'fetch',
  /** @param {SWFetchEvent} event */ (event) => {
    if (
      event.request.method !== 'GET' ||
      (!event.request.url.startsWith('http://') &&
        !event.request.url.startsWith('https://'))
    ) {
      return
    }

    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse

        /** Clone because a Request can be used only once. */
        const fetchRequest = event.request.clone()

        return fetch(fetchRequest)
          .then((networkResponse) => {
            if (
              !networkResponse ||
              networkResponse.status !== 200 ||
              networkResponse.type !== 'basic'
            ) {
              return networkResponse
            }

            const responseClone = networkResponse.clone()

            caches.open(CACHE_NAME).then((cache) => {
              if (!event.request.url.includes('/api/')) {
                cache
                  .put(event.request, responseClone)
                  .catch((err) =>
                    console.error('Failed to cache response:', err),
                  )
              }
            })

            return networkResponse
          })
          .catch((err) => {
            console.error('Fetch failed:', err)
            return new Response('Network error occurred', {
              status: 503,
              statusText: 'Service Unavailable',
            })
          })
      }),
    )
  },
)

/**
 * Push event: display a notification.
 * @param {SWPushEvent} event
 */
self.addEventListener(
  'push',
  /** @param {SWPushEvent} event */ (event) => {
    /** @type {{title: string, body: string, url?: string}} */
    const data = event.data.json()

    /** @type {NotificationOptions} */
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
  },
)

/**
 * Notification-click event: open the URL stored in the notification.
 * @param {SWNotificationClickEvent} event
 */
self.addEventListener(
  'notificationclick',
  /** @param {SWNotificationClickEvent} event */ (event) => {
    event.notification.close()
    event.waitUntil(clients.openWindow(event.notification.data.url))
  },
)
