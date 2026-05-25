'use client'

import { useEffect } from 'react'

const SERVICE_WORKER_URL = '/sw.js'
const SERVICE_WORKER_SCOPE = '/'

interface Props {
  enabled: boolean
}

interface ServiceWorkerLocation {
  hostname: string
  protocol: string
}

export function shouldRegisterServiceWorker(enabled: boolean, location: ServiceWorkerLocation) {
  if (!enabled) return false

  const hostname = location.hostname.toLowerCase()
  if (
    hostname === 'dev.emuready.com' ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '[::1]' ||
    hostname.includes('.local')
  ) {
    return false
  }

  return location.protocol === 'https:'
}

function supportsServiceWorker() {
  return typeof navigator !== 'undefined' && 'serviceWorker' in navigator
}

async function clearAppCaches() {
  if (typeof window === 'undefined' || !('caches' in window)) return

  const cacheNames = await window.caches.keys()
  const appCacheNames = cacheNames.filter((cacheName) => cacheName.startsWith('emuready'))

  await Promise.all(appCacheNames.map((cacheName) => window.caches.delete(cacheName)))
}

async function unregisterAllServiceWorkers() {
  if (!supportsServiceWorker() || !navigator.serviceWorker.getRegistrations) return

  const registrations = await navigator.serviceWorker.getRegistrations()
  await Promise.all(registrations.map((registration) => registration.unregister()))
}

async function unregisterUnexpectedServiceWorkers() {
  if (!supportsServiceWorker() || !navigator.serviceWorker.getRegistrations) return

  const registrations = await navigator.serviceWorker.getRegistrations()
  const expectedScriptUrl = new URL(SERVICE_WORKER_URL, window.location.href).href

  await Promise.all(
    registrations
      .filter((registration) => {
        const scriptUrls = [
          registration.active?.scriptURL,
          registration.installing?.scriptURL,
          registration.waiting?.scriptURL,
        ].filter(Boolean)

        return (
          scriptUrls.length > 0 && scriptUrls.some((scriptUrl) => scriptUrl !== expectedScriptUrl)
        )
      })
      .map((registration) => registration.unregister()),
  )
}

export async function syncServiceWorker(
  enabled: boolean,
  location: ServiceWorkerLocation = window.location,
) {
  if (!supportsServiceWorker()) return

  if (!shouldRegisterServiceWorker(enabled, location)) {
    await unregisterAllServiceWorkers()
    await clearAppCaches()
    return
  }

  await unregisterUnexpectedServiceWorkers()
  await navigator.serviceWorker.register(SERVICE_WORKER_URL, {
    scope: SERVICE_WORKER_SCOPE,
    updateViaCache: 'none',
  })
}

export default function ServiceWorkerRegistrar(props: Props) {
  useEffect(() => {
    syncServiceWorker(props.enabled).catch((error: unknown) => {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Service worker setup failed', error)
      }
    })
  }, [props.enabled])

  return null
}
