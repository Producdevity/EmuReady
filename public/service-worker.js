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
const CACHE_NAME = 'emuready_v0.7.52'

/** URLs cached during the installation step. */
const urlsToCache = [
  '/favicon/favicon-16x16.png',
  '/favicon/favicon-32x32.png',
  '/favicon/apple-touch-icon.png',
  '/favicon/android-chrome-192x192.png',
  '/favicon/android-chrome-512x512.png',
]

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
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)),
    )
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
 * Fetch event:
 *   • Navigations (HTML) are left to the network (no caching).
 *   • Same‑origin asset GETs use cache‑first, then network.
 * @param {SWFetchEvent} event - The fetch event triggered by the browser.
 */
self.addEventListener(
  'fetch',
  /** @param {SWFetchEvent} event */ (event) => {
    // Only handle GET for http(s) and same‑origin assets.
    return // temporarily disabled
    if (event.request.method !== 'GET') return
    if (
      !event.request.url.startsWith('http://') &&
      !event.request.url.startsWith('https://')
    )
      return

    const url = new URL(event.request.url)
    if (url.origin !== self.location.origin) return

    // Never cache navigations (dynamic HTML).
    if (event.request.mode === 'navigate') return

    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached

        const fetchRequest = event.request.clone()
        return fetch(fetchRequest).then((netRes) => {
          if (!netRes || netRes.status !== 200 || netRes.type !== 'basic')
            return netRes

          const resClone = netRes.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, resClone).catch(() => {})
          })
          return netRes
        })
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
      clients
        .matchAll({ type: 'window', includeUncontrolled: true })
        .then((wins) => {
          for (const winClient of wins) {
            if (winClient.url === event.notification.data.url)
              return winClient.focus()
          }
          return clients.openWindow(event.notification.data.url)
        }),
    )
  },
)
