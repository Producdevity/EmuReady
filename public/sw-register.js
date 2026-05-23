const CACHE_NAME = 'emuready_v0.13.2'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    if ('caches' in window) {
      caches.keys().then(function (names) {
        for (let name of names) {
          if (name.startsWith('emuready') && name !== CACHE_NAME) {
            caches
              .delete(name)
              .then(function () {
                console.log('Deleted outdated cache:', name)
              })
              .catch(function (err) {
                console.error('Error deleting cache:', name, err)
              })
          }
        }
      })
    }
  })

  // Service worker registration
  const isDevelopment =
    window.location.hostname === 'dev.emuready.com' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('.local') ||
    (window.location.protocol === 'http:' && !window.location.hostname.includes('emuready'))
  const isServiceWorkerEnabled = window.__EMUREADY_SW_ENABLED__ === true

  if (isDevelopment || !isServiceWorkerEnabled) {
    console.log('Service Worker disabled; unregistering any existing SW and clearing caches')
    // Proactively unregister any active service workers for this origin
    if (navigator.serviceWorker.getRegistrations) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
        .catch((err) => console.warn('SW unregister failed', err))
    }
    if ('caches' in window) {
      caches
        .keys()
        .then((names) => Promise.all(names.map((n) => caches.delete(n))))
        .catch((err) => console.warn('Cache clear failed', err))
    }
  } else {
    window.addEventListener('load', async function () {
      const swUrl = '/service-worker.js'

      if (navigator.serviceWorker.getRegistrations) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        const currentSwUrl = new URL(swUrl, window.location.href).href

        for (const registration of registrations) {
          if (registration.active && registration.active.scriptURL !== currentSwUrl) {
            await registration.unregister()
          }
        }
      }

      navigator.serviceWorker
        .register(swUrl, { updateViaCache: 'none' })
        .then(function (registration) {
          console.log('Service Worker registered with scope:', registration.scope)
        })
        .catch(function (error) {
          console.error('Service Worker registration failed:', error)
        })
    })
  }
}
